from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.patients.models import Patient, PatientHealthInfo
from app.modules.patients.schemas import (
    PatientCreate,
    PatientHealthInfoCreate,
    PatientHealthInfoRead,
    PatientHealthInfoUpdate,
    PatientListItem,
    PatientRead,
    PatientSummary,
    PatientUpdate,
)
from app.modules.patients.service import PatientHealthInfoService, PatientService
from app.modules.users.models import User
from app.shared.pagination import Page, PaginationParams, pagination_params

router = APIRouter(prefix="/patients", tags=["patients"])

# Quem pode mexer no cadastro básico do paciente
ANY_STAFF = require_roles(Role.ADMIN, Role.DENTIST, Role.RECEPTIONIST)
# Quem pode acessar informações sensíveis / clínicas
CLINICAL_ONLY = require_roles(Role.ADMIN, Role.DENTIST)


# ============================================================================
# Patient — dados cadastrais (todos os papéis autenticados podem operar)
# ============================================================================


@router.post(
    "",
    response_model=PatientRead,
    status_code=status.HTTP_201_CREATED,
)
def create_patient(
    payload: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
) -> Patient:
    return PatientService(db).create(payload, current_user=current_user)


@router.get(
    "",
    response_model=Page[PatientListItem],
    dependencies=[Depends(ANY_STAFF)],
)
def list_patients(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    search: Optional[str] = Query(
        default=None,
        description="Busca por nome, CPF ou telefone (com ou sem máscara)",
        max_length=120,
    ),
    include_inactive: bool = Query(
        default=False,
        description="Inclui pacientes inativos. Por padrão, apenas ativos são retornados.",
    ),
) -> Page[PatientListItem]:
    items, total = PatientService(db).list_paginated(
        term=search,
        include_inactive=include_inactive,
        params=params,
    )
    return Page[PatientListItem].build(
        items=[PatientListItem.model_validate(p) for p in items],
        total=total,
        params=params,
    )


@router.get(
    "/{patient_id}",
    response_model=PatientRead,
    dependencies=[Depends(ANY_STAFF)],
)
def get_patient(patient_id: int, db: Session = Depends(get_db)) -> Patient:
    return PatientService(db).get_by_id(patient_id)


@router.patch(
    "/{patient_id}",
    response_model=PatientRead,
)
def update_patient(
    patient_id: int,
    payload: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
) -> Patient:
    return PatientService(db).update(patient_id, payload, current_user=current_user)


# ============================================================================
# Ativar / Inativar — restrito ao corpo clínico
# ============================================================================


@router.patch(
    "/{patient_id}/activate",
    response_model=PatientRead,
)
def activate_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Patient:
    return PatientService(db).set_active(patient_id, active=True, current_user=current_user)


@router.patch(
    "/{patient_id}/deactivate",
    response_model=PatientRead,
)
def deactivate_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Patient:
    return PatientService(db).set_active(patient_id, active=False, current_user=current_user)


# ============================================================================
# Summary — consolidação com dados sensíveis (admin/dentist)
# ============================================================================


@router.get(
    "/{patient_id}/summary",
    response_model=PatientSummary,
    dependencies=[Depends(CLINICAL_ONLY)],
)
def patient_summary(patient_id: int, db: Session = Depends(get_db)) -> PatientSummary:
    patient_service = PatientService(db)
    info_service = PatientHealthInfoService(db)

    patient = patient_service.get_by_id(patient_id)
    info = info_service.get_optional(patient_id)

    return PatientSummary(
        patient=PatientRead.model_validate(patient),
        health_info=PatientHealthInfoRead.model_validate(info) if info else None,
    )


# ============================================================================
# Health Info — restrito ao corpo clínico
# ============================================================================


@router.post(
    "/{patient_id}/health-info",
    response_model=PatientHealthInfoRead,
    status_code=status.HTTP_201_CREATED,
)
def create_health_info(
    patient_id: int,
    payload: PatientHealthInfoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> PatientHealthInfo:
    return PatientHealthInfoService(db).create(
        patient_id, payload, current_user=current_user
    )


@router.get(
    "/{patient_id}/health-info",
    response_model=PatientHealthInfoRead,
    dependencies=[Depends(CLINICAL_ONLY)],
)
def get_health_info(patient_id: int, db: Session = Depends(get_db)) -> PatientHealthInfo:
    return PatientHealthInfoService(db).get(patient_id)


@router.patch(
    "/{patient_id}/health-info",
    response_model=PatientHealthInfoRead,
)
def update_health_info(
    patient_id: int,
    payload: PatientHealthInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> PatientHealthInfo:
    return PatientHealthInfoService(db).update(
        patient_id, payload, current_user=current_user
    )
