from __future__ import annotations

from datetime import datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.modules.audit.service import AuditLogService
from app.modules.inventory.models import (
    InventoryCategory,
    InventoryItem,
    InventoryMovement,
    MovementType,
)
from app.modules.inventory.repository import (
    InventoryItemRepository,
    InventoryMovementRepository,
)
from app.modules.inventory.schemas import (
    AdjustmentCreate,
    InventoryItemCreate,
    InventoryItemUpdate,
    InventorySummary,
    MovementCreate,
)
from app.modules.users.models import User
from app.shared.exceptions import (
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.shared.pagination import PaginationParams
from app.shared.timezone import (
    current_month_window as _current_month_window,
    ensure_optional_aware_utc,
    today_clinic as _today_clinic,
)

QUANTITY_PLACES = Decimal("0.001")
MONEY_PLACES = Decimal("0.01")
EXPIRATION_DEFAULT_DAYS = 30


def _qty(value: Decimal | int | float | str) -> Decimal:
    """Normaliza quantidade em Decimal(12,3)."""
    return Decimal(value).quantize(QUANTITY_PLACES, rounding=ROUND_HALF_UP)


def _money(value: Decimal | int | float | str) -> Decimal:
    return Decimal(value).quantize(MONEY_PLACES, rounding=ROUND_HALF_UP)


# ============================================================================
# Item service
# ============================================================================


class InventoryItemService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = InventoryItemRepository(db)
        self.audit = AuditLogService(db)

    def get_by_id(self, item_id: int) -> InventoryItem:
        item = self.repo.get(item_id)
        if not item:
            raise NotFoundError("Item de estoque não encontrado")
        return item

    def list_paginated(
        self,
        *,
        params: PaginationParams,
        term: Optional[str] = None,
        category: Optional[InventoryCategory] = None,
        include_inactive: bool = False,
        only_inactive: bool = False,
        low_stock: bool = False,
    ) -> tuple[list[InventoryItem], int]:
        items, total = self.repo.search(
            term=term,
            category=category,
            include_inactive=include_inactive,
            only_inactive=only_inactive,
            low_stock=low_stock,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    def create(self, payload: InventoryItemCreate, current_user: User) -> InventoryItem:
        item = InventoryItem(
            name=payload.name,
            category=payload.category,
            unit_of_measure=payload.unit_of_measure,
            current_quantity=_qty(payload.current_quantity),
            minimum_quantity=_qty(payload.minimum_quantity),
            supplier=payload.supplier,
            unit_price=_money(payload.unit_price) if payload.unit_price is not None else None,
            expiration_date=payload.expiration_date,
            notes=payload.notes,
            is_active=True,
        )
        self.repo.add(item)
        self.audit.record(
            actor_user_id=current_user.id,
            action="inventory_item.create",
            entity_type="inventory_item",
            entity_id=item.id,
            summary="Item de estoque criado",
        )
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(
        self, item_id: int, payload: InventoryItemUpdate, current_user: User
    ) -> InventoryItem:
        item = self.get_by_id(item_id)
        data = payload.model_dump(exclude_unset=True)

        # Defesa contra mass assignment: campos sensíveis nunca aceitos aqui.
        for forbidden in ("current_quantity", "is_active", "id", "created_at", "updated_at"):
            data.pop(forbidden, None)

        if "minimum_quantity" in data and data["minimum_quantity"] is not None:
            data["minimum_quantity"] = _qty(data["minimum_quantity"])
        if "unit_price" in data and data["unit_price"] is not None:
            data["unit_price"] = _money(data["unit_price"])

        for field, value in data.items():
            setattr(item, field, value)

        self.repo.save(item)
        self.audit.record(
            actor_user_id=current_user.id,
            action="inventory_item.update",
            entity_type="inventory_item",
            entity_id=item.id,
            summary="Item de estoque atualizado",
            metadata={"fields": sorted(data.keys())},
        )
        self.db.commit()
        self.db.refresh(item)
        return item

    def set_active(self, item_id: int, active: bool, current_user: User) -> InventoryItem:
        item = self.get_by_id(item_id)
        if item.is_active == active:
            return item
        item.is_active = active
        self.repo.save(item)
        self.audit.record(
            actor_user_id=current_user.id,
            action="inventory_item.activate" if active else "inventory_item.deactivate",
            entity_type="inventory_item",
            entity_id=item.id,
            summary="Item de estoque ativado" if active else "Item de estoque inativado",
        )
        self.db.commit()
        self.db.refresh(item)
        return item


# ============================================================================
# Movement service — locking + transação por operação
# ============================================================================


class InventoryMovementService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.item_repo = InventoryItemRepository(db)
        self.move_repo = InventoryMovementRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def list_for_item(
        self,
        *,
        item_id: int,
        params: PaginationParams,
    ) -> tuple[list[InventoryMovement], int]:
        # Verifica existência do item antes de paginar.
        if not self.item_repo.get(item_id):
            raise NotFoundError("Item de estoque não encontrado")
        items, total = self.move_repo.list_for_item(
            item_id=item_id, offset=params.offset, limit=params.limit
        )
        return list(items), total

    def list_paginated(
        self,
        *,
        params: PaginationParams,
        item_id: Optional[int] = None,
        movement_type: Optional[MovementType] = None,
        created_by_user_id: Optional[int] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
    ) -> tuple[list[InventoryMovement], int]:
        try:
            from_dt = ensure_optional_aware_utc(from_dt, "from")
            to_dt = ensure_optional_aware_utc(to_dt, "to")
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        if from_dt and to_dt and to_dt <= from_dt:
            raise ValidationError("Parâmetro 'to' deve ser maior que 'from'")
        items, total = self.move_repo.search(
            item_id=item_id,
            movement_type=movement_type,
            created_by_user_id=created_by_user_id,
            from_dt=from_dt,
            to_dt=to_dt,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    # ----- helpers -----
    def _ensure_item_can_receive_movement(
        self, item: InventoryItem, current_user: User
    ) -> None:
        """Item inativo só recebe movimento se autor for ADMIN."""
        if not item.is_active and current_user.role != Role.ADMIN:
            raise ValidationError(
                "Item inativo. Somente ADMIN pode movimentar item desativado."
            )

    def _persist_movement(
        self,
        *,
        item: InventoryItem,
        new_quantity: Decimal,
        movement_type: MovementType,
        quantity: Decimal,
        reason: Optional[str],
        current_user: User,
    ) -> InventoryMovement:
        """Atualiza o saldo do item e grava a movimentação na MESMA transação.

        Se qualquer parte falhar, faz `rollback` para que nem o saldo seja
        alterado nem a movimentação fique registrada.
        """
        try:
            item.current_quantity = new_quantity

            movement = InventoryMovement(
                inventory_item_id=item.id,
                movement_type=movement_type,
                quantity=quantity,
                resulting_quantity=new_quantity,
                reason=reason,
                created_by_user_id=current_user.id,
            )
            self.item_repo.save(item)
            self.move_repo.add(movement)
            self.audit.record(
                actor_user_id=current_user.id,
                action=f"inventory_movement.{movement_type.value}",
                entity_type="inventory_item",
                entity_id=item.id,
                summary="Movimentação de estoque registrada",
                metadata={
                    "movement_type": movement_type.value,
                    "quantity": str(quantity),
                    "resulting_quantity": str(new_quantity),
                },
            )
            self.db.commit()
        except SQLAlchemyError:
            self.db.rollback()
            raise

        self.db.refresh(item)
        self.db.refresh(movement)
        return movement

    # ----- mutations -----
    def register_in(
        self,
        *,
        item_id: int,
        payload: MovementCreate,
        current_user: User,
    ) -> InventoryMovement:
        qty = _qty(payload.quantity)
        if qty <= 0:
            raise ValidationError("Quantidade deve ser maior que zero")

        # Lock pessimista: serializa movimentações concorrentes no mesmo item.
        item = self.item_repo.get_for_update(item_id)
        if not item:
            raise NotFoundError("Item de estoque não encontrado")
        self._ensure_item_can_receive_movement(item, current_user)

        new_qty = _qty(item.current_quantity + qty)
        return self._persist_movement(
            item=item,
            new_quantity=new_qty,
            movement_type=MovementType.IN,
            quantity=qty,
            reason=payload.reason,
            current_user=current_user,
        )

    def register_out(
        self,
        *,
        item_id: int,
        payload: MovementCreate,
        current_user: User,
    ) -> InventoryMovement:
        qty = _qty(payload.quantity)
        if qty <= 0:
            raise ValidationError("Quantidade deve ser maior que zero")

        item = self.item_repo.get_for_update(item_id)
        if not item:
            raise NotFoundError("Item de estoque não encontrado")
        self._ensure_item_can_receive_movement(item, current_user)

        if qty > item.current_quantity:
            raise ValidationError(
                f"Saída ({qty}) maior que o saldo atual ({item.current_quantity})"
            )

        new_qty = _qty(item.current_quantity - qty)
        return self._persist_movement(
            item=item,
            new_quantity=new_qty,
            movement_type=MovementType.OUT,
            quantity=qty,
            reason=payload.reason,
            current_user=current_user,
        )

    def register_adjustment(
        self,
        *,
        item_id: int,
        payload: AdjustmentCreate,
        current_user: User,
    ) -> InventoryMovement:
        # Por política, ajuste é privilégio do ADMIN.
        if current_user.role != Role.ADMIN:
            raise ForbiddenError(
                "Ajuste manual de estoque é restrito ao ADMIN"
            )

        target = _qty(payload.quantity)
        if target < 0:
            raise ValidationError("Saldo alvo não pode ser negativo")

        item = self.item_repo.get_for_update(item_id)
        if not item:
            raise NotFoundError("Item de estoque não encontrado")

        # ADJUSTMENT define o saldo final desejado (não delta).
        return self._persist_movement(
            item=item,
            new_quantity=target,
            movement_type=MovementType.ADJUSTMENT,
            quantity=target,
            reason=payload.reason,
            current_user=current_user,
        )


# ============================================================================
# Alerts / Summary service
# ============================================================================


class InventoryAlertsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.item_repo = InventoryItemRepository(db)
        self.move_repo = InventoryMovementRepository(db)

    def list_low_stock(
        self, *, params: PaginationParams
    ) -> tuple[list[InventoryItem], int]:
        items, total = self.item_repo.search(
            low_stock=True,
            include_inactive=False,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    def list_expiring(
        self,
        *,
        params: PaginationParams,
        days: int,
    ) -> tuple[list[tuple[InventoryItem, int]], int]:
        if days < 0:
            raise ValidationError("Parâmetro 'days' deve ser >= 0")
        today = _today_clinic()
        until = today + timedelta(days=days)
        items, total = self.item_repo.list_expiring(
            today=today,
            until=until,
            offset=params.offset,
            limit=params.limit,
        )
        # Enriquece cada item com `days_until_expiration` (para o schema).
        enriched: list[tuple[InventoryItem, int]] = []
        for item in items:
            delta = (item.expiration_date - today).days if item.expiration_date else 0
            enriched.append((item, delta))
        return enriched, total

    def summary(self) -> InventorySummary:
        today = _today_clinic()
        until = today + timedelta(days=EXPIRATION_DEFAULT_DAYS)
        month_start, month_end = _current_month_window()

        return InventorySummary(
            total_active_items=self.item_repo.count_active(),
            total_inactive_items=self.item_repo.count_inactive(),
            low_stock_items_count=self.item_repo.count_low_stock(),
            expiring_items_count=self.item_repo.count_expiring(
                today=today, until=until
            ),
            total_movements_current_month=self.move_repo.count_between(
                start=month_start, end=month_end
            ),
        )
