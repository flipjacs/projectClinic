from __future__ import annotations

from datetime import datetime
from decimal import ROUND_HALF_UP, Decimal
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.modules.audit.service import AuditLogService
from app.modules.finance.models import (
    PAYABLE_BUDGET_STATUSES,
    PENDING_PAYMENT_STATUSES,
    TERMINAL_BUDGET_STATUSES,
    Budget,
    BudgetItem,
    BudgetStatus,
    Payment,
    PaymentStatus,
)
from app.modules.finance.repository import BudgetRepository, PaymentRepository
from app.modules.finance.schemas import (
    BudgetCancel,
    BudgetCreate,
    BudgetItemCreate,
    BudgetSettlementReport,
    BudgetStatusChange,
    BudgetUpdate,
    FinanceSummary,
    PaymentCancel,
    PaymentCreate,
    PaymentStatusChange,
    PaymentUpdate,
    RevenueReport,
)
from app.modules.patients.repository import PatientRepository
from app.modules.procedures.repository import ProcedureRepository
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.exceptions import NotFoundError, ValidationError
from app.shared.pagination import PaginationParams
from app.shared.timezone import (
    current_month_window as _current_month_window,
    current_week_window as _current_week_window,
    ensure_aware_utc,
    ensure_optional_aware_utc,
    now_utc as _now_utc,
)

TWO_PLACES = Decimal("0.01")


def _money(value: Decimal | int | float | str) -> Decimal:
    """Normaliza qualquer entrada em Decimal com 2 casas, arredondando."""
    return Decimal(value).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


# ============================================================================
# Budget service
# ============================================================================


# Transições permitidas para orçamento.
_BUDGET_TRANSITIONS: dict[BudgetStatus, frozenset[BudgetStatus]] = {
    BudgetStatus.DRAFT: frozenset(
        {BudgetStatus.APPROVED, BudgetStatus.REJECTED, BudgetStatus.CANCELED}
    ),
    BudgetStatus.APPROVED: frozenset({BudgetStatus.CANCELED}),
    BudgetStatus.REJECTED: frozenset(),
    BudgetStatus.CANCELED: frozenset(),
}


