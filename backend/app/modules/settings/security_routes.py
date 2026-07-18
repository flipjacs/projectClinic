from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import get_current_user, require_roles
from app.modules.settings.security_schemas import (
    SecurityAuditRead,
    SecuritySettingsRead,
    SecuritySettingsUpdate,
)
from app.modules.settings.security_service import SecuritySettingsService
from app.modules.users.models import User
from app.shared.exceptions import NotFoundError

router = APIRouter(prefix="/settings/security", tags=["settings"])


def _not_implemented(feature: str) -> HTTPException:
    """Resposta 501 padronizada para recursos que dependem de infraestrutura
    ainda não disponível (sessões distribuídas, TOTP)."""
    return HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"{feature} exige infraestrutura ainda não disponível neste servidor.",
    )


@router.get("", response_model=SecuritySettingsRead)
def get_security_settings(
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
) -> SecuritySettingsRead:
    """Políticas de segurança. 404 enquanto nada foi salvo — o frontend abre
    com os padrões."""
    service = SecuritySettingsService(db)
    entity = service.get()
    if entity is None:
        raise NotFoundError("Políticas de segurança ainda não definidas")
    return service.serialize(entity)


@router.put("", response_model=SecuritySettingsRead)
def update_security_settings(
    payload: SecuritySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(Role.ADMIN)),
) -> SecuritySettingsRead:
    service = SecuritySettingsService(db)
    entity = service.update(payload, current_user_id=current_user.id)
    return service.serialize(entity)


@router.get("/audit", response_model=SecurityAuditRead)
def get_security_audit(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SecurityAuditRead:
    return SecuritySettingsService(db).audit_summary(current_user.id)


# ---------------------------------------------------------------------------
# Sessões e 2FA — arquitetura pronta; dependem de infraestrutura futura.
# Retornam 501 padronizado (nunca 404), conforme especificado.
# ---------------------------------------------------------------------------
@router.get("/sessions")
def list_sessions(_current: User = Depends(require_roles(Role.ADMIN))):
    raise _not_implemented("A listagem de sessões ativas")


@router.delete("/sessions/{session_id}")
def terminate_session(
    session_id: str, _current: User = Depends(require_roles(Role.ADMIN))
):
    raise _not_implemented("O encerramento de uma sessão específica")


@router.post("/logout-all")
def logout_all_sessions(_current: User = Depends(require_roles(Role.ADMIN))):
    raise _not_implemented("O encerramento de todas as sessões")


@router.post("/2fa/enable")
def enable_two_factor(_current: User = Depends(require_roles(Role.ADMIN))):
    raise _not_implemented("A autenticação em duas etapas (TOTP)")


@router.post("/2fa/disable")
def disable_two_factor(_current: User = Depends(require_roles(Role.ADMIN))):
    raise _not_implemented("A autenticação em duas etapas (TOTP)")
