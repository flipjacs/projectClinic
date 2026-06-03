from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Iterable, Optional, Sequence

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.modules.finance.models import (
    PENDING_PAYMENT_STATUSES,
    REVENUE_PAYMENT_STATUSES,
    Budget,
    BudgetStatus,
    Payment,
    PaymentStatus,
)


# ============================================================================
# Budgets
# ============================================================================


class BudgetRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, budget_id: int) -> Optional[Budget]:
        return self.db.get(Budget, budget_id)

    def get_for_update(self, budget_id: int) -> Optional[Budget]:
        stmt = select(Budget).where(Budget.id == budget_id).with_for_update()
        return self.db.execute(stmt).scalar_one_or_none()

    def search(
        self,
        *,
        patient_id: Optional[int] = None,
        dentist_id: Optional[int] = None,
        statuses: Optional[Iterable[BudgetStatus]] = None,
        include_canceled: bool = False,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Budget], int]:
        conditions = []
        if patient_id is not None:
            conditions.append(Budget.patient_id == patient_id)
        if dentist_id is not None:
            conditions.append(Budget.dentist_id == dentist_id)

        status_list = list(statuses) if statuses else None
        if status_list:
            conditions.append(Budget.status.in_(status_list))
        elif not include_canceled:
            conditions.append(Budget.status != BudgetStatus.CANCELED)

        where_clause = and_(*conditions) if conditions else None

        base = select(Budget)
        count_base = select(func.count(Budget.id))
        if where_clause is not None:
            base = base.where(where_clause)
            count_base = count_base.where(where_clause)

        total = self.db.execute(count_base).scalar_one()
        stmt = (
            base.order_by(Budget.created_at.desc(), Budget.id.desc())
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def add(self, budget: Budget) -> Budget:
        self.db.add(budget)
        self.db.flush()
        self.db.refresh(budget)
        return budget

    def save(self, budget: Budget) -> Budget:
        self.db.flush()
        self.db.refresh(budget)
        return budget


# ============================================================================
# Payments
# ============================================================================


class PaymentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, payment_id: int) -> Optional[Payment]:
        return self.db.get(Payment, payment_id)

    def search(
        self,
        *,
        patient_id: Optional[int] = None,
        budget_id: Optional[int] = None,
        statuses: Optional[Iterable[PaymentStatus]] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        date_field: str = "paid_at",
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Payment], int]:
        conditions = []
        if patient_id is not None:
            conditions.append(Payment.patient_id == patient_id)
        if budget_id is not None:
            conditions.append(Payment.budget_id == budget_id)

        status_list = list(statuses) if statuses else None
        if status_list:
            conditions.append(Payment.status.in_(status_list))

        date_col = Payment.paid_at if date_field == "paid_at" else Payment.created_at
        if from_dt is not None:
            conditions.append(date_col >= from_dt)
        if to_dt is not None:
            conditions.append(date_col < to_dt)

        where_clause = and_(*conditions) if conditions else None

        base = select(Payment)
        count_base = select(func.count(Payment.id))
        if where_clause is not None:
            base = base.where(where_clause)
            count_base = count_base.where(where_clause)

        total = self.db.execute(count_base).scalar_one()
        stmt = (
            base.order_by(
                # MySQL não suporta "NULLS LAST" (sintaxe PostgreSQL). Ordenar por
                # `paid_at IS NULL` (0 antes de 1) joga os sem data de pagamento
                # para o fim de forma portável entre MySQL e PostgreSQL.
                Payment.paid_at.is_(None),
                Payment.paid_at.desc(),
                Payment.created_at.desc(),
                Payment.id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def add(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        self.db.refresh(payment)
        return payment

    def save(self, payment: Payment) -> Payment:
        self.db.flush()
        self.db.refresh(payment)
        return payment

    # ----- agregações financeiras -----
    def sum_revenue_between(
        self,
        *,
        start: datetime,
        end: datetime,
    ) -> tuple[Decimal, int]:
        """Soma e contagem de pagamentos que viraram receita no intervalo."""
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

    def sum_pending(self) -> tuple[Decimal, int]:
        stmt = select(
            func.coalesce(func.sum(Payment.amount), 0),
            func.count(Payment.id),
        ).where(Payment.status.in_(list(PENDING_PAYMENT_STATUSES)))
        total, count = self.db.execute(stmt).one()
        return Decimal(total), int(count)

    def sum_canceled(self) -> tuple[Decimal, int]:
        stmt = select(
            func.coalesce(func.sum(Payment.amount), 0),
            func.count(Payment.id),
        ).where(Payment.status == PaymentStatus.CANCELED)
        total, count = self.db.execute(stmt).one()
        return Decimal(total), int(count)

    def sum_paid_for_budget(self, budget_id: int) -> Decimal:
        stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.budget_id == budget_id,
            Payment.status.in_(list(REVENUE_PAYMENT_STATUSES)),
        )
        return Decimal(self.db.execute(stmt).scalar_one())

    def sum_not_canceled_for_budget(
        self,
        budget_id: int,
        *,
        exclude_payment_id: Optional[int] = None,
        lock: bool = False,
    ) -> Decimal:
        """Soma dos pagamentos não cancelados de um orçamento.

        ``lock=True`` faz uma *locking read* (``SELECT ... FOR UPDATE``) das
        linhas envolvidas. Isso é essencial para a checagem anti-superpagamento
        sob o nível de isolamento padrão do MySQL (REPEATABLE READ): uma leitura
        comum usa o snapshot do início da transação e NÃO enxerga pagamentos
        recém-commitados por uma transação concorrente — mesmo já segurando o
        lock da linha do orçamento. A locking read força a leitura da versão
        mais recente já commitada e bloqueia inserções concorrentes na faixa.
        """
        if lock:
            stmt = select(Payment.amount).where(
                Payment.budget_id == budget_id,
                Payment.status != PaymentStatus.CANCELED,
            )
            if exclude_payment_id is not None:
                stmt = stmt.where(Payment.id != exclude_payment_id)
            stmt = stmt.with_for_update()
            rows = self.db.execute(stmt).scalars().all()
            return sum((Decimal(r) for r in rows), Decimal("0"))

        stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.budget_id == budget_id,
            Payment.status != PaymentStatus.CANCELED,
        )
        if exclude_payment_id is not None:
            stmt = stmt.where(Payment.id != exclude_payment_id)
        return Decimal(self.db.execute(stmt).scalar_one())

    def list_pending(
        self,
        *,
        from_due: Optional[datetime] = None,
        to_due: Optional[datetime] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[Payment], int]:
        conditions = [Payment.status.in_(list(PENDING_PAYMENT_STATUSES))]
        if from_due is not None:
            conditions.append(Payment.due_date >= from_due.date())
        if to_due is not None:
            conditions.append(Payment.due_date < to_due.date())

        base = select(Payment).where(and_(*conditions))
        count_base = select(func.count(Payment.id)).where(and_(*conditions))

        total = self.db.execute(count_base).scalar_one()
        stmt = (
            base.order_by(
                Payment.due_date.asc(),
                Payment.created_at.asc(),
                Payment.id.asc(),
            )
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total
