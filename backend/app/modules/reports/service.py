from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.modules.appointments.models import AppointmentStatus
from app.modules.inventory.repository import (
    InventoryItemRepository,
    InventoryMovementRepository,
)
from app.modules.patients.repository import PatientRepository
from app.modules.reports.repository import (
    AppointmentsReportRepository,
    FinanceReportRepository,
    InventoryReportRepository,
    MedicalRecordsReportRepository,
    PatientsReportRepository,
)
from app.modules.reports.schemas import (
    AppointmentSnapshot,
    AppointmentsReport,
    CountByDay,
    CountByDentist,
    CountByLabel,
    CountByPatient,
    DashboardAppointmentSnapshot,
    DashboardPatientSnapshot,
    DashboardResponse,
    FinanceReport,
    InventoryItemSnapshot,
    InventoryReport,
    MedicalRecordMetadata,
    MedicalRecordsReport,
    MovedItem,
    PatientSnapshot,
    PatientsReport,
    PendingPaymentSnapshot,
    PeriodMeta,
    TotalByDay,
    TotalByLabel,
)
from app.modules.users.models import User
from app.shared.exceptions import ValidationError
from app.shared.timezone import (
    current_month_window,
    current_week_window,
    date_range_window,
    day_window,
    today_clinic,
)

MONEY_PLACES = Decimal("0.01")
EXPIRATION_DEFAULT_DAYS = 30


def _money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(value).quantize(MONEY_PLACES, rounding=ROUND_HALF_UP)


def _resolve_period(
    start_date: Optional[date], end_date: Optional[date]
) -> tuple[datetime, datetime, date, date]:
    """Normaliza a janela e devolve (start_utc, end_utc, start_date, end_date).

    Default: mês corrente em CLINIC_TZ. Erros viram 422.
    """
    try:
        start_utc, end_utc = date_range_window(start_date, end_date)
    except ValueError as exc:
        raise ValidationError(str(exc)) from exc

    if start_date is None and end_date is None:
        # Devolve as datas reais do mês corrente para o cliente
        from app.shared.timezone import CLINIC_TZ

        local_now = datetime.now(CLINIC_TZ)
        eff_start = local_now.replace(day=1).date()
        # Último dia do mês corrente
        if local_now.month == 12:
            next_first = local_now.replace(year=local_now.year + 1, month=1, day=1)
        else:
            next_first = local_now.replace(month=local_now.month + 1, day=1)
        eff_end = (next_first - timedelta(days=1)).date()
    else:
        eff_start = start_date or end_date.replace(day=1)  # type: ignore[union-attr]
        eff_end = end_date or today_clinic()

    return start_utc, end_utc, eff_start, eff_end


# ============================================================================
# Dashboard
# ============================================================================


