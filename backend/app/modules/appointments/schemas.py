from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.appointments.models import AppointmentStatus
from app.shared.timezone import ensure_aware_utc

# ============================================================================
# Limites de duração — protegem contra agendamentos absurdos
# ============================================================================

MIN_DURATION = timedelta(minutes=5)
MAX_DURATION = timedelta(hours=6)


def _ensure_tz_aware(v: datetime) -> datetime:
    # ensure_aware_utc já normaliza para UTC e trunca em segundos (regra global,
    # ver docs/architecture.md). Isso evita a ambiguidade de conflito de agenda
    # no limite exato (fim de uma consulta == início da próxima) no MySQL.
    return ensure_aware_utc(v, "datetime")


def _validate_window(start: datetime, end: datetime) -> None:
    if end <= start:
        raise ValueError("scheduled_end deve ser maior que scheduled_start")
    delta = end - start
    if delta < MIN_DURATION:
        raise ValueError(
            f"Duração mínima da consulta é de {int(MIN_DURATION.total_seconds() // 60)} minutos"
        )
    if delta > MAX_DURATION:
        raise ValueError(
            f"Duração máxima da consulta é de {int(MAX_DURATION.total_seconds() // 3600)} horas"
        )


# ============================================================================
# Snapshots (paciente / dentista) embutidos na resposta
# ============================================================================


class PatientSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class DentistSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


# ============================================================================
# Create / Update / Reschedule / Cancel / StatusChange
# ============================================================================


class AppointmentCreate(BaseModel):
    patient_id: int = Field(..., ge=1)
    dentist_id: int = Field(..., ge=1)
    scheduled_start: datetime
    scheduled_end: datetime
    reason: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("scheduled_start", "scheduled_end")
    @classmethod
    def _v_tz(cls, v):
        return _ensure_tz_aware(v)

    @field_validator("reason", "notes")
    @classmethod
    def _v_strip(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @model_validator(mode="after")
    def _v_window(self):
        _validate_window(self.scheduled_start, self.scheduled_end)
        return self


class AppointmentUpdate(BaseModel):
    """PATCH simples — só ajusta `reason` e `notes`.

    Datas usam `reschedule`, status usa `status` e cancelamento usa `cancel`.
    `patient_id` e `dentist_id` nunca mudam por este endpoint.
    """

    reason: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=4000)

    @field_validator("reason", "notes")
    @classmethod
    def _v_strip(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class AppointmentReschedule(BaseModel):
    scheduled_start: datetime
    scheduled_end: datetime
    reason: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Motivo opcional da remarcação (auditoria leve).",
    )

    @field_validator("scheduled_start", "scheduled_end")
    @classmethod
    def _v_tz(cls, v):
        return _ensure_tz_aware(v)

    @field_validator("reason")
    @classmethod
    def _v_strip(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @model_validator(mode="after")
    def _v_window(self):
        _validate_window(self.scheduled_start, self.scheduled_end)
        return self


class AppointmentCancel(BaseModel):
    cancellation_reason: Optional[str] = Field(default=None, max_length=500)

    @field_validator("cancellation_reason")
    @classmethod
    def _v_strip(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class AppointmentStatusChange(BaseModel):
    status: AppointmentStatus

    @field_validator("status", mode="before")
    @classmethod
    def _v_status(cls, v):
        if isinstance(v, AppointmentStatus):
            return v
        if isinstance(v, str):
            try:
                return AppointmentStatus(v.lower())
            except ValueError as exc:
                raise ValueError(
                    f"Status inválido. Valores aceitos: "
                    f"{', '.join(s.value for s in AppointmentStatus)}"
                ) from exc
        return v


# ============================================================================
# Read
# ============================================================================


class AppointmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    dentist_id: int

    scheduled_start: datetime
    scheduled_end: datetime
    status: AppointmentStatus

    reason: Optional[str] = None
    notes: Optional[str] = None

    rescheduled_count: int
    original_start: Optional[datetime] = None

    canceled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    patient: PatientSummary
    dentist: DentistSummary
