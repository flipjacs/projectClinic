from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.settings.schemas import (
    ClinicSettingsRead,
    ClinicSettingsUpdate,
    LogoUploadResponse,
)
from app.modules.settings.service import ClinicSettingsService
from app.modules.users.models import User
from app.shared.exceptions import NotFoundError

router = APIRouter(prefix="/settings", tags=["settings"])

LogoKind = Literal["logo", "logo_small"]


@router.get("/clinic", response_model=ClinicSettingsRead)
def get_clinic_settings(
    request: Request,
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
) -> ClinicSettingsRead:
    """Dados da clínica. Visível para qualquer usuário autenticado (aparecem em
    recibos e orçamentos). 404 enquanto nada foi salvo — o frontend abre com os
    padrões."""
    service = ClinicSettingsService(db)
    clinic = service.get()
    if clinic is None:
        raise NotFoundError("Configurações da clínica ainda não definidas")
    return service.serialize(clinic, str(request.base_url))


@router.put("/clinic", response_model=ClinicSettingsRead)
def update_clinic_settings(
    payload: ClinicSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> ClinicSettingsRead:
    service = ClinicSettingsService(db)
    clinic = service.update(payload, current_user_id=current_user.id)
    return service.serialize(clinic, str(request.base_url))


@router.post(
    "/clinic/logo",
    response_model=LogoUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_clinic_logo(
    request: Request,
    file: UploadFile = File(...),
    kind: LogoKind = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> LogoUploadResponse:
    content = await file.read()
    service = ClinicSettingsService(db)
    rel_path = service.set_logo(
        kind=kind,
        content=content,
        content_type=file.content_type or "",
        current_user_id=current_user.id,
    )
    url = f"{str(request.base_url).rstrip('/')}/media/{rel_path}"
    return LogoUploadResponse(url=url)


@router.delete("/clinic/logo", status_code=status.HTTP_204_NO_CONTENT)
def delete_clinic_logo(
    kind: LogoKind = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> Response:
    service = ClinicSettingsService(db)
    service.remove_logo(kind=kind, current_user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