class DashboardService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.patient_repo_aux = PatientRepository(db)
        self.patients_rep = PatientsReportRepository(db)
        self.appts_rep = AppointmentsReportRepository(db)
        self.finance_rep = FinanceReportRepository(db)
        self.inv_item_repo = InventoryItemRepository(db)
        self.inv_move_repo = InventoryMovementRepository(db)

    def get(self, current_user: User) -> DashboardResponse:
        role = current_user.role
        dentist_filter = current_user.id if role == Role.DENTIST else None

        week_start, week_end = current_week_window()
        month_start, month_end = current_month_window()
        today_start, today_end = day_window()

        # Patients
        active_p = self.patients_rep.count_active()
        inactive_p = self.patients_rep.count_inactive()
        total_p = active_p + inactive_p

        # Appointments
        appts_today = self.appts_rep.count_in_window(
            start=today_start, end=today_end, dentist_id=dentist_filter
        )
        appts_week = self.appts_rep.count_in_window(
            start=week_start, end=week_end, dentist_id=dentist_filter
        )
        completed_week = self.appts_rep.count_in_window(
            start=week_start,
            end=week_end,
            dentist_id=dentist_filter,
            statuses=[AppointmentStatus.COMPLETED],
        )
        canceled_week = self.appts_rep.count_in_window(
            start=week_start,
            end=week_end,
            dentist_id=dentist_filter,
            statuses=[AppointmentStatus.CANCELED],
        )
        no_show_week = self.appts_rep.count_in_window(
            start=week_start,
            end=week_end,
            dentist_id=dentist_filter,
            statuses=[AppointmentStatus.NO_SHOW],
        )

        # Finance — controlado por role
        monthly_revenue: Optional[Decimal] = None
        weekly_revenue: Optional[Decimal] = None
        pending_total: Optional[Decimal] = None
        pending_count: Optional[int] = None
        if role == Role.ADMIN:
            mtotal, _ = self.finance_rep.revenue_total(start=month_start, end=month_end)
            wtotal, _ = self.finance_rep.revenue_total(start=week_start, end=week_end)
            ptotal, pcount = self.finance_rep.pending_total()
            monthly_revenue = _money(mtotal)
            weekly_revenue = _money(wtotal)
            pending_total = _money(ptotal)
            pending_count = pcount
        elif role == Role.DENTIST:
            mtotal, _ = self.finance_rep.revenue_total(start=month_start, end=month_end)
            wtotal, _ = self.finance_rep.revenue_total(start=week_start, end=week_end)
            _, pcount = self.finance_rep.pending_total()
            monthly_revenue = _money(mtotal)
            weekly_revenue = _money(wtotal)
            pending_count = pcount
        elif role == Role.RECEPTIONIST:
            # Só sinal operacional, sem valores.
            _, pcount = self.finance_rep.pending_total()
            pending_count = pcount

        # Inventory
        low_stock = self.inv_item_repo.count_low_stock()
        today_local = today_clinic()
        expiring = self.inv_item_repo.count_expiring(
            today=today_local, until=today_local + timedelta(days=EXPIRATION_DEFAULT_DAYS)
        )

        # Lists
        recent_patients = self.patients_rep.recent(
            start=month_start, end=month_end, limit=5
        )
        upcoming = self.appts_rep.list_upcoming(
            from_dt=today_start, dentist_id=dentist_filter, limit=5
        )

        return DashboardResponse(
            period_week_start=week_start,
            period_week_end=week_end,
            period_month_start=month_start,
            period_month_end=month_end,
            total_patients=total_p,
            active_patients=active_p,
            inactive_patients=inactive_p,
            appointments_today=appts_today,
            appointments_this_week=appts_week,
            completed_appointments_this_week=completed_week,
            canceled_appointments_this_week=canceled_week,
            no_show_appointments_this_week=no_show_week,
            monthly_revenue=monthly_revenue,
            weekly_revenue=weekly_revenue,
            pending_payments_total=pending_total,
            pending_payments_count=pending_count,
            low_stock_items_count=low_stock,
            expiring_items_count=expiring,
            most_recent_patients=[
                DashboardPatientSnapshot.model_validate(p) for p in recent_patients
            ],
            upcoming_appointments=[
                DashboardAppointmentSnapshot.model_validate(a) for a in upcoming
            ],
        )


# ============================================================================
# Reports
# ============================================================================


class ReportsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.patients_rep = PatientsReportRepository(db)
        self.appts_rep = AppointmentsReportRepository(db)
        self.finance_rep = FinanceReportRepository(db)
        self.inv_item_repo = InventoryItemRepository(db)
        self.inv_move_repo = InventoryMovementRepository(db)
        self.inv_rep = InventoryReportRepository(db)
        self.records_rep = MedicalRecordsReportRepository(db)

    def _dentist_filter(
        self, *, current_user: User, requested: Optional[int]
    ) -> Optional[int]:
        """DENTIST sempre fica restrita a si mesma; ADMIN/RECEPTIONIST aceitam override."""
        if current_user.role == Role.DENTIST:
            return current_user.id
        return requested

    # ----- Patients -----
    def patients_report(
        self,
        *,
        current_user: User,
        start_date: Optional[date],
        end_date: Optional[date],
    ) -> PatientsReport:
        start_utc, end_utc, eff_start, eff_end = _resolve_period(start_date, end_date)
        return PatientsReport(
            period=PeriodMeta(start_date=eff_start, end_date=eff_end),
            total_patients_created_in_period=self.patients_rep.count_created_between(
                start=start_utc, end=end_utc
            ),
            active_patients=self.patients_rep.count_active(),
            inactive_patients=self.patients_rep.count_inactive(),
            patients_with_missing_contact_data=self.patients_rep.count_missing_contact(),
            patients_by_city=[
                CountByLabel(label=city, count=count)
                for city, count in self.patients_rep.by_city(limit=20)
            ],
            recent_patients=[
                PatientSnapshot.model_validate(p)
                for p in self.patients_rep.recent(
                    start=start_utc, end=end_utc, limit=10
                )
            ],
        )

    # ----- Appointments -----
    def appointments_report(
        self,
        *,
        current_user: User,
        start_date: Optional[date],
        end_date: Optional[date],
        dentist_id: Optional[int],
    ) -> AppointmentsReport:
        start_utc, end_utc, eff_start, eff_end = _resolve_period(start_date, end_date)
        applied_filter = self._dentist_filter(
            current_user=current_user, requested=dentist_id
        )

        total, completed, canceled, no_show = self.appts_rep.total_and_status(
            start=start_utc, end=end_utc, dentist_id=applied_filter
        )

        return AppointmentsReport(
            period=PeriodMeta(start_date=eff_start, end_date=eff_end),
            dentist_filter_applied=applied_filter,
            total_appointments=total,
            completed_appointments=completed,
            canceled_appointments=canceled,
            no_show_appointments=no_show,
            appointments_by_status=[
                CountByLabel(label=label, count=count)
                for label, count in self.appts_rep.by_status(
                    start=start_utc, end=end_utc, dentist_id=applied_filter
                )
            ],
            appointments_by_dentist=[
                CountByDentist(
                    dentist_id=did, dentist_name=name, count=count
                )
                for did, name, count in self.appts_rep.by_dentist(
                    start=start_utc, end=end_utc, dentist_id=applied_filter
                )
            ],
            appointments_by_day=[
                CountByDay(day=day, count=count)
                for day, count in self.appts_rep.by_day(
                    start=start_utc, end=end_utc, dentist_id=applied_filter
                )
            ],
            most_common_reasons=[
                CountByLabel(label=reason, count=count)
                for reason, count in self.appts_rep.most_common_reasons(
                    start=start_utc, end=end_utc, dentist_id=applied_filter
                )
            ],
        )

    # ----- Finance -----
    def finance_report(
        self,
        *,
        current_user: User,
        start_date: Optional[date],
        end_date: Optional[date],
    ) -> FinanceReport:
        start_utc, end_utc, eff_start, eff_end = _resolve_period(start_date, end_date)

        paid_total, paid_count = self.finance_rep.revenue_total(
            start=start_utc, end=end_utc
        )
        pending_total, pending_count = self.finance_rep.pending_total()
        canceled_total, _ = self.finance_rep.canceled_total(
            start=start_utc, end=end_utc
        )

        revenue_by_day_rows = self.finance_rep.revenue_by_day(
            start=start_utc, end=end_utc
        )
        method_rows = self.finance_rep.revenue_by_method(
            start=start_utc, end=end_utc
        )
        pending_list = self.finance_rep.list_pending(limit=20)

        return FinanceReport(
            period=PeriodMeta(start_date=eff_start, end_date=eff_end),
            total_paid=_money(paid_total),
            total_pending=_money(pending_total),
            total_canceled=_money(canceled_total),
            paid_payments_count=paid_count,
            pending_payments_count=pending_count,
            revenue_by_day=[
                TotalByDay(day=day, total=_money(total), count=count)
                for day, total, count in revenue_by_day_rows
            ],
            revenue_by_payment_method=[
                TotalByLabel(label=method, total=_money(total), count=count)
                for method, total, count in method_rows
            ],
            pending_payments=[
                PendingPaymentSnapshot.model_validate(p) for p in pending_list
            ],
        )

    # ----- Inventory -----
    def inventory_report(
        self,
        *,
        current_user: User,
        start_date: Optional[date],
        end_date: Optional[date],
    ) -> InventoryReport:
        start_utc, end_utc, eff_start, eff_end = _resolve_period(start_date, end_date)

        today_local = today_clinic()
        until = today_local + timedelta(days=EXPIRATION_DEFAULT_DAYS)

        return InventoryReport(
            period=PeriodMeta(start_date=eff_start, end_date=eff_end),
            total_active_items=self.inv_item_repo.count_active(),
            total_inactive_items=self.inv_item_repo.count_inactive(),
            low_stock_items_count=self.inv_item_repo.count_low_stock(),
            expiring_items_count=self.inv_item_repo.count_expiring(
                today=today_local, until=until
            ),
            movements_by_type=[
                CountByLabel(label=label, count=count)
                for label, count in self.inv_rep.movements_by_type(
                    start=start_utc, end=end_utc
                )
            ],
            most_moved_items=[
                MovedItem(
                    inventory_item_id=item_id,
                    name=name,
                    total_in=total_in,
                    total_out=total_out,
                    movement_count=count,
                )
                for item_id, name, total_in, total_out, count in self.inv_rep.most_moved_items(
                    start=start_utc, end=end_utc, limit=10
                )
            ],
            low_stock_items=[
                InventoryItemSnapshot(
                    id=i.id,
                    name=i.name,
                    category=i.category.value,
                    current_quantity=i.current_quantity,
                    minimum_quantity=i.minimum_quantity,
                    unit_of_measure=i.unit_of_measure.value,
                    supplier=i.supplier,
                    expiration_date=i.expiration_date,
                    is_active=i.is_active,
                )
                for i in self.inv_rep.list_low_stock(limit=50)
            ],
            expiring_items=[
                InventoryItemSnapshot(
                    id=i.id,
                    name=i.name,
                    category=i.category.value,
                    current_quantity=i.current_quantity,
                    minimum_quantity=i.minimum_quantity,
                    unit_of_measure=i.unit_of_measure.value,
                    supplier=i.supplier,
                    expiration_date=i.expiration_date,
                    is_active=i.is_active,
                )
                for i in self.inv_rep.list_expiring(
                    today=today_local, until=until, limit=50
                )
            ],
        )

    # ----- Medical records (sensível) -----
    def medical_records_report(
        self,
        *,
        current_user: User,
        start_date: Optional[date],
        end_date: Optional[date],
        dentist_id: Optional[int],
    ) -> MedicalRecordsReport:
        start_utc, end_utc, eff_start, eff_end = _resolve_period(start_date, end_date)
        applied_filter = self._dentist_filter(
            current_user=current_user, requested=dentist_id
        )

        total = self.records_rep.count_in_period(
            start=start_utc, end=end_utc, dentist_id=applied_filter
        )
        by_dentist_rows = self.records_rep.by_dentist(
            start=start_utc, end=end_utc, dentist_id=applied_filter
        )
        by_patient_rows = self.records_rep.by_patient(
            start=start_utc, end=end_utc, dentist_id=applied_filter
        )
        recent = self.records_rep.recent(
            start=start_utc, end=end_utc, dentist_id=applied_filter
        )

        return MedicalRecordsReport(
            period=PeriodMeta(start_date=eff_start, end_date=eff_end),
            dentist_filter_applied=applied_filter,
            total_records_in_period=total,
            records_by_dentist=[
                CountByDentist(dentist_id=did, dentist_name=name, count=count)
                for did, name, count in by_dentist_rows
            ],
            records_by_patient=[
                CountByPatient(patient_id=pid, patient_name=name, count=count)
                for pid, name, count in by_patient_rows
            ],
            recent_records=[MedicalRecordMetadata.model_validate(r) for r in recent],
        )