class BudgetService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = BudgetRepository(db)
        self.patient_repo = PatientRepository(db)
        self.user_repo = UserRepository(db)
        self.procedure_repo = ProcedureRepository(db)
        self.payment_repo = PaymentRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get_by_id(self, budget_id: int) -> Budget:
        budget = self.repo.get(budget_id)
        if not budget:
            raise NotFoundError("Orçamento não encontrado")
        return budget

    def list_paginated(
        self,
        *,
        params: PaginationParams,
        patient_id: Optional[int] = None,
        dentist_id: Optional[int] = None,
        statuses: Optional[Iterable[BudgetStatus]] = None,
        include_canceled: bool = False,
    ) -> tuple[list[Budget], int]:
        items, total = self.repo.search(
            patient_id=patient_id,
            dentist_id=dentist_id,
            statuses=statuses,
            include_canceled=include_canceled,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    # ----- helpers -----
    def _build_items(
        self,
        raw_items: list[BudgetItemCreate],
        current_user: User,
    ) -> tuple[list[BudgetItem], Decimal]:
        """Resolve preços e calcula totais; nunca confia no client."""
        if not raw_items:
            raise ValidationError("Orçamento precisa ter ao menos 1 item")

        models: list[BudgetItem] = []
        running_total = Decimal("0.00")

        for raw in raw_items:
            procedure = self.procedure_repo.get(raw.procedure_id)
            if not procedure:
                raise NotFoundError(
                    f"Procedimento id={raw.procedure_id} não encontrado"
                )

            if not procedure.is_active and current_user.role != Role.ADMIN:
                raise ValidationError(
                    f"Procedimento '{procedure.name}' está inativo. "
                    "Somente ADMIN pode incluí-lo em orçamentos."
                )

            unit_price = (
                raw.unit_price if raw.unit_price is not None else procedure.base_price
            )
            unit_price = _money(unit_price)
            total_price = _money(unit_price * raw.quantity)

            models.append(
                BudgetItem(
                    procedure_id=procedure.id,
                    quantity=raw.quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                )
            )
            running_total += total_price

        return models, _money(running_total)

    # ----- mutations -----
    def create(self, payload: BudgetCreate, current_user: User) -> Budget:
        patient = self.patient_repo.get(payload.patient_id)
        if not patient:
            raise NotFoundError("Paciente não encontrado")
        if not patient.is_active:
            raise ValidationError("Paciente inativo. Reative antes de orçar")

        dentist = self.user_repo.get(payload.dentist_id)
        if not dentist:
            raise NotFoundError("Dentista não encontrado")
        if not dentist.is_active:
            raise ValidationError("Dentista inativo")
        if dentist.role not in (Role.DENTIST, Role.ADMIN):
            raise ValidationError(
                "O usuário informado não possui papel clínico (dentist ou admin)"
            )

        items, total = self._build_items(payload.items, current_user)

        budget = Budget(
            patient_id=patient.id,
            dentist_id=dentist.id,
            status=BudgetStatus.DRAFT,
            total_amount=total,
            notes=payload.notes,
            items=items,
        )
        self.repo.add(budget)
        self.audit.record(
            actor_user_id=current_user.id,
            action="budget.create",
            entity_type="budget",
            entity_id=budget.id,
            summary="Orçamento criado",
            metadata={"status": budget.status.value, "total_amount": str(budget.total_amount)},
        )
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def update(
        self,
        *,
        budget_id: int,
        payload: BudgetUpdate,
        current_user: User,
    ) -> Budget:
        budget = self.get_by_id(budget_id)

        if budget.status in TERMINAL_BUDGET_STATUSES:
            raise ValidationError(
                f"Orçamento em estado terminal ({budget.status.value}); "
                "não é possível editar"
            )

        data = payload.model_dump(exclude_unset=True)

        if "notes" in data:
            budget.notes = data["notes"]

        if "items" in data and data["items"] is not None:
            if budget.status != BudgetStatus.DRAFT:
                raise ValidationError(
                    "Itens só podem ser alterados enquanto o orçamento está em DRAFT"
                )
            new_items, new_total = self._build_items(payload.items, current_user)
            # Substitui completamente os itens (cascade delete-orphan cuida do resto).
            budget.items.clear()
            self.db.flush()
            for item in new_items:
                budget.items.append(item)
            budget.total_amount = new_total

        self.repo.save(budget)
        self.audit.record(
            actor_user_id=current_user.id,
            action="budget.update",
            entity_type="budget",
            entity_id=budget.id,
            summary="Orçamento atualizado",
            metadata={"fields": sorted(data.keys()), "total_amount": str(budget.total_amount)},
        )
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def change_status(
        self,
        *,
        budget_id: int,
        payload: BudgetStatusChange,
        current_user: User,
    ) -> Budget:
        budget = self.get_by_id(budget_id)
        new_status = payload.status

        if budget.status == new_status:
            return budget

        allowed = _BUDGET_TRANSITIONS.get(budget.status, frozenset())
        if new_status not in allowed:
            raise ValidationError(
                f"Transição inválida: {budget.status.value} → {new_status.value}"
            )

        budget.status = new_status
        self.repo.save(budget)
        self.audit.record(
            actor_user_id=current_user.id,
            action="budget.status_change",
            entity_type="budget",
            entity_id=budget.id,
            summary=f"Status alterado para {new_status.value}",
            metadata={"status": new_status.value},
        )
        self.db.commit()
        self.db.refresh(budget)
        return budget

    def approve(self, *, budget_id: int, current_user: User) -> Budget:
        return self.change_status(
            budget_id=budget_id,
            payload=BudgetStatusChange(status=BudgetStatus.APPROVED),
            current_user=current_user,
        )

    def reject(self, *, budget_id: int, current_user: User) -> Budget:
        return self.change_status(
            budget_id=budget_id,
            payload=BudgetStatusChange(status=BudgetStatus.REJECTED),
            current_user=current_user,
        )

    def cancel(
        self,
        *,
        budget_id: int,
        payload: BudgetCancel,
        current_user: User,
    ) -> Budget:
        budget = self.get_by_id(budget_id)

        if budget.status == BudgetStatus.CANCELED:
            return budget
        if budget.status == BudgetStatus.REJECTED:
            raise ValidationError(
                "Orçamento rejeitado não pode mais transitar de status"
            )

        budget.status = BudgetStatus.CANCELED
        if payload.reason:
            prefix = f"[cancelado] {payload.reason}"
            budget.notes = (
                prefix if not budget.notes else f"{budget.notes}\n{prefix}"
            )

        self.repo.save(budget)
        self.audit.record(
            actor_user_id=current_user.id,
            action="budget.cancel",
            entity_type="budget",
            entity_id=budget.id,
            summary="Orçamento cancelado",
        )
        self.db.commit()
        self.db.refresh(budget)
        return budget

    # ----- relatórios financeiros do orçamento -----
    def settlement_report(self, budget_id: int) -> BudgetSettlementReport:
        budget = self.get_by_id(budget_id)
        total_paid = self.payment_repo.sum_paid_for_budget(budget.id)
        total_pending = _money(budget.total_amount - total_paid)
        if total_pending < 0:
            total_pending = Decimal("0.00")
        return BudgetSettlementReport(
            budget_id=budget.id,
            total_amount=_money(budget.total_amount),
            total_paid=_money(total_paid),
            total_pending=total_pending,
        )


# ============================================================================
# Payment service
# ============================================================================


# Transições permitidas para pagamento.
_PAYMENT_TRANSITIONS: dict[PaymentStatus, frozenset[PaymentStatus]] = {
    PaymentStatus.PENDING: frozenset(
        {
            PaymentStatus.PARTIALLY_PAID,
            PaymentStatus.PAID,
            PaymentStatus.CANCELED,
        }
    ),
    PaymentStatus.PARTIALLY_PAID: frozenset(
        {PaymentStatus.PAID, PaymentStatus.CANCELED}
    ),
    PaymentStatus.PAID: frozenset({PaymentStatus.CANCELED}),
    PaymentStatus.CANCELED: frozenset(),
}


class PaymentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PaymentRepository(db)
        self.patient_repo = PatientRepository(db)
        self.budget_repo = BudgetRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get_by_id(self, payment_id: int) -> Payment:
        payment = self.repo.get(payment_id)
        if not payment:
            raise NotFoundError("Pagamento não encontrado")
        return payment

    def list_paginated(
        self,
        *,
        params: PaginationParams,
        patient_id: Optional[int] = None,
        budget_id: Optional[int] = None,
        statuses: Optional[Iterable[PaymentStatus]] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        date_field: str = "paid_at",
    ) -> tuple[list[Payment], int]:
        try:
            from_dt = ensure_optional_aware_utc(from_dt, "from")
            to_dt = ensure_optional_aware_utc(to_dt, "to")
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        if from_dt and to_dt and to_dt <= from_dt:
            raise ValidationError("Parâmetro 'to' deve ser maior que 'from'")
        items, total = self.repo.search(
            patient_id=patient_id,
            budget_id=budget_id,
            statuses=statuses,
            from_dt=from_dt,
            to_dt=to_dt,
            date_field=date_field,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    def _ensure_budget_can_accept_payment(
        self,
        budget: Budget,
        *,
        amount: Decimal,
        exclude_payment_id: Optional[int] = None,
    ) -> None:
        if budget.status not in PAYABLE_BUDGET_STATUSES:
            raise ValidationError(
                f"Orçamento com status '{budget.status.value}' não pode receber pagamentos"
            )

        already_allocated = self.repo.sum_not_canceled_for_budget(
            budget.id,
            exclude_payment_id=exclude_payment_id,
        )
        if _money(already_allocated + amount) > _money(budget.total_amount):
            raise ValidationError(
                "Total de pagamentos não cancelados excede o total do orçamento"
            )

    # ----- mutations -----
    def create(self, payload: PaymentCreate, current_user: User) -> Payment:
        patient = self.patient_repo.get(payload.patient_id)
        if not patient:
            raise NotFoundError("Paciente não encontrado")
        if not patient.is_active:
            raise ValidationError("Paciente inativo. Reative antes de registrar pagamento")

        budget: Optional[Budget] = None
        if payload.budget_id is not None:
            budget = self.budget_repo.get_for_update(payload.budget_id)
            if not budget:
                raise NotFoundError("Orçamento não encontrado")
            if budget.patient_id != patient.id:
                raise ValidationError(
                    "Orçamento informado pertence a outro paciente"
                )

        amount = _money(payload.amount)
        if amount <= 0:
            raise ValidationError("Valor do pagamento deve ser maior que zero")

        if budget is not None:
            self._ensure_budget_can_accept_payment(budget, amount=amount)

        paid_at = payload.paid_at
        status = payload.status

        # Se já entrou como PAID e o cliente não mandou paid_at, marcamos agora.
        if status == PaymentStatus.PAID and paid_at is None:
            paid_at = _now_utc()
        # Status terminal CANCELED na criação não faz sentido.
        if status == PaymentStatus.CANCELED:
            raise ValidationError(
                "Não é possível criar pagamento já cancelado; cancele depois via endpoint próprio"
            )

        payment = Payment(
            patient_id=patient.id,
            budget_id=budget.id if budget else None,
            amount=amount,
            payment_method=payload.payment_method,
            status=status,
            paid_at=paid_at,
            due_date=payload.due_date,
            notes=payload.notes,
        )
        self.repo.add(payment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="payment.create",
            entity_type="payment",
            entity_id=payment.id,
            summary="Pagamento criado",
            metadata={"status": payment.status.value, "amount": str(payment.amount)},
        )
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def update(
        self,
        *,
        payment_id: int,
        payload: PaymentUpdate,
        current_user: User,
    ) -> Payment:
        payment = self.get_by_id(payment_id)

        if payment.status == PaymentStatus.CANCELED:
            raise ValidationError(
                "Pagamento cancelado não pode ser editado"
            )

        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(payment, field, value)

        self.repo.save(payment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="payment.update",
            entity_type="payment",
            entity_id=payment.id,
            summary="Pagamento atualizado",
            metadata={"fields": sorted(data.keys())},
        )
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def change_status(
        self,
        *,
        payment_id: int,
        payload: PaymentStatusChange,
        current_user: User,
    ) -> Payment:
        payment = self.get_by_id(payment_id)
        new_status = payload.status

        if payment.status == new_status:
            # Atualiza paid_at se enviado e ainda não havia.
            if (
                new_status == PaymentStatus.PAID
                and payload.paid_at is not None
                and payment.paid_at is None
            ):
                payment.paid_at = payload.paid_at
                self.repo.save(payment)
                self.db.commit()
                self.db.refresh(payment)
            return payment

        allowed = _PAYMENT_TRANSITIONS.get(payment.status, frozenset())
        if new_status not in allowed:
            raise ValidationError(
                f"Transição inválida: {payment.status.value} → {new_status.value}"
            )

        if new_status in (PaymentStatus.PARTIALLY_PAID, PaymentStatus.PAID):
            if payment.budget_id is not None:
                budget = self.budget_repo.get_for_update(payment.budget_id)
                if not budget:
                    raise NotFoundError("Orçamento não encontrado")
                self._ensure_budget_can_accept_payment(
                    budget,
                    amount=_money(payment.amount),
                    exclude_payment_id=payment.id,
                )

        payment.status = new_status

        if new_status == PaymentStatus.PAID:
            payment.paid_at = payload.paid_at or _now_utc()
        elif new_status == PaymentStatus.CANCELED:
            payment.canceled_at = _now_utc()
        elif new_status == PaymentStatus.PENDING:
            payment.paid_at = None

        self.repo.save(payment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="payment.status_change",
            entity_type="payment",
            entity_id=payment.id,
            summary=f"Status alterado para {new_status.value}",
            metadata={"status": new_status.value},
        )
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def cancel(
        self,
        *,
        payment_id: int,
        payload: PaymentCancel,
        current_user: User,
    ) -> Payment:
        payment = self.get_by_id(payment_id)

        if payment.status == PaymentStatus.CANCELED:
            return payment

        payment.status = PaymentStatus.CANCELED
        payment.canceled_at = _now_utc()
        payment.cancellation_reason = payload.cancellation_reason

        self.repo.save(payment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="payment.cancel",
            entity_type="payment",
            entity_id=payment.id,
            summary="Pagamento cancelado",
        )
        self.db.commit()
        self.db.refresh(payment)
        return payment


# ============================================================================
# Reports service
# ============================================================================


class FinanceReportsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.payment_repo = PaymentRepository(db)

    def revenue_in_period(self, *, start: datetime, end: datetime) -> RevenueReport:
        try:
            start = ensure_aware_utc(start, "from")
            end = ensure_aware_utc(end, "to")
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        if end <= start:
            raise ValidationError("Parâmetro 'to' deve ser maior que 'from'")
        total, count = self.payment_repo.sum_revenue_between(start=start, end=end)
        return RevenueReport(
            period_start=start,
            period_end=end,
            total_paid=_money(total),
            number_of_payments=count,
        )

    def revenue_current_week(self) -> RevenueReport:
        start, end = _current_week_window()
        return self.revenue_in_period(start=start, end=end)

    def revenue_current_month(self) -> RevenueReport:
        start, end = _current_month_window()
        return self.revenue_in_period(start=start, end=end)

    def list_pending_payments(
        self,
        *,
        params: PaginationParams,
        from_due: Optional[datetime] = None,
        to_due: Optional[datetime] = None,
    ) -> tuple[list[Payment], int]:
        try:
            from_due = ensure_optional_aware_utc(from_due, "from")
            to_due = ensure_optional_aware_utc(to_due, "to")
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        items, total = self.payment_repo.list_pending(
            from_due=from_due,
            to_due=to_due,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    def summary(self) -> FinanceSummary:
        month_start, month_end = _current_month_window()
        week_start, week_end = _current_week_window()

        month_total, month_count = self.payment_repo.sum_revenue_between(
            start=month_start, end=month_end
        )
        week_total, _ = self.payment_repo.sum_revenue_between(
            start=week_start, end=week_end
        )
        pending_total, pending_count = self.payment_repo.sum_pending()
        canceled_total, _ = self.payment_repo.sum_canceled()

        return FinanceSummary(
            total_paid_current_month=_money(month_total),
            total_paid_current_week=_money(week_total),
            total_pending=_money(pending_total),
            total_canceled=_money(canceled_total),
            number_of_paid_payments=month_count,
            number_of_pending_payments=pending_count,
        )


# ============================================================================
# Re-export para uso fora do módulo (ex.: cron jobs futuros)
# ============================================================================

__all__ = [
    "BudgetService",
    "PaymentService",
    "FinanceReportsService",
    "_current_week_window",
    "_current_month_window",
]
