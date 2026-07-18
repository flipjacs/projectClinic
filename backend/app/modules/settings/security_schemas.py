from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-schemas (write) — fortemente tipados e validados no servidor.
# ---------------------------------------------------------------------------
class PasswordPolicyIn(BaseModel):
    min_length: int = Field(ge=6, le=64)
    require_uppercase: bool
    require_lowercase: bool = True
    require_numbers: bool
    require_special_chars: bool
    allow_password_reuse: bool
    expiration_days: int = Field(ge=0, le=365)


class SessionPolicyIn(BaseModel):
    max_minutes: int = Field(ge=5, le=43200)
    auto_logout: bool
    remember_device: bool
    max_concurrent_sessions: int = Field(ge=1, le=100)


class LockoutPolicyIn(BaseModel):
    max_attempts: int = Field(ge=1, le=20)
    lockout_minutes: int = Field(ge=1, le=1440)
    auto_unlock: bool


class SecuritySettingsUpdate(BaseModel):
    """Atualização parcial: só os grupos enviados são alterados; o restante é
    preservado. A UI atual edita apenas ``password_policy``."""

    password_policy: Optional[PasswordPolicyIn] = None
    session: Optional[SessionPolicyIn] = None
    lockout: Optional[LockoutPolicyIn] = None


# ---------------------------------------------------------------------------
# Read — espelha o DTO consumido pelo frontend.
# ---------------------------------------------------------------------------
class PasswordPolicyOut(BaseModel):
    min_length: int
    require_uppercase: bool
    require_lowercase: bool
    require_numbers: bool
    require_special_chars: bool
    allow_password_reuse: bool
    expiration_days: int


class SessionPolicyOut(BaseModel):
    max_minutes: int
    auto_logout: bool
    remember_device: bool
    max_concurrent_sessions: int


class LockoutPolicyOut(BaseModel):
    max_attempts: int
    lockout_minutes: int
    auto_unlock: bool


class SecuritySettingsRead(BaseModel):
    password_policy: PasswordPolicyOut
    session: SessionPolicyOut
    lockout: LockoutPolicyOut
    two_factor_enabled: bool


class SecurityAuditRead(BaseModel):
    last_password_change: Optional[str] = None
    last_login: Optional[str] = None
    last_settings_change: Optional[str] = None
    recent_events_count: Optional[int] = None
