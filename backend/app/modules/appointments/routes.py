from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.modules.appointments.schemas import (
    AppointmentCancel,
    AppointmentCreate,
    AppointmentRead,
    AppointmentReschedule,
    AppointmentStatusChange,
    AppointmentUpdate,
)
from app.modules.appointments.service import AppointmentService
from app.modules.users.models import User
from app.shared.pagination import Page, PaginationParams, pagination_params

router = APIRouter(prefix="/appointments", tags=["appointments"])

# Quem pode mexer na agenda em geral (criar, editar, remarcar, cancelar).
SCHEDULING_STAFF = require_roles(Role.ADMIN, Role.DENTIST, Role.RECEPTIONIST)
# Só pode trocar status clínico (in_progress, completed, no_show, etc.).
CLINICAL_STATUS = require_roles(Role.ADMIN, Role.DENTIST)


# ============================================================================
# Criação
# ============================================================================


@router.post(
    "",
    response_model=AppointmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(SCHEDULING_STAFF),
) -> Appointment:
    return AppointmentService(db).create(payload=payload, current_user=current_user)


# ============================================================================
# Listagem com filtros
# ============================================================================


@router.get(
    "",
    response_model=Page[AppointmentRead],
    dependencies=[Depends(SCHEDULING_STAFF)],
)
def list_appointments(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    patient_id: Optional[int] = Query(default=None, ge=1),
    dentist_id: Optional[int] = Query(default=None, ge=1),
    status_filter: Optional[AppointmentStatus] = Query(
        default=None,
        alias="status",
        description="Filtra por um status específico.",
    ),
    from_dt: Optional[datetime] = Query(
        default=None,
        alias="from",
        description="Início do intervalo (ISO 8601 com timezone).",
    ),
    to_dt: Optional[datetime] = Query(
        default=None,
        alias="to",
        description="Fim do intervalo (exclusivo, ISO 8601 com timezone).",
    ),
    include_canceled: bool = Query(
        default=False,
        description="Inclui consultas canceladas (por padrão são ocultas).",
    ),
) -> Page[AppointmentRead]:
    statuses = [status_filter] if status_filter else None
    items, total = AppointmentService(db).list_paginated(
        params=params,
        patient_id=patient_id,
        dentist_id=dentist_id,
        statuses=statuses,
        from_dt=from_dt,
        to_dt=to_dt,
        include_canceled=include_canceled,
    )
    return Page[AppointmentRead].build(
        items=[AppointmentRead.model_validate(a) for a in items],
        total=total,
        params=params,
    )


# ============================================================================
# Consultas do dia
# ============================================================================


@router.get(
    "/today",
    response_model=Page[AppointmentRead],
    dependencies=[Depends(SCHEDULING_STAFF)],
)
def list_appointments_today(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    dentist_id: Optional[int] = Query(
        default=None,
        ge=1,
        description="Filtra a agenda do dia para um dentista específico.",
    ),
    include_canceled: bool = Query(default=False),
) -> Page[AppointmentRead]:
    items, total = AppointmentService(db).list_today(
        params=params,
        dentist_id=dentist_id,
        include_canceled=include_canceled,
    )
    return Page[AppointmentRead].build(
        items=[AppointmentRead.model_validate(a) for a in items],
        total=total,
        params=params,
    )


# ============================================================================
# Operações sobre uma consulta individual
# ============================================================================


@router.get(
    "/{appointment_id}",
    response_model=AppointmentRead,
    dependencies=[Depends(SCHEDULING_STAFF)],
)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
) -> Appointment:
    return AppointmentService(db).get_by_id(appointment_id)


@router.patch(
    "/{appointment_id}",
    response_model=AppointmentRead,
)
def update_appointment(
    appointment_id: int,
    payload: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(SCHEDULING_STAFF),
) -> Appointment:
    return AppointmentService(db).update(
        appointment_id=appointment_id,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/{appointment_id}/reschedule",
    response_model=AppointmentRead,
)
def reschedule_appointment(
    appointment_id: int,
    payload: AppointmentReschedule,
    db: Session = Depends(get_db),
    current_user: User = Depends(SCHEDULING_STAFF),
) -> Appointment:
    return AppointmentService(db).reschedule(
        appointment_id=appointment_id,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/{appointment_id}/cancel",
    response_model=AppointmentRead,
)
def cancel_appointment(
    appointment_id: int,
    payload: AppointmentCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(SCHEDULING_STAFF),
) -> Appointment:
    return AppointmentService(db).cancel(
        appointment_id=appointment_id,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/{appointment_id}/status",
    response_model=AppointmentRead,
)
def change_appointment_status(
    appointment_id: int,
    payload: AppointmentStatusChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_STATUS),
) -> Appointment:
    return AppointmentService(db).change_status(
        appointment_id=appointment_id,
        payload=payload,
        current_user=current_user,
    )
