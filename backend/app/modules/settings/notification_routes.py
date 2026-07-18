from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.settings.notification_schemas import (
    NotificationSettingsRead,
    NotificationSettingsUpdate,
)
from app.modules.settings.notification_service import NotificationSettingsService
from app.modules.users.models import User
from app.shared.exceptions import NotFoundError

router = APIRouter(prefix="/settings/notifications", tags=["settings"])


@router.get("", response_model=NotificationSettingsRead)
def get_notification_settings(
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
) -> NotificationSettingsRead:
    """Preferências de notificação. 404 enquanto nada foi salvo — o frontend
    abre com os padrões do schema."""
    service = NotificationSettingsService(db)
    entity = service.get()
    if entity is None:
        raise NotFoundError("Preferências de notificação ainda não definidas")
    return service.serialize(entity)


@router.put("", response_model=NotificationSettingsRead)
def update_notification_settings(
    payload: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> NotificationSettingsRead:
    service = NotificationSettingsService(db)
    entity = service.update(payload, current_user_id=current_user.id)
    return service.serialize(entity)
