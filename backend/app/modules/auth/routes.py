from fastapi import APIRouter, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.connection import get_db
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import TokenResponse
from app.modules.auth.service import AuthService
from app.modules.users.models import User
from app.modules.users.schemas import UserRead
from app.shared.exceptions import UnauthorizedError
from app.shared.rate_limit import FixedWindowRateLimiter

router = APIRouter(prefix="/auth", tags=["auth"])

_login_limiter = FixedWindowRateLimiter(
    max_attempts=settings.login_rate_limit_attempts,
    window_seconds=settings.login_rate_limit_window_seconds,
)


def _login_limit_key(request: Request, email: str) -> str:
    client_host = request.client.host if request.client else "unknown"
    return f"{client_host}:{email.lower()}"


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Autentica com email (campo `username`) e senha.

    Compatível com o fluxo OAuth2 Password Flow do Swagger UI: use seu email
    no campo `username` ao clicar em **Authorize**.
    """
    limit_key = _login_limit_key(request, form_data.username)
    _login_limiter.check(limit_key)

    service = AuthService(db)
    try:
        user = service.authenticate(email=form_data.username, password=form_data.password)
    except UnauthorizedError:
        _login_limiter.register_failure(limit_key)
        raise

    _login_limiter.reset(limit_key)
    return service.issue_token(user)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
