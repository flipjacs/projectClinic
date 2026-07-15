from fastapi import HTTPException, status


class AppException(Exception):
    """Base de todas as exceções de domínio do sistema."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    default_message: str = "Erro na aplicação"

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.default_message)
        self.message = message or self.default_message

    def to_http(self) -> HTTPException:
        return HTTPException(status_code=self.status_code, detail=self.message)


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    default_message = "Recurso não encontrado"


class AlreadyExistsError(AppException):
    status_code = status.HTTP_409_CONFLICT
    default_message = "Recurso já existe"


class ValidationError(AppException):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    default_message = "Dados inválidos"


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = "Credenciais inválidas"


class ForbiddenError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    default_message = "Acesso negado"
