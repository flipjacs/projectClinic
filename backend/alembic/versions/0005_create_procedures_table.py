"""create procedures table

Revision ID: 0005_create_procedures
Revises: 0004_create_appointments
Create Date: 2026-05-31 00:00:02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0005_create_procedures"
down_revision: Union[str, None] = "0004_create_appointments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "procedures",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "base_price",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column("estimated_duration_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
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
        sa.PrimaryKeyConstraint("id", name="pk_procedures"),
        sa.CheckConstraint("base_price >= 0", name="ck_procedures_base_price_non_negative"),
        sa.CheckConstraint(
            "estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0",
            name="ck_procedures_duration_positive",
        ),
    )
    op.create_index("ix_procedures_name", "procedures", ["name"], unique=False)
    op.create_index(
        "ix_procedures_is_active", "procedures", ["is_active"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_procedures_is_active", table_name="procedures")
    op.drop_index("ix_procedures_name", table_name="procedures")
    op.drop_table("procedures")
