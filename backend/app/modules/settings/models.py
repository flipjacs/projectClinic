from __future__ import annotations

from typing import List, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class ClinicSettings(Base, TimestampMixin):
    """Dados institucionais da clínica.

    Linha única (singleton) por instalação. Guarda apenas o **caminho** dos
    logos (nunca o binário). O horário de funcionamento vive em uma tabela
    relacional própria (``clinic_schedule_days``), não em JSON.
    """

    __tablename__ = "clinic_settings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Informações gerais
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    trade_name: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    technical_director: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    cro: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    phone: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    whatsapp: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(180), nullable=False, default="")
    website: Mapped[str] = mapped_column(String(180), nullable=False, default="")

    # Endereço
    zip_code: Mapped[str] = mapped_column(String(9), nullable=False, default="")
    street: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    number: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    complement: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    district: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    city: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    state: Mapped[str] = mapped_column(String(2), nullable=False, default="")
    country: Mapped[str] = mapped_column(String(60), nullable=False, default="Brasil")

    # Identidade visual — somente caminhos relativos (ex.: "clinic/ab12.webp").
    logo_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    logo_small_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Informações adicionais
    observations: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    default_message: Mapped[str] = mapped_column(String(300), nullable=False, default="")
    pdf_footer: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    institutional_description: Mapped[str] = mapped_column(
        String(1000), nullable=False, default=""
    )

    schedule_days: Mapped[List["ClinicScheduleDay"]] = relationship(
        back_populates="clinic",
        cascade="all, delete-orphan",
        order_by="ClinicScheduleDay.weekday",
        lazy="selectin",
    )


class ClinicScheduleDay(Base):
    """Um dia da grade de funcionamento (0 = segunda … 6 = domingo)."""

    __tablename__ = "clinic_schedule_days"
    __table_args__ = (
        UniqueConstraint("clinic_id", "weekday", name="uq_clinic_schedule_days_clinic_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    clinic_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("clinic_settings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    weekday: Mapped[int] = mapped_column(Integer, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    # "HH:MM" — escalares simples; intervalo é opcional (nulo = sem intervalo).
    opens_at: Mapped[str] = mapped_column(String(5), nullable=False, default="08:00")
    closes_at: Mapped[str] = mapped_column(String(5), nullable=False, default="18:00")
    break_starts_at: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)
    break_ends_at: Mapped[Optional[str]] = mapped_column(String(5), nullable=True)

    clinic: Mapped["ClinicSettings"] = relationship(back_populates="schedule_days")
