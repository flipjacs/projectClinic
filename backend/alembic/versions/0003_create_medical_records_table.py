"""create medical_records table

Revision ID: 0003_create_medical_records
Revises: 0002_create_patients
Create Date: 2026-05-31 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003_create_medical_records"
down_revision: Union[str, None] = "0002_create_patients"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "medical_records",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("patient_id", sa.BigInteger(), nullable=False),
        sa.Column("dentist_id", sa.BigInteger(), nullable=False),
        sa.Column("appointment_id", sa.BigInteger(), nullable=True),
        sa.Column("visit_date", sa.Date(), nullable=False),
        sa.Column("main_complaint", sa.Text(), nullable=False),
        sa.Column("diagnosis", sa.Text(), nullable=True),
        sa.Column("performed_procedure", sa.Text(), nullable=True),
        sa.Column("clinical_evolution", sa.Text(), nullable=True),
        sa.Column("observations", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["patients.id"],
            name="fk_medical_records_patient_id_patients",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["dentist_id"],
            ["users.id"],
            name="fk_medical_records_dentist_id_users",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_medical_records"),
    )
    op.create_index(
        "ix_medical_records_patient_id",
        "medical_records",
        ["patient_id"],
        unique=False,
    )
    op.create_index(
        "ix_medical_records_dentist_id",
        "medical_records",
        ["dentist_id"],
        unique=False,
    )
    op.create_index(
        "ix_medical_records_appointment_id",
        "medical_records",
        ["appointment_id"],
        unique=False,
    )
    op.create_index(
        "ix_medical_records_visit_date",
        "medical_records",
        ["visit_date"],
        unique=False,
    )
    op.create_index(
        "ix_medical_records_is_active",
        "medical_records",
        ["is_active"],
        unique=False,
    )
    # Índice composto otimizado para listagem cronológica por paciente.
    op.create_index(
        "ix_medical_records_patient_visit",
        "medical_records",
        ["patient_id", "visit_date"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_medical_records_patient_visit", table_name="medical_records")
    op.drop_index("ix_medical_records_is_active", table_name="medical_records")
    op.drop_index("ix_medical_records_visit_date", table_name="medical_records")
    op.drop_index("ix_medical_records_appointment_id", table_name="medical_records")
    op.drop_index("ix_medical_records_dentist_id", table_name="medical_records")
    op.drop_index("ix_medical_records_patient_id", table_name="medical_records")
    op.drop_table("medical_records")
