"""create patients and patient_health_info tables

Revision ID: 0002_create_patients
Revises: 0001_create_users
Create Date: 2026-05-30 00:00:01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_create_patients"
down_revision: Union[str, None] = "0001_create_users"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "patients",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("cpf", sa.String(length=11), nullable=False),
        sa.Column("birth_date", sa.Date(), nullable=False),
        sa.Column("phone", sa.String(length=11), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=True),
        sa.Column("street", sa.String(length=150), nullable=False),
        sa.Column("number", sa.String(length=20), nullable=False),
        sa.Column("neighborhood", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("state", sa.String(length=2), nullable=False),
        sa.Column("zip_code", sa.String(length=8), nullable=False),
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
        sa.PrimaryKeyConstraint("id", name="pk_patients"),
        sa.UniqueConstraint("cpf", name="uq_patients_cpf"),
    )
    op.create_index("ix_patients_name", "patients", ["name"], unique=False)
    op.create_index("ix_patients_cpf", "patients", ["cpf"], unique=False)
    op.create_index("ix_patients_phone", "patients", ["phone"], unique=False)
    op.create_index("ix_patients_is_active", "patients", ["is_active"], unique=False)

    op.create_table(
        "patient_health_info",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "has_disease",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("disease_description", sa.Text(), nullable=True),
        sa.Column(
            "has_allergy",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("allergy_description", sa.Text(), nullable=True),
        sa.Column(
            "uses_medication",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column("medication_description", sa.Text(), nullable=True),
        sa.Column("health_observations", sa.Text(), nullable=True),
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
            name="fk_patient_health_info_patient_id_patients",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_patient_health_info"),
        sa.UniqueConstraint("patient_id", name="uq_patient_health_info_patient_id"),
    )
    op.create_index(
        "ix_patient_health_info_patient_id",
        "patient_health_info",
        ["patient_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_patient_health_info_patient_id", table_name="patient_health_info")
    op.drop_table("patient_health_info")

    op.drop_index("ix_patients_is_active", table_name="patients")
    op.drop_index("ix_patients_phone", table_name="patients")
    op.drop_index("ix_patients_cpf", table_name="patients")
    op.drop_index("ix_patients_name", table_name="patients")
    op.drop_table("patients")
