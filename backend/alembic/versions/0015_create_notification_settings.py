"""create notification settings table

Revision ID: 0015_notification_settings
Revises: 0014_create_appearance_settings
Create Date: 2026-07-18 12:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0015_notification_settings"
down_revision: Union[str, None] = "0014_create_appearance_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_settings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        # appointments
        sa.Column("appt_remind_24h", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("appt_remind_2h", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("appt_remind_30min", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("appt_confirmation_message", sa.Boolean(), nullable=False, server_default=sa.true()),
        # finance
        sa.Column("finance_payment_overdue", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("finance_payment_received", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("finance_new_budget", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("finance_reminder_cancelled", sa.Boolean(), nullable=False, server_default=sa.true()),
        # inventory
        sa.Column("inventory_low_stock", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("inventory_product_expiring", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("inventory_auto_replenishment", sa.Boolean(), nullable=False, server_default=sa.false()),
        # system
        sa.Column("system_updates", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("system_critical_failures", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("system_backup_completed", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("system_integrations", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.PrimaryKeyConstraint("id", name="pk_notification_settings"),
    )


def downgrade() -> None:
    op.drop_table("notification_settings")
