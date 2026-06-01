from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    BigInteger,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.modules.patients.models import Patient
    from app.modules.users.models import User


class AppointmentStatus(str, Enum):
    """Estados de uma consulta.

    - SCHEDULED:   agendada e ainda não confirmada
    - CONFIRMED:   confirmada pelo paciente / recepção
    - IN_PROGRESS: paciente em atendimento agora
    - COMPLETED:   atendimento concluído
    - CANCELED:    cancelada antes de acontecer
    - NO_SHOW:     paciente não compareceu
    """

    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"
    NO_SHOW = "no_show"


# Status que ocupam o horário (bloqueiam conflito).
BLOCKING_STATUSES: frozenset[AppointmentStatus] = frozenset(
    {
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.COMPLETED,
    }
)

# Status terminais — não admitem transição para outros estados.
TERMINAL_STATUSES: frozenset[AppointmentStatus] = frozenset(
    {
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELED,
        AppointmentStatus.NO_SHOW,
    }
)

# Mapa de transições permitidas (status atual → conjunto de próximos status válidos).
ALLOWED_TRANSITIONS: dict[AppointmentStatus, frozenset[AppointmentStatus]] = {
    AppointmentStatus.SCHEDULED: frozenset(
        {
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.CANCELED,
            AppointmentStatus.NO_SHOW,
        }
    ),
    AppointmentStatus.CONFIRMED: frozenset(
        {
            AppointmentStatus.SCHEDULED,  # permite "desconfirmar"
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.CANCELED,
            AppointmentStatus.NO_SHOW,
        }
    ),
    AppointmentStatus.IN_PROGRESS: frozenset(
        {
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELED,
            AppointmentStatus.NO_SHOW,
        }
    ),
    AppointmentStatus.COMPLETED: frozenset(),
    AppointmentStatus.CANCELED: frozenset(),
    AppointmentStatus.NO_SHOW: frozenset(),
}


class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"

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

    scheduled_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    scheduled_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    status: Mapped[AppointmentStatus] = mapped_column(
        SAEnum(
            AppointmentStatus,
            name="appointment_status",
            native_enum=False,
            length=30,
            validate_strings=True,
        ),
        nullable=False,
        default=AppointmentStatus.SCHEDULED,
        server_default=AppointmentStatus.SCHEDULED.value,
        index=True,
    )

    reason: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Histórico básico de remarcação.
    rescheduled_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    original_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Cancelamento.
    canceled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    cancellation_reason: Mapped[Optional[str]] = mapped_column(
        String(500), nullable=True
    )

    patient: Mapped["Patient"] = relationship(lazy="selectin")
    dentist: Mapped["User"] = relationship(lazy="selectin")

    def __repr__(self) -> str:  # pragma: no cover
        return (
            f"<Appointment id={self.id} patient_id={self.patient_id} "
            f"dentist_id={self.dentist_id} start={self.scheduled_start} "
            f"status={self.status.value}>"
        )
