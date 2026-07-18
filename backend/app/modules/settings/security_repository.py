from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.audit.models import AuditLog
from app.modules.settings.security_models import SecuritySettings


class SecuritySettingsRepository:
    """Acesso à linha única (singleton) de políticas de segurança."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self) -> Optional[SecuritySettings]:
        stmt = select(SecuritySettings).order_by(SecuritySettings.id.asc()).limit(1)
        return self.db.execute(stmt).scalars().first()

    def get_for_update(self) -> Optional[SecuritySettings]:
        stmt = (
            select(SecuritySettings)
            .order_by(SecuritySettings.id.asc())
            .limit(1)
            .with_for_update()
        )
        return self.db.execute(stmt).scalars().first()

    def add(self, entity: SecuritySettings) -> SecuritySettings:
        self.db.add(entity)
        self.db.flush()
        self.db.refresh(entity)
        return entity

    def save(self, entity: SecuritySettings) -> SecuritySettings:
        self.db.flush()
        self.db.refresh(entity)
        return entity

    # ----- Auditoria derivada (somente leitura, a partir de audit_logs) -----
    def last_action_at(self, actor_user_id: int, action_prefix: str) -> Optional[datetime]:
        stmt = (
            select(func.max(AuditLog.created_at))
            .where(AuditLog.actor_user_id == actor_user_id)
            .where(AuditLog.action.like(f"{action_prefix}%"))
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def last_settings_change_at(self, actor_user_id: int) -> Optional[datetime]:
        stmt = (
            select(func.max(AuditLog.created_at))
            .where(AuditLog.actor_user_id == actor_user_id)
            .where(AuditLog.entity_type.like("%settings%"))
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def recent_events_count(self, actor_user_id: int, days: int = 30) -> int:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        stmt = (
            select(func.count(AuditLog.id))
            .where(AuditLog.actor_user_id == actor_user_id)
            .where(AuditLog.created_at >= since)
        )
        return int(self.db.execute(stmt).scalar_one())
