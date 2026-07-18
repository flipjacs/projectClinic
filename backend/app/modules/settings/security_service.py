from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.modules.audit.service import AuditLogService
from app.modules.settings.security_models import SecuritySettings
from app.modules.settings.security_repository import SecuritySettingsRepository
from app.modules.settings.security_schemas import (
    LockoutPolicyOut,
    PasswordPolicyOut,
    SecurityAuditRead,
    SecuritySettingsRead,
    SecuritySettingsUpdate,
    SessionPolicyOut,
)

# Campos escalares registrados no diff de auditoria (before/after).
_AUDITED_FIELDS = (
    "password_min_length", "password_require_uppercase", "password_require_lowercase",
    "password_require_numbers", "password_require_special_chars", "password_allow_reuse",
    "password_expiration_days", "session_max_minutes", "session_auto_logout",
    "session_remember_device", "max_concurrent_sessions", "lockout_max_attempts",
    "lockout_minutes", "lockout_auto_unlock", "two_factor_enabled",
)


class SecuritySettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = SecuritySettingsRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get(self) -> Optional[SecuritySettings]:
        return self.repo.get()

    def get_or_create(self) -> SecuritySettings:
        entity = self.repo.get_for_update()
        if entity is None:
            entity = SecuritySettings()
            self.repo.add(entity)
            self.db.commit()
            self.db.refresh(entity)
        return entity

    @staticmethod
    def serialize(entity: SecuritySettings) -> SecuritySettingsRead:
        return SecuritySettingsRead(
            password_policy=PasswordPolicyOut(
                min_length=entity.password_min_length,
                require_uppercase=entity.password_require_uppercase,
                require_lowercase=entity.password_require_lowercase,
                require_numbers=entity.password_require_numbers,
                require_special_chars=entity.password_require_special_chars,
                allow_password_reuse=entity.password_allow_reuse,
                expiration_days=entity.password_expiration_days,
            ),
            session=SessionPolicyOut(
                max_minutes=entity.session_max_minutes,
                auto_logout=entity.session_auto_logout,
                remember_device=entity.session_remember_device,
                max_concurrent_sessions=entity.max_concurrent_sessions,
            ),
            lockout=LockoutPolicyOut(
                max_attempts=entity.lockout_max_attempts,
                lockout_minutes=entity.lockout_minutes,
                auto_unlock=entity.lockout_auto_unlock,
            ),
            two_factor_enabled=entity.two_factor_enabled,
        )

    def audit_summary(self, actor_user_id: int) -> SecurityAuditRead:
        def iso(value) -> Optional[str]:
            return value.isoformat() if value else None

        return SecurityAuditRead(
            last_password_change=iso(self.repo.last_action_at(actor_user_id, "user.update")),
            last_login=iso(self.repo.last_action_at(actor_user_id, "auth.login")),
            last_settings_change=iso(self.repo.last_settings_change_at(actor_user_id)),
            recent_events_count=self.repo.recent_events_count(actor_user_id),
        )

    # ----- mutations -----
    def update(
        self, payload: SecuritySettingsUpdate, current_user_id: int
    ) -> SecuritySettings:
        entity = self.repo.get_for_update()
        before = self._snapshot(entity) if entity else None
        created = entity is None
        if entity is None:
            entity = SecuritySettings()
            self.repo.add(entity)

        if payload.password_policy is not None:
            p = payload.password_policy
            entity.password_min_length = p.min_length
            entity.password_require_uppercase = p.require_uppercase
            entity.password_require_lowercase = p.require_lowercase
            entity.password_require_numbers = p.require_numbers
            entity.password_require_special_chars = p.require_special_chars
            entity.password_allow_reuse = p.allow_password_reuse
            entity.password_expiration_days = p.expiration_days
        if payload.session is not None:
            s = payload.session
            entity.session_max_minutes = s.max_minutes
            entity.session_auto_logout = s.auto_logout
            entity.session_remember_device = s.remember_device
            entity.max_concurrent_sessions = s.max_concurrent_sessions
        if payload.lockout is not None:
            lk = payload.lockout
            entity.lockout_max_attempts = lk.max_attempts
            entity.lockout_minutes = lk.lockout_minutes
            entity.lockout_auto_unlock = lk.auto_unlock

        self.repo.save(entity)
        after = self._snapshot(entity)
        self.audit.record(
            actor_user_id=current_user_id,
            action="security_settings.create" if created else "security_settings.update",
            entity_type="security_settings",
            entity_id=entity.id,
            summary="Políticas de segurança salvas",
            before=before,
            after=after,
        )
        self.db.commit()
        self.db.refresh(entity)
        return entity

    @staticmethod
    def _snapshot(entity: SecuritySettings) -> dict[str, Any]:
        return {field: getattr(entity, field) for field in _AUDITED_FIELDS}
