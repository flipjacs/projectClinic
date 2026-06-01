from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.procedures.models import Procedure
from app.modules.procedures.schemas import (
    ProcedureCreate,
    ProcedureRead,
    ProcedureUpdate,
)
from app.modules.procedures.service import ProcedureService
from app.shared.pagination import Page, PaginationParams, pagination_params

router = APIRouter(prefix="/procedures", tags=["procedures"])

# Qualquer usuário autenticado da clínica pode listar / visualizar procedimentos.
ANY_STAFF = require_roles(Role.ADMIN, Role.DENTIST, Role.RECEPTIONIST)
# Apenas ADMIN e DENTIST podem mexer no catálogo técnico.
CLINICAL_ONLY = require_roles(Role.ADMIN, Role.DENTIST)


@router.post(
    "",
    response_model=ProcedureRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(CLINICAL_ONLY)],
)
def create_procedure(
    payload: ProcedureCreate,
    db: Session = Depends(get_db),
) -> Procedure:
    return ProcedureService(db).create(payload)


@router.get(
    "",
    response_model=Page[ProcedureRead],
    dependencies=[Depends(ANY_STAFF)],
)
def list_procedures(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    search: Optional[str] = Query(
        default=None, max_length=120, description="Busca por nome."
    ),
    include_inactive: bool = Query(
        default=False,
        description="Inclui procedimentos inativos. Por padrão, apenas ativos.",
    ),
) -> Page[ProcedureRead]:
    items, total = ProcedureService(db).list_paginated(
        term=search, include_inactive=include_inactive, params=params
    )
    return Page[ProcedureRead].build(
        items=[ProcedureRead.model_validate(p) for p in items],
        total=total,
        params=params,
    )


@router.get(
    "/{procedure_id}",
    response_model=ProcedureRead,
    dependencies=[Depends(ANY_STAFF)],
)
def get_procedure(procedure_id: int, db: Session = Depends(get_db)) -> Procedure:
    return ProcedureService(db).get_by_id(procedure_id)


@router.patch(
    "/{procedure_id}",
    response_model=ProcedureRead,
    dependencies=[Depends(CLINICAL_ONLY)],
)
def update_procedure(
    procedure_id: int,
    payload: ProcedureUpdate,
    db: Session = Depends(get_db),
) -> Procedure:
    return ProcedureService(db).update(procedure_id, payload)


@router.patch(
    "/{procedure_id}/activate",
    response_model=ProcedureRead,
    dependencies=[Depends(CLINICAL_ONLY)],
)
def activate_procedure(procedure_id: int, db: Session = Depends(get_db)) -> Procedure:
    return ProcedureService(db).set_active(procedure_id, active=True)


@router.patch(
    "/{procedure_id}/deactivate",
    response_model=ProcedureRead,
    dependencies=[Depends(CLINICAL_ONLY)],
)
def deactivate_procedure(procedure_id: int, db: Session = Depends(get_db)) -> Procedure:
    return ProcedureService(db).set_active(procedure_id, active=False)
