from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.inventory.models import (
    InventoryCategory,
    InventoryItem,
    InventoryMovement,
    MovementType,
)
from app.modules.inventory.schemas import (
    AdjustmentCreate,
    ExpiringItemRead,
    InventoryItemCreate,
    InventoryItemRead,
    InventoryItemUpdate,
    InventorySummary,
    MovementCreate,
    MovementRead,
)
from app.modules.inventory.service import (
    InventoryAlertsService,
    InventoryItemService,
    InventoryMovementService,
)
from app.modules.users.models import User
from app.shared.pagination import Page, PaginationParams, pagination_params

router = APIRouter(prefix="/inventory", tags=["inventory"])

# Dependências por papel.
ANY_STAFF = require_roles(Role.ADMIN, Role.DENTIST, Role.RECEPTIONIST)
ITEM_WRITERS = require_roles(Role.ADMIN, Role.RECEPTIONIST)
MOVEMENT_WRITERS = require_roles(Role.ADMIN, Role.RECEPTIONIST)
ADMIN_ONLY = require_roles(Role.ADMIN)


# ============================================================================
# Items
# ============================================================================


@router.post(
    "/items",
    response_model=InventoryItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_item(
    payload: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ITEM_WRITERS),
) -> InventoryItem:
    return InventoryItemService(db).create(payload, current_user=current_user)


@router.get(
    "/items",
    response_model=Page[InventoryItemRead],
    dependencies=[Depends(ANY_STAFF)],
)
def list_items(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    search: Optional[str] = Query(default=None, max_length=120),
    category: Optional[InventoryCategory] = Query(default=None),
    include_inactive: bool = Query(
        default=False,
        description="Inclui itens inativos. Por padrão, apenas ativos.",
    ),
    only_inactive: bool = Query(
        default=False,
        description="Retorna SOMENTE itens inativos.",
    ),
    low_stock: bool = Query(
        default=False,
        description="Restringe a itens cujo current_quantity <= minimum_quantity.",
    ),
) -> Page[InventoryItemRead]:
    items, total = InventoryItemService(db).list_paginated(
        params=params,
        term=search,
        category=category,
        include_inactive=include_inactive,
        only_inactive=only_inactive,
        low_stock=low_stock,
    )
    return Page[InventoryItemRead].build(
        items=[InventoryItemRead.model_validate(i) for i in items],
        total=total,
        params=params,
    )


@router.get(
    "/items/{item_id}",
    response_model=InventoryItemRead,
    dependencies=[Depends(ANY_STAFF)],
)
def get_item(item_id: int, db: Session = Depends(get_db)) -> InventoryItem:
    return InventoryItemService(db).get_by_id(item_id)


@router.patch(
    "/items/{item_id}",
    response_model=InventoryItemRead,
)
def update_item(
    item_id: int,
    payload: InventoryItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ITEM_WRITERS),
) -> InventoryItem:
    return InventoryItemService(db).update(item_id, payload, current_user=current_user)


@router.patch(
    "/items/{item_id}/activate",
    response_model=InventoryItemRead,
)
def activate_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
) -> InventoryItem:
    return InventoryItemService(db).set_active(
        item_id, active=True, current_user=current_user
    )


@router.patch(
    "/items/{item_id}/deactivate",
    response_model=InventoryItemRead,
)
def deactivate_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
) -> InventoryItem:
    return InventoryItemService(db).set_active(
        item_id, active=False, current_user=current_user
    )


# ============================================================================
# Movements
# ============================================================================


@router.post(
    "/items/{item_id}/movements/in",
    response_model=MovementRead,
    status_code=status.HTTP_201_CREATED,
)
def register_in(
    item_id: int,
    payload: MovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(MOVEMENT_WRITERS),
) -> InventoryMovement:
    return InventoryMovementService(db).register_in(
        item_id=item_id, payload=payload, current_user=current_user
    )


