"""create clinic settings tables

Revision ID: 0012_create_settings_tables
Revises: 0011_audit_log_masked_diff
Create Date: 2026-07-17 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0012_create_settings_tables"
down_revision: Union[str, None] = "0011_audit_log_masked_diff"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "clinic_settings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("trade_name", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("technical_director", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("cro", sa.String(length=20), nullable=False, server_default=""),
        sa.Column("phone", sa.String(length=20), nullable=False, server_default=""),
        sa.Column("whatsapp", sa.String(length=20), nullable=False, server_default=""),
        sa.Column("email", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("website", sa.String(length=180), nullable=False, server_default=""),
        sa.Column("zip_code", sa.String(length=9), nullable=False, server_default=""),
        sa.Column("street", sa.String(length=160), nullable=False, server_default=""),
        sa.Column("number", sa.String(length=20), nullable=False, server_default=""),
        sa.Column("complement", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("district", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("city", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("state", sa.String(length=2), nullable=False, server_default=""),
        sa.Column("country", sa.String(length=60), nullable=False, server_default="Brasil"),
        sa.Column("logo_path", sa.String(length=255), nullable=True),
        sa.Column("logo_small_path", sa.String(length=255), nullable=True),
        sa.Column("observations", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("default_message", sa.String(length=300), nullable=False, server_default=""),
        sa.Column("pdf_footer", sa.String(length=200), nullable=False, server_default=""),
        sa.Column(
            "institutional_description",
            sa.String(length=1000),
            nullable=False,
            server_default="",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_clinic_settings"),
    )

    op.create_table(
        "clinic_schedule_days",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("clinic_id", sa.BigInteger(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("opens_at", sa.String(length=5), nullable=False, server_default="08:00"),
        sa.Column("closes_at", sa.String(length=5), nullable=False, server_default="18:00"),
        sa.Column("break_starts_at", sa.String(length=5), nullable=True),
        sa.Column("break_ends_at", sa.String(length=5), nullable=True),
        sa.ForeignKeyConstraint(
            ["clinic_id"],
            ["clinic_settings.id"],
            name="fk_clinic_schedule_days_clinic_id_clinic_settings",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_clinic_schedule_days"),
        sa.UniqueConstraint(
            "clinic_id", "weekday", name="uq_clinic_schedule_days_clinic_id"
        ),
    )
    op.create_index(
        "ix_clinic_schedule_days_clinic_id",
        "clinic_schedule_days",
        ["clinic_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_clinic_schedule_days_clinic_id", table_name="clinic_schedule_days")
    op.drop_table("clinic_schedule_days")
    op.drop_table("clinic_settings")
