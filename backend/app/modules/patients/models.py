from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from app.database.base import Base, TimestampMixin


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # Dados pessoais
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    cpf: Mapped[str] = mapped_column(String(11), nullable=False, unique=True, index=True)
    birth_date: Mapped[date] = mapped_column(Date, nullable=False)
    phone: Mapped[str] = mapped_column(String(11), nullable=False, index=True)
    email: Mapped[Optional[str]] = mapped_column(String(180), nullable=True)

    # Endereço
    street: Mapped[str] = mapped_column(String(150), nullable=False)
    number: Mapped[str] = mapped_column(String(20), nullable=False)
    neighborhood: Mapped[str] = mapped_column(String(120), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    state: Mapped[str] = mapped_column(String(2), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(8), nullable=False)

    # Soft delete
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=expression.true(),
    )

    health_info: Mapped[Optional["PatientHealthInfo"]] = relationship(
        back_populates="patient",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Patient id={self.id} name={self.name!r} cpf={self.cpf}>"


class PatientHealthInfo(Base, TimestampMixin):
    __tablename__ = "patient_health_info"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    patient_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    has_disease: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    disease_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    has_allergy: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    allergy_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    uses_medication: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=expression.false()
    )
    medication_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    health_observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    patient: Mapped[Patient] = relationship(back_populates="health_info")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<PatientHealthInfo id={self.id} patient_id={self.patient_id}>"
