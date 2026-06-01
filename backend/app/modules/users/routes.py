from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate, UserRead, UserUpdate
from app.modules.users.service import UserService
from app.shared.pagination import Page, PaginationParams, pagination_params

router = APIRouter(prefix="/users", tags=["users"])


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> User:
    service = UserService(db)
    return service.create(payload, current_user=current_user)


@router.get(
    "",
    response_model=Page[UserRead],
    dependencies=[Depends(require_roles(Role.ADMIN))],
)
def list_users(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> Page[UserRead]:
    service = UserService(db)
    items, total = service.list_paginated(params)
    return Page[UserRead].build(
        items=[UserRead.model_validate(u) for u in items],
        total=total,
        params=params,
    )


@router.get(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_roles(Role.ADMIN))],
)
def get_user(user_id: int, db: Session = Depends(get_db)) -> User:
    service = UserService(db)
    return service.get_by_id(user_id)


@router.patch(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_roles(Role.ADMIN))],
)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> User:
    service = UserService(db)
    return service.update(user_id, payload, current_user=current_user)


@router.patch(
    "/{user_id}/activate",
    response_model=UserRead,
)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> User:
    service = UserService(db)
    return service.set_active(user_id, active=True, current_user_id=current_user.id)


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserRead,
)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> User:
    service = UserService(db)
    return service.set_active(user_id, active=False, current_user_id=current_user.id)
