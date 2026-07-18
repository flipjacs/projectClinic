from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, CheckConstraint, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database.base import Base, TimestampMixin


class SecuritySettings(Base, TimestampMixin):
    """Políticas de segurança da instalação (linha única / singleton).

    Campos fortemente tipados — nunca JSON. Agrupa política de senha, sessão e
    bloqueio. O flag de 2FA é apenas a preparação da estrutura (a ativação real
    depende de infraestrutura TOTP, exposta como 501 até existir).
    """

    __tablename__ = "security_settings"
    __table_args__ = (
        CheckConstraint(
            "password_min_length >= 6 AND password_min_length <= 64",
            name="password_min_length_range",
        ),
        CheckConstraint(
            "password_expiration_days >= 0 AND password_expiration_days <= 365",
            name="password_expiration_days_range",
        ),
        CheckConstraint(
            "session_max_minutes >= 5 AND session_max_minutes <= 43200",
            name="session_max_minutes_range",
        ),
        CheckConstraint(
            "max_concurrent_sessions >= 1 AND max_concurrent_sessions <= 100",
            name="max_concurrent_sessions_range",
        ),
        CheckConstraint(
            "lockout_max_attempts >= 1 AND lockout_max_attempts <= 20",
            name="lockout_max_attempts_range",
        ),
        CheckConstraint(
            "lockout_minutes >= 1 AND lockout_minutes <= 1440",
            name="lockout_minutes_range",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # ----- Política de senha -----
    password_min_length: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    password_require_uppercase: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=expression.true()
    )
    password_require_lowercase: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=expression.true()
    )
    password_require_numbers: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=expression.true()
    )
    password_require_special_chars: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    password_allow_reuse: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    password_expiration_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    # ----- Sessão -----
    session_max_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=480)
    session_auto_logout: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=expression.true()
    )
    session_remember_device: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    max_concurrent_sessions: Mapped[int] = mapped_column(
        Integer, nullable=False, default=5
    )

    # ----- Bloqueio -----
    lockout_max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    lockout_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    lockout_auto_unlock: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=expression.true()
    )

    # ----- Autenticação em duas etapas (estrutura preparada) -----
    two_factor_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
