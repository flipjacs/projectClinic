from __future__ import annotations

from datetime import date, datetime
from typing import Optional, Sequence

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.modules.inventory.models import (
    InventoryCategory,
    InventoryItem,
    InventoryMovement,
    MovementType,
)


# ============================================================================
# Inventory items
# ============================================================================


class InventoryItemRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, item_id: int) -> Optional[InventoryItem]:
        return self.db.get(InventoryItem, item_id)

    def get_for_update(self, item_id: int) -> Optional[InventoryItem]:
        """`SELECT ... FOR UPDATE` — usado pelo service ao registrar movimentação.

        Serializa transações concorrentes sobre o mesmo item, evitando race
        condition em `current_quantity`.
        """
        stmt = (
            select(InventoryItem)
            .where(InventoryItem.id == item_id)
            .with_for_update()
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def search(
        self,
        *,
        term: Optional[str] = None,
        category: Optional[InventoryCategory] = None,
        include_inactive: bool = False,
        only_inactive: bool = False,
        low_stock: bool = False,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[InventoryItem], int]:
        conditions = []

        if only_inactive:
            conditions.append(InventoryItem.is_active.is_(False))
        elif not include_inactive:
            conditions.append(InventoryItem.is_active.is_(True))

        if category is not None:
            conditions.append(InventoryItem.category == category)
        if term:
            t = term.strip()
            if t:
                conditions.append(InventoryItem.name.ilike(f"%{t}%"))
        if low_stock:
            conditions.append(
                InventoryItem.current_quantity <= InventoryItem.minimum_quantity
            )

        where_clause = and_(*conditions) if conditions else None

        base = select(InventoryItem)
        count_base = select(func.count(InventoryItem.id))
        if where_clause is not None:
            base = base.where(where_clause)
            count_base = count_base.where(where_clause)

        total = self.db.execute(count_base).scalar_one()
        stmt = (
            base.order_by(InventoryItem.name.asc(), InventoryItem.id.asc())
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def list_expiring(
        self,
        *,
        today: date,
        until: date,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[InventoryItem], int]:
        conditions = [
            InventoryItem.is_active.is_(True),
            InventoryItem.expiration_date.isnot(None),
            InventoryItem.expiration_date >= today,
            InventoryItem.expiration_date <= until,
        ]
        where_clause = and_(*conditions)

        total = (
            self.db.execute(
                select(func.count(InventoryItem.id)).where(where_clause)
            ).scalar_one()
        )
        stmt = (
            select(InventoryItem)
            .where(where_clause)
            .order_by(
                InventoryItem.expiration_date.asc(),
                InventoryItem.name.asc(),
            )
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def add(self, item: InventoryItem) -> InventoryItem:
        self.db.add(item)
        self.db.flush()
        self.db.refresh(item)
        return item

    def save(self, item: InventoryItem) -> InventoryItem:
        self.db.flush()
        self.db.refresh(item)
        return item

    # ----- agregações -----
    def count_active(self) -> int:
        stmt = select(func.count(InventoryItem.id)).where(
            InventoryItem.is_active.is_(True)
        )
        return int(self.db.execute(stmt).scalar_one())

    def count_inactive(self) -> int:
        stmt = select(func.count(InventoryItem.id)).where(
            InventoryItem.is_active.is_(False)
        )
        return int(self.db.execute(stmt).scalar_one())

    def count_low_stock(self) -> int:
        stmt = select(func.count(InventoryItem.id)).where(
            InventoryItem.is_active.is_(True),
            InventoryItem.current_quantity <= InventoryItem.minimum_quantity,
        )
        return int(self.db.execute(stmt).scalar_one())

    def count_expiring(self, *, today: date, until: date) -> int:
        stmt = select(func.count(InventoryItem.id)).where(
            InventoryItem.is_active.is_(True),
            InventoryItem.expiration_date.isnot(None),
            InventoryItem.expiration_date >= today,
            InventoryItem.expiration_date <= until,
        )
        return int(self.db.execute(stmt).scalar_one())


# ============================================================================
# Inventory movements
# ============================================================================


class InventoryMovementRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, movement_id: int) -> Optional[InventoryMovement]:
        return self.db.get(InventoryMovement, movement_id)

    def list_for_item(
        self,
        *,
        item_id: int,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[InventoryMovement], int]:
        base = select(InventoryMovement).where(
            InventoryMovement.inventory_item_id == item_id
        )
        count_base = select(func.count(InventoryMovement.id)).where(
            InventoryMovement.inventory_item_id == item_id
        )

        total = self.db.execute(count_base).scalar_one()
        stmt = (
            base.order_by(
                InventoryMovement.created_at.desc(),
                InventoryMovement.id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def search(
        self,
        *,
        item_id: Optional[int] = None,
        movement_type: Optional[MovementType] = None,
        created_by_user_id: Optional[int] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[Sequence[InventoryMovement], int]:
        conditions = []
        if item_id is not None:
            conditions.append(InventoryMovement.inventory_item_id == item_id)
        if movement_type is not None:
            conditions.append(InventoryMovement.movement_type == movement_type)
        if created_by_user_id is not None:
            conditions.append(
                InventoryMovement.created_by_user_id == created_by_user_id
            )
        if from_dt is not None:
            conditions.append(InventoryMovement.created_at >= from_dt)
        if to_dt is not None:
            conditions.append(InventoryMovement.created_at < to_dt)

        where_clause = and_(*conditions) if conditions else None

        base = select(InventoryMovement)
        count_base = select(func.count(InventoryMovement.id))
        if where_clause is not None:
            base = base.where(where_clause)
            count_base = count_base.where(where_clause)

        total = self.db.execute(count_base).scalar_one()
        stmt = (
            base.order_by(
                InventoryMovement.created_at.desc(),
                InventoryMovement.id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def add(self, movement: InventoryMovement) -> InventoryMovement:
        self.db.add(movement)
        self.db.flush()
        self.db.refresh(movement)
        return movement

    def count_between(self, *, start: datetime, end: datetime) -> int:
        stmt = select(func.count(InventoryMovement.id)).where(
            InventoryMovement.created_at >= start,
            InventoryMovement.created_at < end,
        )
        return int(self.db.execute(stmt).scalar_one())
