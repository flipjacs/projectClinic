from __future__ import annotations

from sqlalchemy import BigInteger, Boolean, CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import expression

from app.database.base import Base, TimestampMixin


class UserAppearanceSettings(Base, TimestampMixin):
    """Preferências de aparência POR USUÁRIO (tema, densidade, idioma,
    acessibilidade). Uma linha por usuário — cada pessoa tem o próprio tema.
    Campos fortemente tipados com CHECK constraints, nunca JSON."""

    __tablename__ = "user_appearance_settings"
    __table_args__ = (
        CheckConstraint(
            "theme IN ('light','dark','system')", name="theme_valid"
        ),
        CheckConstraint(
            "density IN ('compact','comfortable','spacious')", name="density_valid"
        ),
        CheckConstraint(
            "language IN ('pt-BR','en','es')", name="language_valid"
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    theme: Mapped[str] = mapped_column(String(10), nullable=False, default="light")
    density: Mapped[str] = mapped_column(String(12), nullable=False, default="comfortable")
    language: Mapped[str] = mapped_column(String(5), nullable=False, default="pt-BR")

    reduced_motion: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    high_contrast: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    confirm_critical_actions: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=expression.true()
    )
    auto_save_filters: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=expression.true()
    )
    reopen_last_page: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
