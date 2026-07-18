"""create user appearance settings table

Revision ID: 0014_create_appearance_settings
Revises: 0013_create_security_settings
Create Date: 2026-07-18 00:00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_create_appearance_settings"
down_revision: Union[str, None] = "0013_create_security_settings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_appearance_settings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("theme", sa.String(length=10), nullable=False, server_default="light"),
        sa.Column("density", sa.String(length=12), nullable=False, server_default="comfortable"),
        sa.Column("language", sa.String(length=5), nullable=False, server_default="pt-BR"),
        sa.Column("reduced_motion", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("high_contrast", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("confirm_critical_actions", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("auto_save_filters", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("reopen_last_page", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("theme IN ('light','dark','system')", name="ck_user_appearance_settings_theme_valid"),
        sa.CheckConstraint(
            "density IN ('compact','comfortable','spacious')",
            name="ck_user_appearance_settings_density_valid",
        ),
        sa.CheckConstraint(
            "language IN ('pt-BR','en','es')", name="ck_user_appearance_settings_language_valid"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_user_appearance_settings_user_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_user_appearance_settings"),
        sa.UniqueConstraint("user_id", name="uq_user_appearance_settings_user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_appearance_settings")
