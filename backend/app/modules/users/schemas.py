from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.permissions import Role


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    role: Role


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def _validate_password_strength(cls, value: str) -> str:
        if value.strip() != value:
            raise ValueError("Senha não pode iniciar ou terminar com espaços")
        has_letter = any(c.isalpha() for c in value)
        has_digit = any(c.isdigit() for c in value)
        if not (has_letter and has_digit):
            raise ValueError("Senha deve conter letras e números")
        return value


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    role: Optional[Role] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def _validate_password_strength(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if value.strip() != value:
            raise ValueError("Senha não pode iniciar ou terminar com espaços")
        has_letter = any(c.isalpha() for c in value)
        has_digit = any(c.isdigit() for c in value)
        if not (has_letter and has_digit):
            raise ValueError("Senha deve conter letras e números")
        return value


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime
    updated_at: datetime
