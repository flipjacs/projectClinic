from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ============================================================================
# Sub-schema do dentista responsável (para exibir nome no histórico)
# ============================================================================


class DentistSummary(BaseModel):
    """Snapshot do dentista responsável, embutido no prontuário."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


# ============================================================================
# Medical Record
# ============================================================================


_MAIN_COMPLAINT_MAX = 2000
_FIELD_MAX = 4000
_OBS_MAX = 4000


def _strip_optional(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    return v or None


class MedicalRecordCreate(BaseModel):
    visit_date: date = Field(..., description="Data do atendimento (não pode ser futura).")
    main_complaint: str = Field(..., min_length=1, max_length=_MAIN_COMPLAINT_MAX)
    diagnosis: Optional[str] = Field(default=None, max_length=_FIELD_MAX)
    performed_procedure: Optional[str] = Field(default=None, max_length=_FIELD_MAX)
    clinical_evolution: Optional[str] = Field(default=None, max_length=_FIELD_MAX)
    observations: Optional[str] = Field(default=None, max_length=_OBS_MAX)
    appointment_id: Optional[int] = Field(
        default=None,
        ge=1,
        description="Opcional. Vínculo com uma consulta agendada (Fase 4).",
    )

    @field_validator("visit_date")
    @classmethod
    def _v_visit(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data do atendimento não pode ser futura")
        if v.year < 1900:
            raise ValueError("Data do atendimento inválida")
        return v

    @field_validator("main_complaint")
    @classmethod
    def _v_complaint(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Queixa principal não pode estar vazia")
        return v

    @field_validator("diagnosis", "performed_procedure", "clinical_evolution", "observations")
    @classmethod
    def _v_optional_text(cls, v):
        return _strip_optional(v)


class MedicalRecordUpdate(BaseModel):
    """Atualização parcial — apenas campos informados são alterados.

    `patient_id` e `dentist_id` nunca podem ser modificados.
    """

    visit_date: Optional[date] = None
    main_complaint: Optional[str] = Field(default=None, max_length=_MAIN_COMPLAINT_MAX)
    diagnosis: Optional[str] = Field(default=None, max_length=_FIELD_MAX)
    performed_procedure: Optional[str] = Field(default=None, max_length=_FIELD_MAX)
    clinical_evolution: Optional[str] = Field(default=None, max_length=_FIELD_MAX)
    observations: Optional[str] = Field(default=None, max_length=_OBS_MAX)
    appointment_id: Optional[int] = Field(default=None, ge=1)

    @field_validator("visit_date")
    @classmethod
    def _v_visit(cls, v):
        if v is None:
            return v
        if v > date.today():
            raise ValueError("A data do atendimento não pode ser futura")
        if v.year < 1900:
            raise ValueError("Data do atendimento inválida")
        return v

    @field_validator("main_complaint")
    @classmethod
    def _v_complaint(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v:
            raise ValueError("Queixa principal não pode estar vazia")
        return v

    @field_validator("diagnosis", "performed_procedure", "clinical_evolution", "observations")
    @classmethod
    def _v_optional_text(cls, v):
        return _strip_optional(v)

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class MedicalRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    dentist_id: int
    appointment_id: Optional[int] = None

    visit_date: date
    main_complaint: str
    diagnosis: Optional[str] = None
    performed_procedure: Optional[str] = None
    clinical_evolution: Optional[str] = None
    observations: Optional[str] = None

    is_active: bool
    created_at: datetime
    updated_at: datetime

    dentist: DentistSummary
