from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Sequence

from sqlalchemy import Date, and_, case, cast, desc, func, literal, or_, select
from sqlalchemy.orm import Session

from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.finance.models import (
    PENDING_PAYMENT_STATUSES,
    REVENUE_PAYMENT_STATUSES,
    Payment,
    PaymentStatus,
)
from app.modules.inventory.models import (
    InventoryItem,
    InventoryMovement,
    MovementType,
)
from app.modules.medical_records.models import MedicalRecord
from app.modules.patients.models import Patient
from app.modules.users.models import User


# ============================================================================
# Patients aggregations
# ============================================================================


class PatientsReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def count_created_between(self, *, start: datetime, end: datetime) -> int:
        stmt = select(func.count(Patient.id)).where(
            Patient.created_at >= start,
            Patient.created_at < end,
        )
        return int(self.db.execute(stmt).scalar_one())

    def count_active(self) -> int:
        stmt = select(func.count(Patient.id)).where(Patient.is_active.is_(True))
        return int(self.db.execute(stmt).scalar_one())

    def count_inactive(self) -> int:
        stmt = select(func.count(Patient.id)).where(Patient.is_active.is_(False))
        return int(self.db.execute(stmt).scalar_one())

    def count_missing_contact(self) -> int:
        # Considera "incompleto" quem está sem email — telefone é NOT NULL no schema.
        stmt = select(func.count(Patient.id)).where(
            Patient.is_active.is_(True),
            or_(Patient.email.is_(None), Patient.email == ""),
        )
        return int(self.db.execute(stmt).scalar_one())

    def by_city(self, *, limit: int = 20) -> list[tuple[str, int]]:
        stmt = (
            select(Patient.city, func.count(Patient.id).label("c"))
            .where(Patient.is_active.is_(True))
            .group_by(Patient.city)
            .order_by(desc("c"), Patient.city.asc())
            .limit(limit)
        )
        return [(row[0], int(row[1])) for row in self.db.execute(stmt).all()]

    def recent(
        self, *, start: datetime, end: datetime, limit: int = 10
    ) -> Sequence[Patient]:
        stmt = (
            select(Patient)
            .where(
                Patient.created_at >= start,
                Patient.created_at < end,
            )
            .order_by(Patient.created_at.desc(), Patient.id.desc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()


# ============================================================================
# Appointments aggregations
# ============================================================================


class AppointmentsReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def _base(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
    ):
        conds = [
            Appointment.scheduled_start >= start,
            Appointment.scheduled_start < end,
        ]
        if dentist_id is not None:
            conds.append(Appointment.dentist_id == dentist_id)
        return and_(*conds)

    def total_and_status(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
    ) -> tuple[int, int, int, int]:
        """Retorna (total, completed, canceled, no_show) na janela."""
        where = self._base(start=start, end=end, dentist_id=dentist_id)

        total = self.db.execute(
            select(func.count(Appointment.id)).where(where)
        ).scalar_one()

        def count_for(status_value: AppointmentStatus) -> int:
            return int(
                self.db.execute(
                    select(func.count(Appointment.id)).where(
                        where, Appointment.status == status_value
                    )
                ).scalar_one()
            )

        return (
            int(total),
            count_for(AppointmentStatus.COMPLETED),
            count_for(AppointmentStatus.CANCELED),
            count_for(AppointmentStatus.NO_SHOW),
        )

    def by_status(
        self, *, start: datetime, end: datetime, dentist_id: Optional[int]
    ) -> list[tuple[str, int]]:
        where = self._base(start=start, end=end, dentist_id=dentist_id)
        stmt = (
            select(Appointment.status, func.count(Appointment.id).label("c"))
            .where(where)
            .group_by(Appointment.status)
            .order_by(desc("c"))
        )
        return [
            (row[0].value if hasattr(row[0], "value") else str(row[0]), int(row[1]))
            for row in self.db.execute(stmt).all()
        ]

    def by_dentist(
        self, *, start: datetime, end: datetime, dentist_id: Optional[int]
    ) -> list[tuple[int, str, int]]:
        where = self._base(start=start, end=end, dentist_id=dentist_id)
        stmt = (
            select(
                Appointment.dentist_id,
                User.name,
                func.count(Appointment.id).label("c"),
            )
            .join(User, User.id == Appointment.dentist_id)
            .where(where)
            .group_by(Appointment.dentist_id, User.name)
            .order_by(desc("c"), User.name.asc())
        )
        return [
            (int(row[0]), str(row[1]), int(row[2]))
            for row in self.db.execute(stmt).all()
        ]

    def by_day(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
    ) -> list[tuple[date, int]]:
        where = self._base(start=start, end=end, dentist_id=dentist_id)
        day_col = cast(Appointment.scheduled_start, Date).label("day")
        stmt = (
            select(day_col, func.count(Appointment.id).label("c"))
            .where(where)
            .group_by(day_col)
            .order_by(day_col.asc())
        )
        return [(row[0], int(row[1])) for row in self.db.execute(stmt).all()]

    def most_common_reasons(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
        limit: int = 10,
    ) -> list[tuple[str, int]]:
        where = self._base(start=start, end=end, dentist_id=dentist_id)
        # Agrupa por LOWER(reason) para juntar variações de capitalização.
        reason_col = func.lower(Appointment.reason).label("reason")
        stmt = (
            select(reason_col, func.count(Appointment.id).label("c"))
            .where(where, Appointment.reason.isnot(None))
            .group_by(reason_col)
            .order_by(desc("c"))
            .limit(limit)
        )
        return [(row[0], int(row[1])) for row in self.db.execute(stmt).all()]

    # Helpers usados pelo dashboard / exports

    def count_in_window(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int] = None,
        statuses: Optional[Sequence[AppointmentStatus]] = None,
    ) -> int:
        conds = [
            Appointment.scheduled_start >= start,
            Appointment.scheduled_start < end,
        ]
        if dentist_id is not None:
            conds.append(Appointment.dentist_id == dentist_id)
        if statuses:
            conds.append(Appointment.status.in_(list(statuses)))
        stmt = select(func.count(Appointment.id)).where(and_(*conds))
        return int(self.db.execute(stmt).scalar_one())

    def list_in_window(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int] = None,
        statuses: Optional[Sequence[AppointmentStatus]] = None,
        limit: int = 1000,
    ) -> Sequence[Appointment]:
        conds = [
            Appointment.scheduled_start >= start,
            Appointment.scheduled_start < end,
        ]
        if dentist_id is not None:
            conds.append(Appointment.dentist_id == dentist_id)
        if statuses:
            conds.append(Appointment.status.in_(list(statuses)))
        stmt = (
            select(Appointment)
            .where(and_(*conds))
            .order_by(Appointment.scheduled_start.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

    def list_upcoming(
        self,
        *,
        from_dt: datetime,
        dentist_id: Optional[int] = None,
        limit: int = 5,
    ) -> Sequence[Appointment]:
        conds = [
            Appointment.scheduled_start >= from_dt,
            Appointment.status.in_(
                [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED]
            ),
        ]
        if dentist_id is not None:
            conds.append(Appointment.dentist_id == dentist_id)
        stmt = (
            select(Appointment)
            .where(and_(*conds))
            .order_by(Appointment.scheduled_start.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()


# ============================================================================
# Finance aggregations
# ============================================================================


class FinanceReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def revenue_total(
        self, *, start: datetime, end: datetime
    ) -> tuple[Decimal, int]:
        stmt = select(
            func.coalesce(func.sum(Payment.amount), 0),
            func.count(Payment.id),
        ).where(
            Payment.status.in_(list(REVENUE_PAYMENT_STATUSES)),
            Payment.paid_at >= start,
            Payment.paid_at < end,
        )
        total, count = self.db.execute(stmt).one()
        return Decimal(total), int(count)

    def pending_total(self) -> tuple[Decimal, int]:
        stmt = select(
            func.coalesce(func.sum(Payment.amount), 0),
            func.count(Payment.id),
        ).where(Payment.status.in_(list(PENDING_PAYMENT_STATUSES)))
        total, count = self.db.execute(stmt).one()
        return Decimal(total), int(count)

    def canceled_total(
        self, *, start: datetime, end: datetime
    ) -> tuple[Decimal, int]:
        stmt = select(
            func.coalesce(func.sum(Payment.amount), 0),
            func.count(Payment.id),
        ).where(
            Payment.status == PaymentStatus.CANCELED,
            Payment.created_at >= start,
            Payment.created_at < end,
        )
        total, count = self.db.execute(stmt).one()
        return Decimal(total), int(count)

    def revenue_by_day(
        self, *, start: datetime, end: datetime
    ) -> list[tuple[date, Decimal, int]]:
        day_col = cast(Payment.paid_at, Date).label("day")
        stmt = (
            select(
                day_col,
                func.coalesce(func.sum(Payment.amount), 0).label("total"),
                func.count(Payment.id).label("c"),
            )
            .where(
                Payment.status.in_(list(REVENUE_PAYMENT_STATUSES)),
                Payment.paid_at >= start,
                Payment.paid_at < end,
            )
            .group_by(day_col)
            .order_by(day_col.asc())
        )
        return [
            (row[0], Decimal(row[1]), int(row[2]))
            for row in self.db.execute(stmt).all()
        ]

    def revenue_by_method(
        self, *, start: datetime, end: datetime
    ) -> list[tuple[str, Decimal, int]]:
        stmt = (
            select(
                Payment.payment_method,
                func.coalesce(func.sum(Payment.amount), 0).label("total"),
                func.count(Payment.id).label("c"),
            )
            .where(
                Payment.status.in_(list(REVENUE_PAYMENT_STATUSES)),
                Payment.paid_at >= start,
                Payment.paid_at < end,
            )
            .group_by(Payment.payment_method)
            .order_by(desc("total"))
        )
        return [
            (
                row[0].value if hasattr(row[0], "value") else str(row[0]),
                Decimal(row[1]),
                int(row[2]),
            )
            for row in self.db.execute(stmt).all()
        ]

    def list_pending(self, *, limit: int = 20) -> Sequence[Payment]:
        stmt = (
            select(Payment)
            .where(Payment.status.in_(list(PENDING_PAYMENT_STATUSES)))
            .order_by(
                Payment.due_date.asc(),
                Payment.created_at.asc(),
                Payment.id.asc(),
            )
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

    def list_paid_between(
        self, *, start: datetime, end: datetime, limit: int = 10000
    ) -> Sequence[Payment]:
        stmt = (
            select(Payment)
            .where(
                Payment.status.in_(list(REVENUE_PAYMENT_STATUSES)),
                Payment.paid_at >= start,
                Payment.paid_at < end,
            )
            .order_by(Payment.paid_at.asc(), Payment.id.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()


# ============================================================================
# Inventory aggregations
# ============================================================================


class InventoryReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def movements_by_type(
        self, *, start: datetime, end: datetime
    ) -> list[tuple[str, int]]:
        stmt = (
            select(
                InventoryMovement.movement_type,
                func.count(InventoryMovement.id).label("c"),
            )
            .where(
                InventoryMovement.created_at >= start,
                InventoryMovement.created_at < end,
            )
            .group_by(InventoryMovement.movement_type)
            .order_by(desc("c"))
        )
        return [
            (row[0].value if hasattr(row[0], "value") else str(row[0]), int(row[1]))
            for row in self.db.execute(stmt).all()
        ]

    def most_moved_items(
        self, *, start: datetime, end: datetime, limit: int = 10
    ) -> list[tuple[int, str, Decimal, Decimal, int]]:
        """Top itens por volume de movimentação no período.

        Retorna (item_id, name, total_in, total_out, movement_count).
        """
        in_sum = func.coalesce(
            func.sum(
                case(
                    (
                        InventoryMovement.movement_type == MovementType.IN,
                        InventoryMovement.quantity,
                    ),
                    else_=0,
                )
            ),
            0,
        ).label("total_in")
        out_sum = func.coalesce(
            func.sum(
                case(
                    (
                        InventoryMovement.movement_type == MovementType.OUT,
                        InventoryMovement.quantity,
                    ),
                    else_=0,
                )
            ),
            0,
        ).label("total_out")

        stmt = (
            select(
                InventoryItem.id,
                InventoryItem.name,
                in_sum,
                out_sum,
                func.count(InventoryMovement.id).label("c"),
            )
            .join(
                InventoryMovement,
                InventoryMovement.inventory_item_id == InventoryItem.id,
            )
            .where(
                InventoryMovement.created_at >= start,
                InventoryMovement.created_at < end,
            )
            .group_by(InventoryItem.id, InventoryItem.name)
            .order_by(desc("c"), InventoryItem.name.asc())
            .limit(limit)
        )
        return [
            (
                int(row[0]),
                str(row[1]),
                Decimal(row[2]),
                Decimal(row[3]),
                int(row[4]),
            )
            for row in self.db.execute(stmt).all()
        ]

    def list_low_stock(self, *, limit: int = 50) -> Sequence[InventoryItem]:
        stmt = (
            select(InventoryItem)
            .where(
                InventoryItem.is_active.is_(True),
                InventoryItem.current_quantity <= InventoryItem.minimum_quantity,
            )
            .order_by(InventoryItem.name.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

    def list_expiring(
        self, *, today: date, until: date, limit: int = 50
    ) -> Sequence[InventoryItem]:
        stmt = (
            select(InventoryItem)
            .where(
                InventoryItem.is_active.is_(True),
                InventoryItem.expiration_date.isnot(None),
                InventoryItem.expiration_date >= today,
                InventoryItem.expiration_date <= until,
            )
            .order_by(InventoryItem.expiration_date.asc(), InventoryItem.name.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()

    def list_active(self, *, limit: int = 10000) -> Sequence[InventoryItem]:
        stmt = (
            select(InventoryItem)
            .where(InventoryItem.is_active.is_(True))
            .order_by(InventoryItem.name.asc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()


# ============================================================================
# Medical records aggregations
# ============================================================================


class MedicalRecordsReportRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def count_in_period(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
    ) -> int:
        conds = [
            MedicalRecord.created_at >= start,
            MedicalRecord.created_at < end,
        ]
        if dentist_id is not None:
            conds.append(MedicalRecord.dentist_id == dentist_id)
        stmt = select(func.count(MedicalRecord.id)).where(and_(*conds))
        return int(self.db.execute(stmt).scalar_one())

    def by_dentist(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
        limit: int = 20,
    ) -> list[tuple[int, str, int]]:
        conds = [
            MedicalRecord.created_at >= start,
            MedicalRecord.created_at < end,
        ]
        if dentist_id is not None:
            conds.append(MedicalRecord.dentist_id == dentist_id)
        stmt = (
            select(
                MedicalRecord.dentist_id,
                User.name,
                func.count(MedicalRecord.id).label("c"),
            )
            .join(User, User.id == MedicalRecord.dentist_id)
            .where(and_(*conds))
            .group_by(MedicalRecord.dentist_id, User.name)
            .order_by(desc("c"), User.name.asc())
            .limit(limit)
        )
        return [
            (int(row[0]), str(row[1]), int(row[2]))
            for row in self.db.execute(stmt).all()
        ]

    def by_patient(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
        limit: int = 20,
    ) -> list[tuple[int, str, int]]:
        conds = [
            MedicalRecord.created_at >= start,
            MedicalRecord.created_at < end,
        ]
        if dentist_id is not None:
            conds.append(MedicalRecord.dentist_id == dentist_id)
        stmt = (
            select(
                MedicalRecord.patient_id,
                Patient.name,
                func.count(MedicalRecord.id).label("c"),
            )
            .join(Patient, Patient.id == MedicalRecord.patient_id)
            .where(and_(*conds))
            .group_by(MedicalRecord.patient_id, Patient.name)
            .order_by(desc("c"), Patient.name.asc())
            .limit(limit)
        )
        return [
            (int(row[0]), str(row[1]), int(row[2]))
            for row in self.db.execute(stmt).all()
        ]

    def recent(
        self,
        *,
        start: datetime,
        end: datetime,
        dentist_id: Optional[int],
        limit: int = 20,
    ) -> Sequence[MedicalRecord]:
        conds = [
            MedicalRecord.created_at >= start,
            MedicalRecord.created_at < end,
        ]
        if dentist_id is not None:
            conds.append(MedicalRecord.dentist_id == dentist_id)
        stmt = (
            select(MedicalRecord)
            .where(and_(*conds))
            .order_by(MedicalRecord.created_at.desc(), MedicalRecord.id.desc())
            .limit(limit)
        )
        return self.db.execute(stmt).scalars().all()


# Silenciar linters: imports são usados via expressões SQL
_ = literal
