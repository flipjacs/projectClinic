from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    BigInteger,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.modules.patients.models import Patient
    from app.modules.procedures.models import Procedure
    from app.modules.users.models import User


# ============================================================================
# Enums
# ============================================================================


class BudgetStatus(str, Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELED = "canceled"


# Status terminais — não podem mais transitar.
TERMINAL_BUDGET_STATUSES: frozenset[BudgetStatus] = frozenset(
    {BudgetStatus.REJECTED, BudgetStatus.CANCELED}
)

# Status que aceitam pagamento.
PAYABLE_BUDGET_STATUSES: frozenset[BudgetStatus] = frozenset(
    {BudgetStatus.DRAFT, BudgetStatus.APPROVED}
)


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CANCELED = "canceled"


# Status que contam como receita realizada.
REVENUE_PAYMENT_STATUSES: frozenset[PaymentStatus] = frozenset({PaymentStatus.PAID})

# Status que contam como receita ainda a receber.
PENDING_PAYMENT_STATUSES: frozenset[PaymentStatus] = frozenset(
    {PaymentStatus.PENDING, PaymentStatus.PARTIALLY_PAID}
)


class PaymentMethod(str, Enum):
    CASH = "cash"
    PIX = "pix"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    BANK_TRANSFER = "bank_transfer"
    OTHER = "other"


# ============================================================================
# Budget
# ============================================================================


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    patient_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    dentist_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    status: Mapped[BudgetStatus] = mapped_column(
        SAEnum(
            BudgetStatus,
            name="budget_status",
            native_enum=False,
            length=30,
            validate_strings=True,
        ),
        nullable=False,
        default=BudgetStatus.DRAFT,
        server_default=BudgetStatus.DRAFT.value,
        index=True,
    )

    # Calculado sempre no backend — nunca confiar no valor enviado pelo cliente.
    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        server_default="0.00",
    )

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    items: Mapped[list["BudgetItem"]] = relationship(
        back_populates="budget",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="BudgetItem.id.asc()",
    )

    patient: Mapped["Patient"] = relationship(lazy="selectin")
    dentist: Mapped["User"] = relationship(lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Budget id={self.id} patient_id={self.patient_id} "
            f"status={self.status.value} total={self.total_amount}>"
        )


# ============================================================================
# Budget Item
# ============================================================================


class BudgetItem(Base, TimestampMixin):
    __tablename__ = "budget_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    budget_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("budgets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    procedure_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("procedures.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    budget: Mapped[Budget] = relationship(back_populates="items")
    procedure: Mapped["Procedure"] = relationship(lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<BudgetItem id={self.id} budget_id={self.budget_id} "
            f"procedure_id={self.procedure_id} qty={self.quantity} "
            f"unit={self.unit_price} total={self.total_price}>"
        )


# ============================================================================
# Payment
# ============================================================================


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    patient_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    budget_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("budgets.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    payment_method: Mapped[PaymentMethod] = mapped_column(
        SAEnum(
            PaymentMethod,
            name="payment_method",
            native_enum=False,
            length=30,
            validate_strings=True,
        ),
        nullable=False,
    )
    status: Mapped[PaymentStatus] = mapped_column(
        SAEnum(
            PaymentStatus,
            name="payment_status",
            native_enum=False,
            length=30,
            validate_strings=True,
        ),
        nullable=False,
        default=PaymentStatus.PENDING,
        server_default=PaymentStatus.PENDING.value,
        index=True,
    )

    # Quando o dinheiro entrou de fato.
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    # Vencimento (para pagamentos a prazo, parcelas etc.).
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    canceled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )

    patient: Mapped["Patient"] = relationship(lazy="selectin")
    budget: Mapped[Optional[Budget]] = relationship(lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Payment id={self.id} patient_id={self.patient_id} "
            f"budget_id={self.budget_id} status={self.status.value} "
            f"amount={self.amount}>"
        )
