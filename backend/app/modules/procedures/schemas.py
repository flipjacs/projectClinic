from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ProcedureCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=4000)
    base_price: Decimal = Field(
        default=Decimal("0.00"), ge=0, max_digits=10, decimal_places=2
    )
    estimated_duration_minutes: Optional[int] = Field(default=None, gt=0, le=1440)

    @field_validator("name")
    @classmethod
    def _v_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Nome do procedimento muito curto")
        return v

    @field_validator("description")
    @classmethod
    def _v_desc(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None


class ProcedureUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=4000)
    base_price: Optional[Decimal] = Field(
        default=None, ge=0, max_digits=10, decimal_places=2
    )
    estimated_duration_minutes: Optional[int] = Field(default=None, gt=0, le=1440)

    @field_validator("name")
    @classmethod
    def _v_name(cls, v):
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Nome do procedimento muito curto")
        return v

    @field_validator("description")
    @classmethod
    def _v_desc(cls, v):
        if v is None:
            return v
        v = v.strip()
        return v or None

    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.model_dump(exclude_unset=True):
            raise ValueError("Informe ao menos um campo para atualizar")
        return self


class ProcedureRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    base_price: Decimal
    estimated_duration_minutes: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
