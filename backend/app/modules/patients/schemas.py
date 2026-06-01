from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.shared.validators import (
    normalize_cpf,
    normalize_phone,
    normalize_state,
    normalize_zip,
)

# ============================================================================
# Patient
# ============================================================================


class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    cpf: str = Field(..., description="Aceita formato com ou sem máscara")
    birth_date: date
    phone: str = Field(..., description="DDD + número, com ou sem máscara")
    email: Optional[EmailStr] = None

    street: str = Field(..., min_length=1, max_length=150)
    number: str = Field(..., min_length=1, max_length=20)
    neighborhood: str = Field(..., min_length=1, max_length=120)
    city: str = Field(..., min_length=1, max_length=120)
    state: str = Field(..., min_length=2, max_length=2, description="UF (2 letras)")
    zip_code: str = Field(..., description="CEP com ou sem máscara")

    @field_validator("cpf", mode="before")
    @classmethod
    def _v_cpf(cls, v):
        return normalize_cpf(v) if v is not None else v

    @field_validator("phone", mode="before")
    @classmethod
    def _v_phone(cls, v):
        return normalize_phone(v) if v is not None else v

    @field_validator("zip_code", mode="before")
    @classmethod
    def _v_zip(cls, v):
        return normalize_zip(v) if v is not None else v

    @field_validator("state")
    @classmethod
    def _v_state(cls, v):
        return normalize_state(v)

    @field_validator("birth_date")
    @classmethod
    def _v_birth(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Data de nascimento não pode ser futura")
        if v.year < 1900:
            raise ValueError("Data de nascimento inválida")
        return v

    @field_validator("name")
    @classmethod
    def _v_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Nome muito curto")
        return v


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    """Atualização parcial. Apenas campos enviados são alterados."""

    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    cpf: Optional[str] = None
    birth_date: Optional[date] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    street: Optional[str] = Field(default=None, min_length=1, max_length=150)
    number: Optional[str] = Field(default=None, min_length=1, max_length=20)
    neighborhood: Optional[str] = Field(default=None, min_length=1, max_length=120)
    city: Optional[str] = Field(default=None, min_length=1, max_length=120)
    state: Optional[str] = Field(default=None, min_length=2, max_length=2)
    zip_code: Optional[str] = None

    @field_validator("cpf", mode="before")
    @classmethod
    def _v_cpf(cls, v):
        return normalize_cpf(v) if v else v

    @field_validator("phone", mode="before")
    @classmethod
    def _v_phone(cls, v):
        return normalize_phone(v) if v else v

    @field_validator("zip_code", mode="before")
    @classmethod
    def _v_zip(cls, v):
        return normalize_zip(v) if v else v

    @field_validator("state")
    @classmethod
    def _v_state(cls, v):
        return normalize_state(v) if v else v

    @field_validator("birth_date")
    @classmethod
    def _v_birth(cls, v):
        if v is None:
            return v
        if v > date.today():
            raise ValueError("Data de nascimento não pode ser futura")
        if v.year < 1900:
            raise ValueError("Data de nascimento inválida")
        return v

    @field_validator("name")
    @classmethod
    def _v_name(cls, v):
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Nome muito curto")
        return v

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class PatientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cpf: str
    birth_date: date
    phone: str
    email: Optional[EmailStr] = None
    street: str
    number: str
    neighborhood: str
    city: str
    state: str
    zip_code: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PatientListItem(BaseModel):
    """Resposta enxuta para listagens, sem CPF completo ou endereço."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    is_active: bool
    created_at: datetime


# ============================================================================
# Health Info
# ============================================================================


class _HealthInfoCore(BaseModel):
    """Validações coerência entre flag e descrição."""


class PatientHealthInfoCreate(_HealthInfoCore):
    has_disease: bool = False
    disease_description: Optional[str] = Field(default=None, max_length=2000)
    has_allergy: bool = False
    allergy_description: Optional[str] = Field(default=None, max_length=2000)
    uses_medication: bool = False
    medication_description: Optional[str] = Field(default=None, max_length=2000)
    health_observations: Optional[str] = Field(default=None, max_length=4000)


class PatientHealthInfoUpdate(_HealthInfoCore):
    has_disease: Optional[bool] = None
    disease_description: Optional[str] = Field(default=None, max_length=2000)
    has_allergy: Optional[bool] = None
    allergy_description: Optional[str] = Field(default=None, max_length=2000)
    uses_medication: Optional[bool] = None
    medication_description: Optional[str] = Field(default=None, max_length=2000)
    health_observations: Optional[str] = Field(default=None, max_length=4000)

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class PatientHealthInfoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    has_disease: bool
    disease_description: Optional[str] = None
    has_allergy: bool
    allergy_description: Optional[str] = None
    uses_medication: bool
    medication_description: Optional[str] = None
    health_observations: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ============================================================================
# Summary
# ============================================================================


class PatientSummary(BaseModel):
    """Visão consolidada do paciente — dados pessoais + saúde."""

    patient: PatientRead
    health_info: Optional[PatientHealthInfoRead] = None
