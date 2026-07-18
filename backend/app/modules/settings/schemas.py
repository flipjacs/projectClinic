from __future__ import annotations

import re
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

_TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
_UFS = {
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
}


# ---------------------------------------------------------------------------
# Sub-schemas
# ---------------------------------------------------------------------------
class ClinicAddress(BaseModel):
    zip_code: str = Field(default="", max_length=9)
    street: str = Field(default="", max_length=160)
    number: str = Field(default="", max_length=20)
    complement: str = Field(default="", max_length=80)
    district: str = Field(default="", max_length=80)
    city: str = Field(default="", max_length=80)
    state: str = Field(default="", max_length=2)
    country: str = Field(default="Brasil", max_length=60)

    @field_validator("state")
    @classmethod
    def _validate_state(cls, value: str) -> str:
        value = value.upper().strip()
        if value and value not in _UFS:
            raise ValueError("UF inválida")
        return value


class ClinicScheduleDayIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    enabled: bool = False
    opens_at: str = "08:00"
    closes_at: str = "18:00"
    break_starts_at: Optional[str] = None
    break_ends_at: Optional[str] = None

    @field_validator("opens_at", "closes_at")
    @classmethod
    def _validate_time(cls, value: str) -> str:
        if not _TIME_RE.match(value):
            raise ValueError("Horário deve estar no formato HH:MM")
        return value

    @field_validator("break_starts_at", "break_ends_at")
    @classmethod
    def _validate_optional_time(cls, value: Optional[str]) -> Optional[str]:
        if value in (None, ""):
            return None
        if not _TIME_RE.match(value):
            raise ValueError("Horário deve estar no formato HH:MM")
        return value


class ClinicNotes(BaseModel):
    observations: str = Field(default="", max_length=500)
    default_message: str = Field(default="", max_length=300)
    pdf_footer: str = Field(default="", max_length=200)
    institutional_description: str = Field(default="", max_length=1000)


# ---------------------------------------------------------------------------
# Write payload (PUT /settings/clinic) — logos têm endpoint próprio.
# ---------------------------------------------------------------------------
class ClinicSettingsUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    trade_name: str = Field(default="", max_length=120)
    technical_director: str = Field(default="", max_length=120)
    cro: str = Field(default="", max_length=20)
    phone: str = Field(default="", max_length=20)
    whatsapp: str = Field(default="", max_length=20)
    email: EmailStr | str = Field(default="")
    website: str = Field(default="", max_length=180)
    address: ClinicAddress = Field(default_factory=ClinicAddress)
    schedule: List[ClinicScheduleDayIn] = Field(default_factory=list)
    notes: ClinicNotes = Field(default_factory=ClinicNotes)

    @field_validator("schedule")
    @classmethod
    def _validate_schedule(cls, days: List[ClinicScheduleDayIn]) -> List[ClinicScheduleDayIn]:
        if not days:
            return days
        weekdays = {d.weekday for d in days}
        if len(weekdays) != len(days):
            raise ValueError("Dias da semana duplicados na grade de horários")
        return days


# ---------------------------------------------------------------------------
# Read payload (GET / PUT response) — espelha o DTO consumido pelo frontend.
# ---------------------------------------------------------------------------
class ClinicScheduleDayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    weekday: int
    enabled: bool
    opens_at: str
    closes_at: str
    break_starts_at: Optional[str] = None
    break_ends_at: Optional[str] = None


class ClinicSettingsRead(BaseModel):
    name: str
    trade_name: str
    technical_director: str
    cro: str
    phone: str
    whatsapp: str
    email: str
    website: str
    address: ClinicAddress
    schedule: List[ClinicScheduleDayOut]
    logo_url: Optional[str] = None
    logo_small_url: Optional[str] = None
    notes: ClinicNotes


class LogoUploadResponse(BaseModel):
    url: str
