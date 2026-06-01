"""audit logs and security indexes

Revision ID: 0010_audit_logs_security_indexes
Revises: 0009_harden_indexes_medical_fk
Create Date: 2026-06-01 00:00:01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0010_audit_logs_security_indexes"
down_revision: Union[str, None] = "0009_harden_indexes_medical_fk"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("actor_user_id", sa.BigInteger(), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=False),
        sa.Column("entity_id", sa.BigInteger(), nullable=True),
        sa.Column("summary", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["actor_user_id"],
            ["users.id"],
            name="fk_audit_logs_actor_user_id_users",
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_audit_logs"),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"], unique=False)
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"], unique=False)
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"], unique=False)
    op.create_index("ix_audit_logs_entity_id", "audit_logs", ["entity_id"], unique=False)
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"], unique=False)
    op.create_index(
        "ix_audit_logs_entity_created",
        "audit_logs",
        ["entity_type", "entity_id", "created_at"],
        unique=False,
    )

    op.create_index("ix_patients_created_at", "patients", ["created_at"], unique=False)
    op.create_index(
        "ix_appointments_scheduled_end",
        "appointments",
        ["scheduled_end"],
        unique=False,
    )
    op.create_index("ix_appointments_created_at", "appointments", ["created_at"], unique=False)
    op.create_index(
        "ix_medical_records_created_at",
        "medical_records",
        ["created_at"],
        unique=False,
    )
    op.create_index("ix_payments_payment_method", "payments", ["payment_method"], unique=False)
    op.create_index(
        "ix_inventory_items_current_quantity",
        "inventory_items",
        ["current_quantity"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_items_minimum_quantity",
        "inventory_items",
        ["minimum_quantity"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_inventory_items_minimum_quantity", table_name="inventory_items")
    op.drop_index("ix_inventory_items_current_quantity", table_name="inventory_items")
    op.drop_index("ix_payments_payment_method", table_name="payments")
    op.drop_index("ix_medical_records_created_at", table_name="medical_records")
    op.drop_index("ix_appointments_created_at", table_name="appointments")
    op.drop_index("ix_appointments_scheduled_end", table_name="appointments")
    op.drop_index("ix_patients_created_at", table_name="patients")

    op.drop_index("ix_audit_logs_entity_created", table_name="audit_logs")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")
