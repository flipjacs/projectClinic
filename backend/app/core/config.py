from functools import lru_cache
from typing import List, Literal, Optional

from pydantic import Field, computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da aplicação carregadas a partir de variáveis de ambiente."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Aplicação
    app_name: str = "Clinic Management API"
    app_env: Literal["development", "staging", "production", "test"] = "development"
    app_debug: bool = False
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    api_v1_prefix: str = "/api/v1"

    # Segurança / JWT
    secret_key: str = Field(..., min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    password_hash_scheme: Literal["bcrypt", "argon2"] = "argon2"
    login_rate_limit_attempts: int = Field(default=5, ge=1, le=100)
    login_rate_limit_window_seconds: int = Field(default=300, ge=10, le=86400)

    # Banco de dados (MySQL por padrão)
    db_driver: Literal["mysql", "postgresql"] = "mysql"
    db_host: str = "db"
    db_port: int = 3306
    db_user: str = "clinic"
    db_password: str = "clinic_password"
    db_name: str = "clinic_db"
    database_url: Optional[str] = None

    # CORS
    cors_origins: List[str] = Field(default_factory=list)

    # Bootstrap inicial
    initial_admin_name: Optional[str] = None
    initial_admin_email: Optional[str] = None
    initial_admin_password: Optional[str] = None

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_cors(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _validate_production_safety(self) -> "Settings":
        placeholder_secret = "change-me-use-a-strong-random-secret"
        if self.is_production:
            if placeholder_secret in self.secret_key.lower():
                raise ValueError("SECRET_KEY de produção não pode usar o placeholder do exemplo")
            if self.app_debug:
                raise ValueError("APP_DEBUG deve ser false em produção")
            if "*" in self.cors_origins:
                raise ValueError("CORS_ORIGINS não pode conter '*' em produção")
        return self

    @computed_field  # type: ignore[misc]
    @property
    def sqlalchemy_database_uri(self) -> str:
        """Monta a URL do SQLAlchemy a partir das variáveis individuais ou usa DATABASE_URL."""
        if self.database_url:
            return self.database_url

        if self.db_driver == "mysql":
            scheme = "mysql+pymysql"
        elif self.db_driver == "postgresql":
            scheme = "postgresql+psycopg2"
        else:
            raise ValueError(f"Driver de banco não suportado: {self.db_driver}")

        return (
            f"{scheme}://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
