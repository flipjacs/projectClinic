from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Payload alternativo em JSON (não usado por OAuth2PasswordRequestForm)."""

    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos até expirar
