from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import Role
from app.core.security import decode_token
from app.database.connection import get_db
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_prefix}/auth/login",
    auto_error=True,
)


_CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Não foi possível validar as credenciais",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise _CREDENTIALS_EXC from exc

    if payload.get("type") != "access":
        raise _CREDENTIALS_EXC

    subject = payload.get("sub")
    if not subject:
        raise _CREDENTIALS_EXC

    try:
        user_id = int(subject)
    except (TypeError, ValueError) as exc:
        raise _CREDENTIALS_EXC from exc

    user = UserRepository(db).get(user_id)
    if not user or not user.is_active:
        raise _CREDENTIALS_EXC

    return user


def require_roles(*roles: Role):
    """Cria uma dependência que exige um dos papéis informados.

    Retorna o usuário autenticado para que a rota possa usá-lo se quiser.
    """
    allowed: tuple[Role, ...] = roles

    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso negado para este recurso",
            )
        return current_user

    return _checker


def require_any_authenticated(current_user: User = Depends(get_current_user)) -> User:
    """Atalho para rotas que só exigem autenticação, sem papel específico."""
    return current_user


__all__ = [
    "oauth2_scheme",
    "get_current_user",
    "require_roles",
    "require_any_authenticated",
]


# Re-export para conveniência
_ = Iterable  # silenciar linters caso o tipo não seja usado diretamente
