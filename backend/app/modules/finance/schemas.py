from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.modules.finance.models import (
    BudgetStatus,
    PaymentMethod,
    PaymentStatus,
)
from app.shared.timezone import ensure_aware_utc


# ============================================================================
# Snapshots embutidos
# ============================================================================


class PatientSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class DentistSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ProcedureSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    base_price: Decimal


# ============================================================================
# Budget items
# ============================================================================


class BudgetItemCreate(BaseModel):
    procedure_id: int = Field(..., ge=1)
    quantity: int = Field(default=1, ge=1, le=1000)
    # Se ausente, o backend usa procedure.base_price no momento da criação.
    unit_price: Optional[Decimal] = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )


class BudgetItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    budget_id: int
    procedure_id: int
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    created_at: datetime
    updated_at: datetime
    procedure: ProcedureSummary


# ============================================================================
# Budget
# ============================================================================


class BudgetCreate(BaseModel):
    patient_id: int = Field(..., ge=1)
    dentist_id: int = Field(..., ge=1)
    notes: Optional[str] = Field(default=None, max_length=4000)
    items: list[BudgetItemCreate] = Field(..., min_length=1)

    @field_validator("notes")
    @classmethod
    def _v_notes(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class BudgetUpdate(BaseModel):
    """Atualização parcial. `items` só é aceito se o orçamento estiver em DRAFT.

    `patient_id`, `dentist_id`, `status` e `total_amount` nunca são alterados
    por este endpoint.
    """

    notes: Optional[str] = Field(default=None, max_length=4000)
    items: Optional[list[BudgetItemCreate]] = Field(default=None, min_length=1)

    @field_validator("notes")
    @classmethod
    def _v_notes(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class BudgetStatusChange(BaseModel):
    status: BudgetStatus

    @field_validator("status", mode="before")
    @classmethod
    def _v_status(cls, v):
        if isinstance(v, BudgetStatus):
            return v
        if isinstance(v, str):
            try:
                return BudgetStatus(v.lower())
            except ValueError as exc:
                allowed = ", ".join(s.value for s in BudgetStatus)
                raise ValueError(
                    f"Status inválido. Valores aceitos: {allowed}"
                ) from exc
        return v


class BudgetCancel(BaseModel):
    reason: Optional[str] = Field(default=None, max_length=500)

    @field_validator("reason")
    @classmethod
    def _v_reason(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class BudgetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    dentist_id: int
    status: BudgetStatus
    total_amount: Decimal
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    items: list[BudgetItemRead]
    patient: PatientSummary
    dentist: DentistSummary


# ============================================================================
# Payment
# ============================================================================


class PaymentCreate(BaseModel):
    patient_id: int = Field(..., ge=1)
    budget_id: Optional[int] = Field(default=None, ge=1)
    amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)
    payment_method: PaymentMethod
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)
    paid_at: Optional[datetime] = None
    due_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("notes")
    @classmethod
    def _v_notes(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @field_validator("paid_at")
    @classmethod
    def _v_paid_at(cls, v):
        if v is None:
            return v
        return ensure_aware_utc(v, "paid_at")


class PaymentUpdate(BaseModel):
    """Edição parcial de campos não-financeiros / não-críticos.

    `patient_id`, `budget_id`, `amount` e `status` nunca mudam aqui.
    """

    payment_method: Optional[PaymentMethod] = None
    paid_at: Optional[datetime] = None
    due_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("notes")
    @classmethod
    def _v_notes(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @field_validator("paid_at")
    @classmethod
    def _v_paid_at(cls, v):
        if v is None:
            return v
        return ensure_aware_utc(v, "paid_at")

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class PaymentStatusChange(BaseModel):
    status: PaymentStatus
    paid_at: Optional[datetime] = None

    @field_validator("status", mode="before")
    @classmethod
    def _v_status(cls, v):
        if isinstance(v, PaymentStatus):
            return v
        if isinstance(v, str):
            try:
                return PaymentStatus(v.lower())
            except ValueError as exc:
                allowed = ", ".join(s.value for s in PaymentStatus)
                raise ValueError(
                    f"Status inválido. Valores aceitos: {allowed}"
                ) from exc
        return v

    @field_validator("paid_at")
    @classmethod
    def _v_paid_at(cls, v):
        if v is None:
            return v
        return ensure_aware_utc(v, "paid_at")


class PaymentCancel(BaseModel):
    cancellation_reason: Optional[str] = Field(default=None, max_length=500)

    @field_validator("cancellation_reason")
    @classmethod
    def _v_reason(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    budget_id: Optional[int] = None
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus
    paid_at: Optional[datetime] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    canceled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    patient: PatientSummary


# ============================================================================
# Reports
# ============================================================================


class RevenueReport(BaseModel):
    period_start: datetime
    period_end: datetime
    total_paid: Decimal
    number_of_payments: int


class BudgetSettlementReport(BaseModel):
    """Quanto já foi pago e quanto ainda falta para um orçamento."""

    budget_id: int
    total_amount: Decimal
    total_paid: Decimal
    total_pending: Decimal


class FinanceSummary(BaseModel):
    total_paid_current_month: Decimal
    total_paid_current_week: Decimal
    total_pending: Decimal
    total_canceled: Decimal
    number_of_paid_payments: int
    number_of_pending_payments: int
