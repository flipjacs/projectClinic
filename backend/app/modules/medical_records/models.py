from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import expression

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.modules.users.models import User


class MedicalRecord(Base, TimestampMixin):
    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    patient_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("patients.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    dentist_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Vínculo opcional com uma consulta existente.
    appointment_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("appointments.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    visit_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    main_complaint: Mapped[str] = mapped_column(Text, nullable=False)
    diagnosis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    performed_procedure: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    clinical_evolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=expression.true(),
    )

    dentist: Mapped["User"] = relationship(lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<MedicalRecord id={self.id} patient_id={self.patient_id} "
            f"dentist_id={self.dentist_id} visit_date={self.visit_date}>"
        )
