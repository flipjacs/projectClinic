"""create payments table

Revision ID: 0007_create_payments
Revises: 0006_create_budgets
Create Date: 2026-05-31 00:00:04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0007_create_payments"
down_revision: Union[str, None] = "0006_create_budgets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_PAYMENT_STATUSES = ("pending", "partially_paid", "paid", "canceled")
_PAYMENT_METHODS = (
    "cash",
    "pix",
    "credit_card",
    "debit_card",
    "bank_transfer",
    "other",
)


def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.BigInteger(), nullable=False),
        sa.Column("budget_id", sa.BigInteger(), nullable=True),
        sa.Column("amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("payment_method", sa.String(length=30), nullable=False),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("canceled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.String(length=500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
            name="fk_payments_patient_id_patients",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["budget_id"],
            ["budgets.id"],
            name="fk_payments_budget_id_budgets",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_payments"),
        sa.CheckConstraint(
            "status IN (" + ", ".join(f"'{v}'" for v in _PAYMENT_STATUSES) + ")",
            name="ck_payments_payment_status",
        ),
        sa.CheckConstraint(
            "payment_method IN ("
            + ", ".join(f"'{v}'" for v in _PAYMENT_METHODS)
            + ")",
            name="ck_payments_payment_method",
        ),
        sa.CheckConstraint("amount > 0", name="ck_payments_amount_positive"),
    )
    op.create_index(
        "ix_payments_patient_id", "payments", ["patient_id"], unique=False
    )
    op.create_index(
        "ix_payments_budget_id", "payments", ["budget_id"], unique=False
    )
    op.create_index("ix_payments_status", "payments", ["status"], unique=False)
    op.create_index("ix_payments_paid_at", "payments", ["paid_at"], unique=False)
    op.create_index("ix_payments_due_date", "payments", ["due_date"], unique=False)
    op.create_index(
        "ix_payments_created_at", "payments", ["created_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_payments_created_at", table_name="payments")
    op.drop_index("ix_payments_due_date", table_name="payments")
    op.drop_index("ix_payments_paid_at", table_name="payments")
    op.drop_index("ix_payments_status", table_name="payments")
    op.drop_index("ix_payments_budget_id", table_name="payments")
    op.drop_index("ix_payments_patient_id", table_name="payments")
    op.drop_table("payments")
