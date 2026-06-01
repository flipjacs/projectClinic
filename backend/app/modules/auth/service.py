from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    needs_rehash,
    verify_password,
)
from app.modules.auth.schemas import TokenResponse
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.shared.exceptions import UnauthorizedError


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)

    def authenticate(self, email: str, password: str) -> User:
        # Mensagem genérica para não vazar se o email existe.
        generic_error = UnauthorizedError("Credenciais inválidas")

        user = self.users.get_by_email(email.lower())
        if not user:
            raise generic_error

        if not verify_password(password, user.password_hash):
            raise generic_error

        if not user.is_active:
            # Mantemos a mesma mensagem genérica para não distinguir contas inativas
            # de credenciais erradas a partir do endpoint público.
            raise generic_error

        # Faz rehash transparente quando o esquema/parametros do hash mudam.
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(password)
            self.db.commit()
            self.db.refresh(user)

        return user

    def issue_token(self, user: User) -> TokenResponse:
        token = create_access_token(
            subject=str(user.id),
            extra_claims={"role": user.role.value, "email": user.email},
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )
