"""create budgets and budget_items tables

Revision ID: 0006_create_budgets
Revises: 0005_create_procedures
Create Date: 2026-05-31 00:00:03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0006_create_budgets"
down_revision: Union[str, None] = "0005_create_procedures"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_BUDGET_STATUSES = ("draft", "approved", "rejected", "canceled")


def upgrade() -> None:
    op.create_table(
        "budgets",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.BigInteger(), nullable=False),
        sa.Column("dentist_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "total_amount",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column("notes", sa.Text(), nullable=True),
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
            name="fk_budgets_patient_id_patients",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["dentist_id"],
            ["users.id"],
            name="fk_budgets_dentist_id_users",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_budgets"),
        sa.CheckConstraint(
            "status IN (" + ", ".join(f"'{v}'" for v in _BUDGET_STATUSES) + ")",
            name="ck_budgets_budget_status",
        ),
        sa.CheckConstraint(
            "total_amount >= 0", name="ck_budgets_total_amount_non_negative"
        ),
    )
    op.create_index("ix_budgets_patient_id", "budgets", ["patient_id"], unique=False)
    op.create_index("ix_budgets_dentist_id", "budgets", ["dentist_id"], unique=False)
    op.create_index("ix_budgets_status", "budgets", ["status"], unique=False)
    op.create_index("ix_budgets_created_at", "budgets", ["created_at"], unique=False)

    op.create_table(
        "budget_items",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("budget_id", sa.BigInteger(), nullable=False),
        sa.Column("procedure_id", sa.BigInteger(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("total_price", sa.Numeric(precision=10, scale=2), nullable=False),
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
            ["budget_id"],
            ["budgets.id"],
            name="fk_budget_items_budget_id_budgets",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["procedure_id"],
            ["procedures.id"],
            name="fk_budget_items_procedure_id_procedures",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_budget_items"),
        sa.CheckConstraint("quantity > 0", name="ck_budget_items_quantity_positive"),
        sa.CheckConstraint(
            "unit_price >= 0", name="ck_budget_items_unit_price_non_negative"
        ),
        sa.CheckConstraint(
            "total_price >= 0", name="ck_budget_items_total_price_non_negative"
        ),
    )
    op.create_index(
        "ix_budget_items_budget_id", "budget_items", ["budget_id"], unique=False
    )
    op.create_index(
        "ix_budget_items_procedure_id",
        "budget_items",
        ["procedure_id"],
        unique=False,
    )


def downgrade() -> None:
    # drop_table remove índices/FKs atomicamente (evita o erro 1553 do MySQL ao
    # tentar dropar um índice que dá suporte a uma foreign key).
    op.drop_table("budget_items")
    op.drop_table("budgets")
