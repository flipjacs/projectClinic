from __future__ import annotations

from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.modules.audit.service import AuditLogService
from app.modules.appointments.models import (
    ALLOWED_TRANSITIONS,
    TERMINAL_STATUSES,
    Appointment,
    AppointmentStatus,
)
from app.modules.appointments.repository import AppointmentRepository
from app.modules.appointments.schemas import (
    AppointmentCancel,
    AppointmentCreate,
    AppointmentReschedule,
    AppointmentStatusChange,
    AppointmentUpdate,
)
from app.modules.patients.repository import PatientRepository
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.exceptions import (
    AlreadyExistsError,
    NotFoundError,
    ValidationError,
)
from app.shared.pagination import PaginationParams
from app.shared.timezone import day_window as _day_window, now_utc as _now_utc
from app.shared.timezone import ensure_optional_aware_utc


class AppointmentService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AppointmentRepository(db)
        self.patient_repo = PatientRepository(db)
        self.user_repo = UserRepository(db)
        self.audit = AuditLogService(db)

    # ===== queries =====
    def get_by_id(self, appointment_id: int) -> Appointment:
        appointment = self.repo.get(appointment_id)
        if not appointment:
            raise NotFoundError("Consulta não encontrada")
        return appointment

    def list_paginated(
        self,
        *,
        params: PaginationParams,
        patient_id: Optional[int] = None,
        dentist_id: Optional[int] = None,
        statuses: Optional[Iterable[AppointmentStatus]] = None,
        from_dt: Optional[datetime] = None,
        to_dt: Optional[datetime] = None,
        include_canceled: bool = False,
    ) -> tuple[list[Appointment], int]:
        try:
            from_dt = ensure_optional_aware_utc(from_dt, "from")
            to_dt = ensure_optional_aware_utc(to_dt, "to")
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        if from_dt and to_dt and to_dt <= from_dt:
            raise ValidationError("Parâmetro 'to' deve ser maior que 'from'")
        items, total = self.repo.search(
            patient_id=patient_id,
            dentist_id=dentist_id,
            statuses=statuses,
            from_dt=from_dt,
            to_dt=to_dt,
            include_canceled=include_canceled,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    def list_today(
        self,
        *,
        params: PaginationParams,
        dentist_id: Optional[int] = None,
        include_canceled: bool = False,
    ) -> tuple[list[Appointment], int]:
        start_utc, end_utc = _day_window()
        return self.list_paginated(
            params=params,
            dentist_id=dentist_id,
            from_dt=start_utc,
            to_dt=end_utc,
            include_canceled=include_canceled,
        )

    # ===== mutations =====
    def create(
        self,
        *,
        payload: AppointmentCreate,
        current_user: User,
    ) -> Appointment:
        # Paciente válido e ativo.
        patient = self.patient_repo.get(payload.patient_id)
        if not patient:
            raise NotFoundError("Paciente não encontrado")
        if not patient.is_active:
            raise ValidationError("Paciente inativo. Reative antes de agendar")

        # Dentista válido, ativo e com papel clínico.
        # `get_for_update` serializa bookings concorrentes para o mesmo dentista:
        # duas requisições simultâneas com janelas sobrepostas precisam esperar
        # uma à outra antes de o `has_conflict` ler o estado atualizado.
        dentist = self.user_repo.get_for_update(payload.dentist_id)
        if not dentist:
            raise NotFoundError("Dentista não encontrado")
        if not dentist.is_active:
            raise ValidationError("Dentista inativo. Não é possível agendar")
        if dentist.role not in (Role.DENTIST, Role.ADMIN):
            raise ValidationError(
                "O usuário informado não possui papel clínico (dentist ou admin)"
            )

        # Não permitir criar no passado.
        if payload.scheduled_start <= _now_utc():
            raise ValidationError(
                "Horário de início deve ser no futuro"
            )

        # Conflito de agenda (agora seguro contra race condition).
        if self.repo.has_conflict(
            dentist_id=payload.dentist_id,
            start=payload.scheduled_start,
            end=payload.scheduled_end,
        ):
            raise AlreadyExistsError(
                "Conflito de horário: o dentista já possui consulta nesta janela"
            )

        appointment = Appointment(
            patient_id=patient.id,
            dentist_id=dentist.id,
            scheduled_start=payload.scheduled_start,
            scheduled_end=payload.scheduled_end,
            status=AppointmentStatus.SCHEDULED,
            reason=payload.reason,
            notes=payload.notes,
            rescheduled_count=0,
        )
        self.repo.add(appointment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="appointment.create",
            entity_type="appointment",
            entity_id=appointment.id,
            summary="Consulta criada",
        )
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def update(
        self,
        *,
        appointment_id: int,
        payload: AppointmentUpdate,
        current_user: User,
    ) -> Appointment:
        appointment = self.get_by_id(appointment_id)

        if appointment.status in TERMINAL_STATUSES:
            raise ValidationError(
                f"Consulta em estado terminal ({appointment.status.value}); "
                "não é possível editar campos"
            )

        data = payload.model_dump(exclude_unset=True)
        for field, value in data.items():
            setattr(appointment, field, value)

        self.repo.save(appointment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="appointment.update",
            entity_type="appointment",
            entity_id=appointment.id,
            summary="Consulta atualizada",
            metadata={"fields": sorted(data.keys())},
        )
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def reschedule(
        self,
        *,
        appointment_id: int,
        payload: AppointmentReschedule,
        current_user: User,
    ) -> Appointment:
        appointment = self.get_by_id(appointment_id)

        if appointment.status in TERMINAL_STATUSES:
            raise ValidationError(
                f"Consulta em estado terminal ({appointment.status.value}); "
                "não pode ser remarcada"
            )

        # Paciente precisa continuar ativo (defesa contra inativação intermediária).
        if not appointment.patient or not appointment.patient.is_active:
            raise ValidationError(
                "Paciente inativo. Reative antes de remarcar"
            )
        if not appointment.dentist or not appointment.dentist.is_active:
            raise ValidationError(
                "Dentista inativo. Não é possível remarcar"
            )

        # Novo horário precisa estar no futuro.
        if payload.scheduled_start <= _now_utc():
            raise ValidationError("Horário de início deve ser no futuro")

        # Lock no dentista para evitar race com bookings concorrentes.
        self.user_repo.get_for_update(appointment.dentist_id)

        # Conflito (ignorando a própria consulta).
        if self.repo.has_conflict(
            dentist_id=appointment.dentist_id,
            start=payload.scheduled_start,
            end=payload.scheduled_end,
            exclude_id=appointment.id,
        ):
            raise AlreadyExistsError(
                "Conflito de horário: o dentista já possui consulta nesta janela"
            )

        # Preserva o primeiro horário agendado (registro histórico básico).
        if appointment.original_start is None:
            appointment.original_start = appointment.scheduled_start

        appointment.scheduled_start = payload.scheduled_start
        appointment.scheduled_end = payload.scheduled_end
        appointment.rescheduled_count = (appointment.rescheduled_count or 0) + 1

        # Se voltou para SCHEDULED depois de ter sido CONFIRMED, isso é decisão
        # de negócio. Aqui mantemos o status atual (CONFIRMED segue valendo).
        # Apenas anotamos a remarcação no campo de notas, sem perder o conteúdo.
        if payload.reason:
            prefix = f"[remarcação] {payload.reason}"
            appointment.notes = (
                prefix if not appointment.notes else f"{appointment.notes}\n{prefix}"
            )

        self.repo.save(appointment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="appointment.reschedule",
            entity_type="appointment",
            entity_id=appointment.id,
            summary="Consulta remarcada",
        )
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def cancel(
        self,
        *,
        appointment_id: int,
        payload: AppointmentCancel,
        current_user: User,
    ) -> Appointment:
        appointment = self.get_by_id(appointment_id)

        if appointment.status == AppointmentStatus.CANCELED:
            return appointment
        if appointment.status in TERMINAL_STATUSES:
            raise ValidationError(
                f"Consulta em estado terminal ({appointment.status.value}); "
                "não pode ser cancelada"
            )

        appointment.status = AppointmentStatus.CANCELED
        appointment.canceled_at = _now_utc()
        appointment.cancellation_reason = payload.cancellation_reason

        self.repo.save(appointment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="appointment.cancel",
            entity_type="appointment",
            entity_id=appointment.id,
            summary="Consulta cancelada",
        )
        self.db.commit()
        self.db.refresh(appointment)
        return appointment

    def change_status(
        self,
        *,
        appointment_id: int,
        payload: AppointmentStatusChange,
        current_user: User,
    ) -> Appointment:
        appointment = self.get_by_id(appointment_id)
        new_status = payload.status

        if appointment.status == new_status:
            return appointment

        allowed = ALLOWED_TRANSITIONS.get(appointment.status, frozenset())
        if new_status not in allowed:
            raise ValidationError(
                f"Transição inválida: {appointment.status.value} → {new_status.value}"
            )

        appointment.status = new_status

        # Se foi cancelada por aqui, registra o timestamp.
        if new_status == AppointmentStatus.CANCELED:
            appointment.canceled_at = _now_utc()
        elif new_status != AppointmentStatus.CANCELED and appointment.canceled_at:
            # Restauração rara — apaga o canceled_at se de algum modo voltou.
            appointment.canceled_at = None
            appointment.cancellation_reason = None

        self.repo.save(appointment)
        self.audit.record(
            actor_user_id=current_user.id,
            action="appointment.status_change",
            entity_type="appointment",
            entity_id=appointment.id,
            summary=f"Status alterado para {new_status.value}",
            metadata={"status": new_status.value},
        )
        self.db.commit()
        self.db.refresh(appointment)
        return appointment
