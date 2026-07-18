"""create security settings table

Revision ID: 0013_create_security_settings
Revises: 0012_create_settings_tables
Create Date: 2026-07-17 01:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0013_create_security_settings"
down_revision: Union[str, None] = "0012_create_settings_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "security_settings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        # password policy
        sa.Column("password_min_length", sa.Integer(), nullable=False, server_default="8"),
        sa.Column("password_require_uppercase", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("password_require_lowercase", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("password_require_numbers", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("password_require_special_chars", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("password_allow_reuse", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("password_expiration_days", sa.Integer(), nullable=False, server_default="0"),
        # session
        sa.Column("session_max_minutes", sa.Integer(), nullable=False, server_default="480"),
        sa.Column("session_auto_logout", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("session_remember_device", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("max_concurrent_sessions", sa.Integer(), nullable=False, server_default="5"),
        # lockout
        sa.Column("lockout_max_attempts", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("lockout_minutes", sa.Integer(), nullable=False, server_default="15"),
        sa.Column("lockout_auto_unlock", sa.Boolean(), nullable=False, server_default=sa.true()),
        # 2fa (prepared structure)
        sa.Column("two_factor_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.CheckConstraint(
            "password_min_length >= 6 AND password_min_length <= 64",
            name="ck_security_settings_password_min_length_range",
        ),
        sa.CheckConstraint(
            "password_expiration_days >= 0 AND password_expiration_days <= 365",
            name="ck_security_settings_password_expiration_days_range",
        ),
        sa.CheckConstraint(
            "session_max_minutes >= 5 AND session_max_minutes <= 43200",
            name="ck_security_settings_session_max_minutes_range",
        ),
        sa.CheckConstraint(
            "max_concurrent_sessions >= 1 AND max_concurrent_sessions <= 100",
            name="ck_security_settings_max_concurrent_sessions_range",
        ),
        sa.CheckConstraint(
            "lockout_max_attempts >= 1 AND lockout_max_attempts <= 20",
            name="ck_security_settings_lockout_max_attempts_range",
        ),
        sa.CheckConstraint(
            "lockout_minutes >= 1 AND lockout_minutes <= 1440",
            name="ck_security_settings_lockout_minutes_range",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_security_settings"),
    )


def downgrade() -> None:
    op.drop_table("security_settings")