@router.post(
    "/items/{item_id}/movements/out",
    response_model=MovementRead,
    status_code=status.HTTP_201_CREATED,
)
def register_out(
    item_id: int,
    payload: MovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(MOVEMENT_WRITERS),
) -> InventoryMovement:
    return InventoryMovementService(db).register_out(
        item_id=item_id, payload=payload, current_user=current_user
    )


@router.post(
    "/items/{item_id}/movements/adjustment",
    response_model=MovementRead,
    status_code=status.HTTP_201_CREATED,
)
def register_adjustment(
    item_id: int,
    payload: AdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
) -> InventoryMovement:
    return InventoryMovementService(db).register_adjustment(
        item_id=item_id, payload=payload, current_user=current_user
    )


@router.get(
    "/items/{item_id}/movements",
    response_model=Page[MovementRead],
    dependencies=[Depends(ANY_STAFF)],
)
def list_item_movements(
    item_id: int,
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> Page[MovementRead]:
    items, total = InventoryMovementService(db).list_for_item(
        item_id=item_id, params=params
    )
    return Page[MovementRead].build(
        items=[MovementRead.model_validate(m) for m in items],
        total=total,
        params=params,
    )


@router.get(
    "/movements",
    response_model=Page[MovementRead],
    dependencies=[Depends(ANY_STAFF)],
)
def list_movements(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    item_id: Optional[int] = Query(default=None, ge=1),
    movement_type: Optional[MovementType] = Query(
        default=None, alias="type", description="Filtra por tipo de movimentação."
    ),
    user_id: Optional[int] = Query(
        default=None,
        ge=1,
        description="Filtra pelo usuário autor da movimentação.",
    ),
    from_dt: Optional[datetime] = Query(
        default=None,
        alias="from",
        description="Início (ISO 8601 com timezone).",
    ),
    to_dt: Optional[datetime] = Query(
        default=None,
        alias="to",
        description="Fim exclusivo (ISO 8601 com timezone).",
    ),
) -> Page[MovementRead]:
    items, total = InventoryMovementService(db).list_paginated(
        params=params,
        item_id=item_id,
        movement_type=movement_type,
        created_by_user_id=user_id,
        from_dt=from_dt,
        to_dt=to_dt,
    )
    return Page[MovementRead].build(
        items=[MovementRead.model_validate(m) for m in items],
        total=total,
        params=params,
    )


# ============================================================================
# Alerts / Summary
# ============================================================================


@router.get(
    "/alerts/low-stock",
    response_model=Page[InventoryItemRead],
    dependencies=[Depends(ANY_STAFF)],
)
def list_low_stock(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> Page[InventoryItemRead]:
    items, total = InventoryAlertsService(db).list_low_stock(params=params)
    return Page[InventoryItemRead].build(
        items=[InventoryItemRead.model_validate(i) for i in items],
        total=total,
        params=params,
    )


@router.get(
    "/alerts/expiring",
    response_model=Page[ExpiringItemRead],
    dependencies=[Depends(ANY_STAFF)],
)
def list_expiring(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    days: int = Query(
        default=30,
        ge=0,
        le=365,
        description="Janela em dias para considerar 'a vencer' (padrão 30).",
    ),
) -> Page[ExpiringItemRead]:
    enriched, total = InventoryAlertsService(db).list_expiring(
        params=params, days=days
    )
    items_out: list[ExpiringItemRead] = []
    for item, days_left in enriched:
        base = InventoryItemRead.model_validate(item).model_dump()
        base["days_until_expiration"] = days_left
        items_out.append(ExpiringItemRead.model_validate(base))
    return Page[ExpiringItemRead].build(
        items=items_out,
        total=total,
        params=params,
    )


@router.get(
    "/summary",
    response_model=InventorySummary,
    dependencies=[Depends(ANY_STAFF)],
)
def inventory_summary(db: Session = Depends(get_db)) -> InventorySummary:
    return InventoryAlertsService(db).summary()
