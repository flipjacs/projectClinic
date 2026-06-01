"""create inventory_items and inventory_movements tables

Revision ID: 0008_create_inventory
Revises: 0007_create_payments
Create Date: 2026-05-31 00:00:05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0008_create_inventory"
down_revision: Union[str, None] = "0007_create_payments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_CATEGORIES = (
    "disposable",
    "medication",
    "anesthetic",
    "cleaning",
    "instrument",
    "restorative_material",
    "protective_equipment",
    "other",
)

_UNITS = (
    "unit",
    "box",
    "package",
    "ml",
    "l",
    "mg",
    "g",
    "kg",
    "pair",
    "roll",
    "other",
)

_MOVEMENT_TYPES = ("in", "out", "adjustment")


def upgrade() -> None:
    op.create_table(
        "inventory_items",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column(
            "current_quantity",
            sa.Numeric(precision=12, scale=3),
            nullable=False,
            server_default="0.000",
        ),
        sa.Column(
            "minimum_quantity",
            sa.Numeric(precision=12, scale=3),
            nullable=False,
            server_default="0.000",
        ),
        sa.Column("unit_of_measure", sa.String(length=20), nullable=False),
        sa.Column("supplier", sa.String(length=200), nullable=True),
        sa.Column(
            "unit_price", sa.Numeric(precision=10, scale=2), nullable=True
        ),
        sa.Column("expiration_date", sa.Date(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
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
        sa.PrimaryKeyConstraint("id", name="pk_inventory_items"),
        sa.CheckConstraint(
            "category IN (" + ", ".join(f"'{v}'" for v in _CATEGORIES) + ")",
            name="ck_inventory_items_inventory_category",
        ),
        sa.CheckConstraint(
            "unit_of_measure IN (" + ", ".join(f"'{v}'" for v in _UNITS) + ")",
            name="ck_inventory_items_unit_of_measure",
        ),
        sa.CheckConstraint(
            "current_quantity >= 0",
            name="ck_inventory_items_current_quantity_non_negative",
        ),
        sa.CheckConstraint(
            "minimum_quantity >= 0",
            name="ck_inventory_items_minimum_quantity_non_negative",
        ),
        sa.CheckConstraint(
            "unit_price IS NULL OR unit_price >= 0",
            name="ck_inventory_items_unit_price_non_negative",
        ),
    )
    op.create_index(
        "ix_inventory_items_name", "inventory_items", ["name"], unique=False
    )
    op.create_index(
        "ix_inventory_items_category",
        "inventory_items",
        ["category"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_items_is_active",
        "inventory_items",
        ["is_active"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_items_expiration_date",
        "inventory_items",
        ["expiration_date"],
        unique=False,
    )

    op.create_table(
        "inventory_movements",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("inventory_item_id", sa.BigInteger(), nullable=False),
        sa.Column("movement_type", sa.String(length=20), nullable=False),
        sa.Column(
            "quantity",
            sa.Numeric(precision=12, scale=3),
            nullable=False,
        ),
        sa.Column(
            "resulting_quantity",
            sa.Numeric(precision=12, scale=3),
            nullable=False,
        ),
        sa.Column("reason", sa.String(length=500), nullable=True),
        sa.Column("created_by_user_id", sa.BigInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["inventory_item_id"],
            ["inventory_items.id"],
            name="fk_inventory_movements_inventory_item_id_inventory_items",
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
            name="fk_inventory_movements_created_by_user_id_users",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_inventory_movements"),
        sa.CheckConstraint(
            "movement_type IN ("
            + ", ".join(f"'{v}'" for v in _MOVEMENT_TYPES)
            + ")",
            name="ck_inventory_movements_movement_type",
        ),
        sa.CheckConstraint(
            "quantity >= 0", name="ck_inventory_movements_quantity_non_negative"
        ),
        sa.CheckConstraint(
            "resulting_quantity >= 0",
            name="ck_inventory_movements_resulting_quantity_non_negative",
        ),
    )
    op.create_index(
        "ix_inventory_movements_inventory_item_id",
        "inventory_movements",
        ["inventory_item_id"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_movements_movement_type",
        "inventory_movements",
        ["movement_type"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_movements_created_by_user_id",
        "inventory_movements",
        ["created_by_user_id"],
        unique=False,
    )
    op.create_index(
        "ix_inventory_movements_created_at",
        "inventory_movements",
        ["created_at"],
        unique=False,
    )
    # Composto otimiza o histórico cronológico por item.
    op.create_index(
        "ix_inventory_movements_item_created",
        "inventory_movements",
        ["inventory_item_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_inventory_movements_item_created", table_name="inventory_movements"
    )
    op.drop_index(
        "ix_inventory_movements_created_at", table_name="inventory_movements"
    )
    op.drop_index(
        "ix_inventory_movements_created_by_user_id",
        table_name="inventory_movements",
    )
    op.drop_index(
        "ix_inventory_movements_movement_type", table_name="inventory_movements"
    )
    op.drop_index(
        "ix_inventory_movements_inventory_item_id",
        table_name="inventory_movements",
    )
    op.drop_table("inventory_movements")

    op.drop_index(
        "ix_inventory_items_expiration_date", table_name="inventory_items"
    )
    op.drop_index("ix_inventory_items_is_active", table_name="inventory_items")
    op.drop_index("ix_inventory_items_category", table_name="inventory_items")
    op.drop_index("ix_inventory_items_name", table_name="inventory_items")
    op.drop_table("inventory_items")
