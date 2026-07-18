from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.settings.notification_models import NotificationSettings


class NotificationSettingsRepository:
    """Acesso à linha única (singleton) de preferências de notificação."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self) -> Optional[NotificationSettings]:
        stmt = select(NotificationSettings).order_by(NotificationSettings.id.asc()).limit(1)
        return self.db.execute(stmt).scalars().first()

    def get_for_update(self) -> Optional[NotificationSettings]:
        stmt = (
            select(NotificationSettings)
            .order_by(NotificationSettings.id.asc())
            .limit(1)
            .with_for_update()
        )
        return self.db.execute(stmt).scalars().first()

    def add(self, entity: NotificationSettings) -> NotificationSettings:
        self.db.add(entity)
        self.db.flush()
        self.db.refresh(entity)
        return entity

    def save(self, entity: NotificationSettings) -> NotificationSettings:
        self.db.flush()
        self.db.refresh(entity)
        return entity
