from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.modules.audit.service import AuditLogService
from app.modules.settings.appearance_models import UserAppearanceSettings
from app.modules.settings.appearance_repository import AppearanceSettingsRepository
from app.modules.settings.appearance_schemas import (
    AppearancePreferencesIO,
    AppearanceSettingsRead,
    AppearanceSettingsUpdate,
)

_AUDITED_FIELDS = (
    "theme", "density", "language", "reduced_motion", "high_contrast",
    "confirm_critical_actions", "auto_save_filters", "reopen_last_page",
)


class AppearanceSettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AppearanceSettingsRepository(db)
        self.audit = AuditLogService(db)

    def read_for(self, user_id: int) -> AppearanceSettingsRead:
        """Preferências do usuário; se ainda não personalizou, retorna os
        padrões (200, nunca 404) — a aplicação aplica o tema sem falha."""
        entity = self.repo.get_by_user(user_id)
        if entity is None:
            return AppearanceSettingsRead(
                theme="light",
                density="comfortable",
                language="pt-BR",
                preferences=AppearancePreferencesIO(
                    reduced_motion=False,
                    high_contrast=False,
                    confirm_critical_actions=True,
                    auto_save_filters=True,
                    reopen_last_page=False,
                ),
            )
        return self._serialize(entity)

    def update(self, user_id: int, payload: AppearanceSettingsUpdate) -> AppearanceSettingsRead:
        entity = self.repo.get_by_user_for_update(user_id)
        before = self._snapshot(entity) if entity else None
        created = entity is None
        if entity is None:
            entity = UserAppearanceSettings(user_id=user_id)
            self.repo.add(entity)

        entity.theme = payload.theme
        entity.density = payload.density
        entity.language = payload.language
        p = payload.preferences
        entity.reduced_motion = p.reduced_motion
        entity.high_contrast = p.high_contrast
        entity.confirm_critical_actions = p.confirm_critical_actions
        entity.auto_save_filters = p.auto_save_filters
        entity.reopen_last_page = p.reopen_last_page
        self.repo.save(entity)

        self.audit.record(
            actor_user_id=user_id,
            action="appearance_settings.create" if created else "appearance_settings.update",
            entity_type="appearance_settings",
            entity_id=entity.id,
            summary="Preferências de aparência salvas",
            before=before,
            after=self._snapshot(entity),
        )
        self.db.commit()
        self.db.refresh(entity)
        return self._serialize(entity)

    @staticmethod
    def _serialize(entity: UserAppearanceSettings) -> AppearanceSettingsRead:
        return AppearanceSettingsRead(
            theme=entity.theme,  # type: ignore[arg-type]
            density=entity.density,  # type: ignore[arg-type]
            language=entity.language,  # type: ignore[arg-type]
            preferences=AppearancePreferencesIO(
                reduced_motion=entity.reduced_motion,
                high_contrast=entity.high_contrast,
                confirm_critical_actions=entity.confirm_critical_actions,
                auto_save_filters=entity.auto_save_filters,
                reopen_last_page=entity.reopen_last_page,
            ),
        )

    @staticmethod
    def _snapshot(entity: UserAppearanceSettings) -> dict[str, Any]:
        return {field: getattr(entity, field) for field in _AUDITED_FIELDS}
