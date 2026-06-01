from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional, Sequence

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.modules.appointments.models import (
    BLOCKING_STATUSES,
    Appointment,
    AppointmentStatus,
)


class AppointmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ----- single -----
    def get(self, appointment_id: int) -> Optional[Appointment]:
        return self.db.get(Appointment, appointment_id)

    # ----- conflict detection -----
    def has_conflict(
        self,
        *,
        dentist_id: int,
        start: datetime,
        end: datetime,
        exclude_id: Optional[int] = None,
    ) -> bool:
        """Existe consulta ativa do mesmo dentista que se sobrepõe à janela?

        Sobreposição = `start < other.end AND end > other.start`.
        Status terminais não-bloqueantes (CANCELED, NO_SHOW) são ignorados.
        """
        stmt = select(Appointment.id).where(
            Appointment.dentist_id == dentist_id,
            Appointment.status.in_(list(BLOCKING_STATUSES)),
            Appointment.scheduled_start < end,
            Appointment.scheduled_end > start,
        )
        if exclude_id is not None:
            stmt = stmt.where(Appointment.id != exclude_id)
        stmt = stmt.limit(1)
        return self.db.execute(stmt).first() is not None

    # ----- search -----
    def search(
        self,
        *,
        patient_id: Optional[int] = None,
        dentist_id: Optional[int] = None,
        statuses: Optional[Iterable[AppointmentStatus]] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        include_canceled: bool = False,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Appointment], int]:
        conditions = []
        if patient_id is not None:
            conditions.append(Appointment.patient_id == patient_id)
        if dentist_id is not None:
            conditions.append(Appointment.dentist_id == dentist_id)

        status_list = list(statuses) if statuses else None
        if status_list:
            conditions.append(Appointment.status.in_(status_list))
        elif not include_canceled:
            # Padrão: oculta canceladas (mas mantém NO_SHOW para histórico).
            conditions.append(Appointment.status != AppointmentStatus.CANCELED)

        if from_dt is not None:
            conditions.append(Appointment.scheduled_start >= from_dt)
        if to_dt is not None:
            conditions.append(Appointment.scheduled_start < to_dt)

        where_clause = and_(*conditions) if conditions else None

        base = select(Appointment)
        count_base = select(func.count(Appointment.id))
        if where_clause is not None:
            base = base.where(where_clause)
            count_base = count_base.where(where_clause)

        total = self.db.execute(count_base).scalar_one()

        stmt = (
            base.order_by(Appointment.scheduled_start.asc(), Appointment.id.asc())
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    # ----- mutations -----
    def add(self, appointment: Appointment) -> Appointment:
        self.db.add(appointment)
        self.db.flush()
        self.db.refresh(appointment)
        return appointment

    def save(self, appointment: Appointment) -> Appointment:
        self.db.flush()
        self.db.refresh(appointment)
        return appointment
