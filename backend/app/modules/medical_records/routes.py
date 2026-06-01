from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.medical_records.models import MedicalRecord
from app.modules.medical_records.schemas import (
    MedicalRecordCreate,
    MedicalRecordRead,
    MedicalRecordUpdate,
)
from app.modules.medical_records.service import MedicalRecordService
from app.modules.users.models import User
from app.shared.pagination import Page, PaginationParams, pagination_params

# Sem prefixo: as rotas declaram explicitamente os dois grupos de paths
# (nested sob /patients e flat sob /medical-records).
router = APIRouter(tags=["medical-records"])

# Acesso clínico — apenas ADMIN e DENTIST.
CLINICAL_ONLY = require_roles(Role.ADMIN, Role.DENTIST)


# ============================================================================
# Criação e listagem — aninhadas sob /patients/{patient_id}
# ============================================================================


@router.post(
    "/patients/{patient_id}/medical-records",
    response_model=MedicalRecordRead,
    status_code=status.HTTP_201_CREATED,
)
def create_medical_record(
    patient_id: int,
    payload: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> MedicalRecord:
    return MedicalRecordService(db).create(
        patient_id=patient_id,
        payload=payload,
        current_user=current_user,
    )


@router.get(
    "/patients/{patient_id}/medical-records",
    response_model=Page[MedicalRecordRead],
)
def list_medical_records(
    patient_id: int,
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    current_user: User = Depends(CLINICAL_ONLY),
    include_inactive: bool = Query(
        default=False,
        description="Inclui prontuários inativos. Por padrão, apenas ativos.",
    ),
) -> Page[MedicalRecordRead]:
    items, total = MedicalRecordService(db).list_for_patient(
        patient_id=patient_id,
        include_inactive=include_inactive,
        params=params,
        current_user=current_user,
    )
    return Page[MedicalRecordRead].build(
        items=[MedicalRecordRead.model_validate(r) for r in items],
        total=total,
        params=params,
    )


# ============================================================================
# Operações sobre um prontuário individual — /medical-records/{record_id}
# ============================================================================


@router.get(
    "/medical-records/{record_id}",
    response_model=MedicalRecordRead,
)
def get_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> MedicalRecord:
    return MedicalRecordService(db).get_by_id(record_id, current_user=current_user)


@router.patch(
    "/medical-records/{record_id}",
    response_model=MedicalRecordRead,
)
def update_medical_record(
    record_id: int,
    payload: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> MedicalRecord:
    return MedicalRecordService(db).update(
        record_id=record_id,
        payload=payload,
        current_user=current_user,
    )


@router.patch(
    "/medical-records/{record_id}/deactivate",
    response_model=MedicalRecordRead,
)
def deactivate_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> MedicalRecord:
    return MedicalRecordService(db).set_active(
        record_id=record_id,
        active=False,
        current_user=current_user,
    )


@router.patch(
    "/medical-records/{record_id}/activate",
    response_model=MedicalRecordRead,
)
def activate_medical_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> MedicalRecord:
    return MedicalRecordService(db).set_active(
        record_id=record_id,
        active=True,
        current_user=current_user,
    )
