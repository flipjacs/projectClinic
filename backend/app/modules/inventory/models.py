from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.modules.users.models import User


# ============================================================================
# Enums
# ============================================================================


class InventoryCategory(str, Enum):
    DISPOSABLE = "disposable"
    MEDICATION = "medication"
    ANESTHETIC = "anesthetic"
    CLEANING = "cleaning"
    INSTRUMENT = "instrument"
    RESTORATIVE_MATERIAL = "restorative_material"
    PROTECTIVE_EQUIPMENT = "protective_equipment"
    OTHER = "other"


class UnitOfMeasure(str, Enum):
    UNIT = "unit"
    BOX = "box"
    PACKAGE = "package"
    ML = "ml"
    L = "l"
    MG = "mg"
    G = "g"
    KG = "kg"
    PAIR = "pair"
    ROLL = "roll"
    OTHER = "other"


class MovementType(str, Enum):
    IN = "in"
    OUT = "out"
    ADJUSTMENT = "adjustment"


# ============================================================================
# Inventory Item
# ============================================================================


class InventoryItem(Base, TimestampMixin):
    __tablename__ = "inventory_items"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category: Mapped[InventoryCategory] = mapped_column(
        SAEnum(
            InventoryCategory,
            name="inventory_category",
            native_enum=False,
            length=40,
            validate_strings=True,
        ),
        nullable=False,
        index=True,
    )

    # Numeric(12, 3) suporta tanto contagem inteira (caixas, pares) quanto
    # subdivisões (ml, mg). Sempre Decimal no Python.
    current_quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 3),
        nullable=False,
        server_default="0.000",
    )
    minimum_quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 3),
        nullable=False,
        server_default="0.000",
    )

    unit_of_measure: Mapped[UnitOfMeasure] = mapped_column(
        SAEnum(
            UnitOfMeasure,
            name="unit_of_measure",
            native_enum=False,
            length=20,
            validate_strings=True,
        ),
        nullable=False,
    )

    supplier: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    unit_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )

    expiration_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True, index=True
    )

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=expression.true(),
        index=True,
    )

    movements: Mapped[list["InventoryMovement"]] = relationship(
        back_populates="item",
        order_by="InventoryMovement.created_at.desc()",
        lazy="raise",  # acessa apenas via repository; evita lazy-load acidental
    )

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<InventoryItem id={self.id} name={self.name!r} "
            f"qty={self.current_quantity} active={self.is_active}>"
        )


# ============================================================================
# Inventory Movement (auditável, imutável após criado)
# ============================================================================


class InventoryMovement(Base):
    """Histórico de movimentações.

    Não usa TimestampMixin porque deliberadamente não há `updated_at`:
    movimentação registrada não pode ser alterada — apenas compensada por
    outra movimentação (audit trail).
    """

    __tablename__ = "inventory_movements"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    inventory_item_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("inventory_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    movement_type: Mapped[MovementType] = mapped_column(
        SAEnum(
            MovementType,
            name="movement_type",
            native_enum=False,
            length=20,
            validate_strings=True,
        ),
        nullable=False,
        index=True,
    )

    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 3), nullable=False)
    # Para auditoria: armazena o saldo do item depois desta movimentação.
    resulting_quantity: Mapped[Decimal] = mapped_column(
        Numeric(12, 3), nullable=False
    )
    reason: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    created_by_user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    item: Mapped[InventoryItem] = relationship(back_populates="movements")
    created_by: Mapped["User"] = relationship(lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<InventoryMovement id={self.id} item={self.inventory_item_id} "
            f"type={self.movement_type.value} qty={self.quantity} "
            f"resulting={self.resulting_quantity}>"
        )
