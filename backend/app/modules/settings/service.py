from __future__ import annotations

from typing import Any, Literal, Optional

from sqlalchemy.orm import Session

from app.modules.audit.service import AuditLogService
from app.modules.settings import uploads
from app.modules.settings.models import ClinicScheduleDay, ClinicSettings
from app.modules.settings.repository import ClinicSettingsRepository
from app.modules.settings.schemas import (
    ClinicAddress,
    ClinicNotes,
    ClinicScheduleDayOut,
    ClinicSettingsRead,
    ClinicSettingsUpdate,
)

LogoKind = Literal["logo", "logo_small"]

# Campos escalares registrados no diff de auditoria (before/after).
_AUDITED_FIELDS = (
    "name", "trade_name", "technical_director", "cro", "phone", "whatsapp",
    "email", "website", "zip_code", "street", "number", "complement",
    "district", "city", "state", "country", "observations", "default_message",
    "pdf_footer", "institutional_description",
)


class ClinicSettingsService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ClinicSettingsRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get(self) -> Optional[ClinicSettings]:
        return self.repo.get()

    def serialize(self, clinic: ClinicSettings, base_url: str) -> ClinicSettingsRead:
        """Monta o DTO de leitura, resolvendo URLs absolutas dos logos."""
        base = base_url.rstrip("/")

        def to_url(path: Optional[str]) -> Optional[str]:
            if not path:
                return None
            return f"{base}/media/{path}"

        return ClinicSettingsRead(
            name=clinic.name,
            trade_name=clinic.trade_name,
            technical_director=clinic.technical_director,
            cro=clinic.cro,
            phone=clinic.phone,
            whatsapp=clinic.whatsapp,
            email=clinic.email,
            website=clinic.website,
            address=ClinicAddress(
                zip_code=clinic.zip_code,
                street=clinic.street,
                number=clinic.number,
                complement=clinic.complement,
                district=clinic.district,
                city=clinic.city,
                state=clinic.state,
                country=clinic.country,
            ),
            schedule=[
                ClinicScheduleDayOut.model_validate(day) for day in clinic.schedule_days
            ],
            logo_url=to_url(clinic.logo_path),
            logo_small_url=to_url(clinic.logo_small_path),
            notes=ClinicNotes(
                observations=clinic.observations,
                default_message=clinic.default_message,
                pdf_footer=clinic.pdf_footer,
                institutional_description=clinic.institutional_description,
            ),
        )

    # ----- mutations -----
    def update(self, payload: ClinicSettingsUpdate, current_user_id: int) -> ClinicSettings:
        clinic = self.repo.get_for_update()
        before = self._snapshot(clinic) if clinic else None
        created = clinic is None
        if clinic is None:
            clinic = ClinicSettings(name=payload.name.strip())
            self.repo.add(clinic)

        self._apply_scalars(clinic, payload)
        self._replace_schedule(clinic, payload)
        self.repo.save(clinic)  # inclui o flush ordenado (delete → insert)

        after = self._snapshot(clinic)
        self.audit.record(
            actor_user_id=current_user_id,
            action="clinic_settings.create" if created else "clinic_settings.update",
            entity_type="clinic_settings",
            entity_id=clinic.id,
            summary="Configurações da clínica salvas",
            before=before,
            after=after,
        )
        self.db.commit()
        self.db.refresh(clinic)
        return clinic

    def set_logo(
        self, kind: LogoKind, content: bytes, content_type: str, current_user_id: int
    ) -> str:
        clinic = self.repo.get_for_update()
        if clinic is None:
            # Sem dados da clínica ainda: cria a linha mínima para anexar o logo.
            clinic = ClinicSettings(name="Clínica")
            self.repo.add(clinic)

        new_path = uploads.save_logo(content, content_type)
        field = "logo_path" if kind == "logo" else "logo_small_path"
        old_path = getattr(clinic, field)
        setattr(clinic, field, new_path)
        self.repo.save(clinic)

        # Remove o arquivo antigo só depois de persistir o novo caminho.
        uploads.delete_logo(old_path)
        self.audit.record(
            actor_user_id=current_user_id,
            action="clinic_settings.logo_update",
            entity_type="clinic_settings",
            entity_id=clinic.id,
            summary=f"Logo '{kind}' atualizado",
            metadata={"kind": kind},
        )
        self.db.commit()
        return new_path

    def remove_logo(self, kind: LogoKind, current_user_id: int) -> None:
        clinic = self.repo.get_for_update()
        if clinic is None:
            return
        field = "logo_path" if kind == "logo" else "logo_small_path"
        old_path = getattr(clinic, field)
        if not old_path:
            return
        setattr(clinic, field, None)
        self.repo.save(clinic)
        uploads.delete_logo(old_path)
        self.audit.record(
            actor_user_id=current_user_id,
            action="clinic_settings.logo_remove",
            entity_type="clinic_settings",
            entity_id=clinic.id,
            summary=f"Logo '{kind}' removido",
            metadata={"kind": kind},
        )
        self.db.commit()

    # ----- helpers -----
    @staticmethod
    def _apply_scalars(clinic: ClinicSettings, payload: ClinicSettingsUpdate) -> None:
        clinic.name = payload.name.strip()
        clinic.trade_name = payload.trade_name.strip()
        clinic.technical_director = payload.technical_director.strip()
        clinic.cro = payload.cro.strip()
        clinic.phone = payload.phone.strip()
        clinic.whatsapp = payload.whatsapp.strip()
        clinic.email = str(payload.email).strip()
        clinic.website = payload.website.strip()
        addr = payload.address
        clinic.zip_code = addr.zip_code.strip()
        clinic.street = addr.street.strip()
        clinic.number = addr.number.strip()
        clinic.complement = addr.complement.strip()
        clinic.district = addr.district.strip()
        clinic.city = addr.city.strip()
        clinic.state = addr.state.strip().upper()
        clinic.country = addr.country.strip()
        notes = payload.notes
        clinic.observations = notes.observations
        clinic.default_message = notes.default_message
        clinic.pdf_footer = notes.pdf_footer
        clinic.institutional_description = notes.institutional_description

    def _replace_schedule(
        self, clinic: ClinicSettings, payload: ClinicSettingsUpdate
    ) -> None:
        if not payload.schedule:
            return
        # Remove os dias antigos e força o flush ANTES de inserir os novos —
        # senão o INSERT dos novos pode preceder o DELETE dos antigos no mesmo
        # flush e violar o unique (clinic_id, weekday).
        clinic.schedule_days.clear()
        self.db.flush()
        for day in payload.schedule:
            clinic.schedule_days.append(
                ClinicScheduleDay(
                    weekday=day.weekday,
                    enabled=day.enabled,
                    opens_at=day.opens_at,
                    closes_at=day.closes_at,
                    break_starts_at=day.break_starts_at,
                    break_ends_at=day.break_ends_at,
                )
            )

    @staticmethod
    def _snapshot(clinic: ClinicSettings) -> dict[str, Any]:
        return {field: getattr(clinic, field) for field in _AUDITED_FIELDS}
