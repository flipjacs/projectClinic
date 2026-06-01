"""create appointments table

Revision ID: 0004_create_appointments
Revises: 0003_create_medical_records
Create Date: 2026-05-31 00:00:01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0004_create_appointments"
down_revision: Union[str, None] = "0003_create_medical_records"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_STATUS_VALUES = (
    "scheduled",
    "confirmed",
    "in_progress",
    "completed",
    "canceled",
    "no_show",
)


def upgrade() -> None:
    op.create_table(
        "appointments",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.BigInteger(), nullable=False),
        sa.Column("dentist_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "scheduled_start",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "scheduled_end",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="scheduled",
        ),
        sa.Column("reason", sa.String(length=200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "rescheduled_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "original_start",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "canceled_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "cancellation_reason",
            sa.String(length=500),
            nullable=True,
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
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
            name="fk_appointments_patient_id_patients",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["dentist_id"],
            ["users.id"],
            name="fk_appointments_dentist_id_users",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_appointments"),
        sa.CheckConstraint(
            "status IN ("
            + ", ".join(f"'{v}'" for v in _STATUS_VALUES)
            + ")",
            name="ck_appointments_appointment_status",
        ),
        sa.CheckConstraint(
            "scheduled_end > scheduled_start",
            name="ck_appointments_window_order",
        ),
    )
    op.create_index(
        "ix_appointments_patient_id", "appointments", ["patient_id"], unique=False
    )
    op.create_index(
        "ix_appointments_dentist_id", "appointments", ["dentist_id"], unique=False
    )
    op.create_index(
        "ix_appointments_scheduled_start",
        "appointments",
        ["scheduled_start"],
        unique=False,
    )
    op.create_index(
        "ix_appointments_status", "appointments", ["status"], unique=False
    )
    # Composto otimiza tanto a query de conflito quanto a agenda de um dentista
    # filtrada por janela temporal.
    op.create_index(
        "ix_appointments_dentist_start",
        "appointments",
        ["dentist_id", "scheduled_start"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_appointments_dentist_start", table_name="appointments")
    op.drop_index("ix_appointments_status", table_name="appointments")
    op.drop_index("ix_appointments_scheduled_start", table_name="appointments")
    op.drop_index("ix_appointments_dentist_id", table_name="appointments")
    op.drop_index("ix_appointments_patient_id", table_name="appointments")
    op.drop_table("appointments")
