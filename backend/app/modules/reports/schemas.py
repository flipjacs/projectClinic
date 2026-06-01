from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.modules.appointments.models import AppointmentStatus
from app.modules.finance.models import PaymentMethod, PaymentStatus
from app.modules.inventory.models import MovementType


# ============================================================================
# Snapshots reutilizados
# ============================================================================


class PatientSnapshot(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cpf: str
    phone: str
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    is_active: bool
    created_at: datetime


class DashboardPatientSnapshot(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    is_active: bool
    created_at: datetime


class DentistSnapshot(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class AppointmentSnapshot(BaseModel):
    """Versão enxuta de Appointment para painéis e listagens.

    Não expõe `notes` ou `cancellation_reason` para evitar vazamento em
    contextos onde a permissão é só de visualização operacional.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    dentist_id: int
    scheduled_start: datetime
    scheduled_end: datetime
    status: AppointmentStatus
    reason: Optional[str] = None
    patient: PatientSnapshot
    dentist: DentistSnapshot


class DashboardAppointmentSnapshot(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    dentist_id: int
    scheduled_start: datetime
    scheduled_end: datetime
    status: AppointmentStatus
    reason: Optional[str] = None
    patient: DashboardPatientSnapshot
    dentist: DentistSnapshot


class MedicalRecordMetadata(BaseModel):
    """Apenas metadados — sem campos clínicos sensíveis."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    dentist_id: int
    visit_date: date
    is_active: bool
    created_at: datetime
    dentist: DentistSnapshot


class InventoryItemSnapshot(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    current_quantity: Decimal
    minimum_quantity: Decimal
    unit_of_measure: str
    supplier: Optional[str] = None
    expiration_date: Optional[date] = None
    is_active: bool


# ============================================================================
# Agregações auxiliares
# ============================================================================


class CountByLabel(BaseModel):
    label: str
    count: int


class CountByDay(BaseModel):
    day: date
    count: int


class TotalByDay(BaseModel):
    day: date
    total: Decimal
    count: int


class TotalByLabel(BaseModel):
    label: str
    total: Decimal
    count: int


class CountByDentist(BaseModel):
    dentist_id: int
    dentist_name: str
    count: int


class CountByPatient(BaseModel):
    patient_id: int
    patient_name: str
    count: int


class MovedItem(BaseModel):
    inventory_item_id: int
    name: str
    total_in: Decimal
    total_out: Decimal
    movement_count: int


# ============================================================================
# DASHBOARD
# ============================================================================


class DashboardResponse(BaseModel):
    """Painel inicial. Campos financeiros são Optional porque dependem da role."""

    # Janelas para o cliente confirmar o período usado.
    period_week_start: datetime
    period_week_end: datetime
    period_month_start: datetime
    period_month_end: datetime

    # Pacientes
    total_patients: int
    active_patients: int
    inactive_patients: int

    # Consultas (DENTIST → próprias)
    appointments_today: int
    appointments_this_week: int
    completed_appointments_this_week: int
    canceled_appointments_this_week: int
    no_show_appointments_this_week: int

    # Financeiro (Optional — depende de role)
    monthly_revenue: Optional[Decimal] = None
    weekly_revenue: Optional[Decimal] = None
    pending_payments_total: Optional[Decimal] = None
    pending_payments_count: Optional[int] = None

    # Estoque
    low_stock_items_count: int
    expiring_items_count: int

    # Listas
    most_recent_patients: list[DashboardPatientSnapshot]
    upcoming_appointments: list[DashboardAppointmentSnapshot]


# ============================================================================
# REPORT RANGE METADATA — toda resposta confirma a janela aplicada
# ============================================================================


class PeriodMeta(BaseModel):
    start_date: date
    end_date: date


# ============================================================================
# PATIENTS REPORT
# ============================================================================


class PatientsReport(BaseModel):
    period: PeriodMeta
    total_patients_created_in_period: int
    active_patients: int
    inactive_patients: int
    patients_with_missing_contact_data: int
    patients_by_city: list[CountByLabel]
    recent_patients: list[PatientSnapshot]


# ============================================================================
# APPOINTMENTS REPORT
# ============================================================================


class AppointmentsReport(BaseModel):
    period: PeriodMeta
    dentist_filter_applied: Optional[int] = None

    total_appointments: int
    completed_appointments: int
    canceled_appointments: int
    no_show_appointments: int

    appointments_by_status: list[CountByLabel]
    appointments_by_dentist: list[CountByDentist]
    appointments_by_day: list[CountByDay]
    most_common_reasons: list[CountByLabel]


# ============================================================================
# FINANCE REPORT
# ============================================================================


class PendingPaymentSnapshot(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    budget_id: Optional[int] = None
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus
    due_date: Optional[date] = None
    created_at: datetime


class FinanceReport(BaseModel):
    period: PeriodMeta

    total_paid: Decimal
    total_pending: Decimal
    total_canceled: Decimal

    paid_payments_count: int
    pending_payments_count: int

    revenue_by_day: list[TotalByDay]
    revenue_by_payment_method: list[TotalByLabel]
    pending_payments: list[PendingPaymentSnapshot] = Field(
        default_factory=list,
        description="Top N pagamentos pendentes/parciais ordenados pelo due_date.",
    )


# ============================================================================
# INVENTORY REPORT
# ============================================================================


class InventoryReport(BaseModel):
    period: PeriodMeta
    total_active_items: int
    total_inactive_items: int
    low_stock_items_count: int
    expiring_items_count: int
    movements_by_type: list[CountByLabel]
    most_moved_items: list[MovedItem]
    low_stock_items: list[InventoryItemSnapshot]
    expiring_items: list[InventoryItemSnapshot]


# ============================================================================
# MEDICAL RECORDS REPORT
# ============================================================================


class MedicalRecordsReport(BaseModel):
    period: PeriodMeta
    dentist_filter_applied: Optional[int] = None

    total_records_in_period: int
    records_by_dentist: list[CountByDentist]
    records_by_patient: list[CountByPatient]
    recent_records: list[MedicalRecordMetadata]


# ============================================================================
# Movement type filter helper
# ============================================================================


__all__ = [
    "DashboardResponse",
    "PatientsReport",
    "AppointmentsReport",
    "FinanceReport",
    "InventoryReport",
    "MedicalRecordsReport",
    "MovementType",
]
