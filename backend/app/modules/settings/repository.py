from __future__ import annotations

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.settings.models import ClinicSettings


class ClinicSettingsRepository:
    """Acesso à linha única (singleton) de configurações da clínica."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self) -> Optional[ClinicSettings]:
        stmt = select(ClinicSettings).order_by(ClinicSettings.id.asc()).limit(1)
        return self.db.execute(stmt).scalars().first()

    def get_for_update(self) -> Optional[ClinicSettings]:
        stmt = (
            select(ClinicSettings)
            .order_by(ClinicSettings.id.asc())
            .limit(1)
            .with_for_update()
        )
        return self.db.execute(stmt).scalars().first()

    def add(self, clinic: ClinicSettings) -> ClinicSettings:
        self.db.add(clinic)
        self.db.flush()
        self.db.refresh(clinic)
        return clinic

    def save(self, clinic: ClinicSettings) -> ClinicSettings:
        self.db.flush()
        self.db.refresh(clinic)
        return clinic
