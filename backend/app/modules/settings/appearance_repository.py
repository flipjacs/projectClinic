from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.settings.appearance_models import UserAppearanceSettings


class AppearanceSettingsRepository:
    """Preferências de aparência de um usuário (uma linha por usuário)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user(self, user_id: int) -> Optional[UserAppearanceSettings]:
        stmt = select(UserAppearanceSettings).where(
            UserAppearanceSettings.user_id == user_id
        )
        return self.db.execute(stmt).scalars().first()

    def get_by_user_for_update(self, user_id: int) -> Optional[UserAppearanceSettings]:
        stmt = (
            select(UserAppearanceSettings)
            .where(UserAppearanceSettings.user_id == user_id)
            .with_for_update()
        )
        return self.db.execute(stmt).scalars().first()

    def add(self, entity: UserAppearanceSettings) -> UserAppearanceSettings:
        self.db.add(entity)
        self.db.flush()
        self.db.refresh(entity)
        return entity

    def save(self, entity: UserAppearanceSettings) -> UserAppearanceSettings:
        self.db.flush()
        self.db.refresh(entity)
        return entity
