"""harden indexes and medical record appointment fk

Revision ID: 0009_harden_indexes_medical_fk
Revises: 0008_create_inventory
Create Date: 2026-06-01 00:00:00

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "0009_harden_indexes_medical_fk"
down_revision: Union[str, None] = "0008_create_inventory"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_users_role", "users", ["role"], unique=False)
    op.create_index("ix_users_is_active", "users", ["is_active"], unique=False)
    op.create_foreign_key(
        "fk_medical_records_appointment_id_appointments",
        "medical_records",
        "appointments",
        ["appointment_id"],
        ["id"],
        ondelete="RESTRICT",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_medical_records_appointment_id_appointments",
        "medical_records",
        type_="foreignkey",
    )
    op.drop_index("ix_users_is_active", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
