from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.settings.appearance_schemas import (
    AppearanceSettingsRead,
    AppearanceSettingsUpdate,
)
from app.modules.settings.appearance_service import AppearanceSettingsService
from app.modules.users.models import User

router = APIRouter(prefix="/settings/appearance", tags=["settings"])


@router.get("", response_model=AppearanceSettingsRead)
def get_appearance_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppearanceSettingsRead:
    """Preferências de aparência do usuário autenticado. Sempre 200 (padrões se
    ainda não personalizadas) — o tema é aplicado sem risco de falha."""
    return AppearanceSettingsService(db).read_for(current_user.id)


@router.put("", response_model=AppearanceSettingsRead)
def update_appearance_settings(
    payload: AppearanceSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AppearanceSettingsRead:
    """Cada usuário gerencia as PRÓPRIAS preferências (não exige ADMIN)."""
    return AppearanceSettingsService(db).update(current_user.id, payload)
