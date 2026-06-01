from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.modules.inventory.models import (
    InventoryCategory,
    MovementType,
    UnitOfMeasure,
)


# ============================================================================
# User snapshot (autor da movimentação)
# ============================================================================


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


# ============================================================================
# Inventory item
# ============================================================================


class InventoryItemCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    category: InventoryCategory
    unit_of_measure: UnitOfMeasure
    current_quantity: Decimal = Field(
        default=Decimal("0"), ge=0, max_digits=12, decimal_places=3
    )
    minimum_quantity: Decimal = Field(
        default=Decimal("0"), ge=0, max_digits=12, decimal_places=3
    )
    supplier: Optional[str] = Field(default=None, max_length=200)
    unit_price: Optional[Decimal] = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    expiration_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("name")
    @classmethod
    def _v_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Nome muito curto")
        return v

    @field_validator("supplier", "notes")
    @classmethod
    def _v_strip(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @field_validator("expiration_date")
    @classmethod
    def _v_expiration(cls, v):
        if v is None:
            return v
        if v.year < 1900:
            raise ValueError("Data de validade inválida")
        return v


class InventoryItemUpdate(BaseModel):
    """Atualização parcial. `current_quantity` NÃO é editável aqui —
    use movimentações (`/movements/in`, `/movements/out`, `/movements/adjustment`).
    """

    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    category: Optional[InventoryCategory] = None
    unit_of_measure: Optional[UnitOfMeasure] = None
    minimum_quantity: Optional[Decimal] = Field(
        default=None, ge=0, max_digits=12, decimal_places=3
    )
    supplier: Optional[str] = Field(default=None, max_length=200)
    unit_price: Optional[Decimal] = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    expiration_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("name")
    @classmethod
    def _v_name(cls, v):
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Nome muito curto")
        return v

    @field_validator("supplier", "notes")
    @classmethod
    def _v_strip(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @field_validator("expiration_date")
    @classmethod
    def _v_expiration(cls, v):
        if v is None:
            return v
        if v.year < 1900:
            raise ValueError("Data de validade inválida")
        return v

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class InventoryItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: InventoryCategory
    unit_of_measure: UnitOfMeasure
    current_quantity: Decimal
    minimum_quantity: Decimal
    supplier: Optional[str] = None
    unit_price: Optional[Decimal] = None
    expiration_date: Optional[date] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Movements
# ============================================================================


class MovementCreate(BaseModel):
    """Body comum para IN e OUT — quantidade estritamente positiva."""

    quantity: Decimal = Field(..., gt=0, max_digits=12, decimal_places=3)
    reason: Optional[str] = Field(default=None, max_length=500)

    @field_validator("reason")
    @classmethod
    def _v_reason(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class AdjustmentCreate(BaseModel):
    """Body do ajuste: `quantity` é o saldo final desejado (não delta).

    Por segurança, motivo é obrigatório.
    """

    quantity: Decimal = Field(..., ge=0, max_digits=12, decimal_places=3)
    reason: str = Field(..., min_length=3, max_length=500)

    @field_validator("reason")
    @classmethod
    def _v_reason(cls, v):
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Justificativa do ajuste é obrigatória")
        return v


class MovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inventory_item_id: int
    movement_type: MovementType
    quantity: Decimal
    resulting_quantity: Decimal
    reason: Optional[str] = None
    created_by_user_id: int
    created_at: datetime
    created_by: UserSummary


# ============================================================================
# Alerts / Summary
# ============================================================================


class InventorySummary(BaseModel):
    total_active_items: int
    total_inactive_items: int
    low_stock_items_count: int
    expiring_items_count: int
    total_movements_current_month: int


class ExpiringItemRead(InventoryItemRead):
    """Item próximo do vencimento — inclui dias restantes para a janela."""

    days_until_expiration: int
