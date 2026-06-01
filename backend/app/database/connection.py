from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _build_engine() -> Engine:
    return create_engine(
        settings.sqlalchemy_database_uri,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        # MySQL fecha conexões ociosas em ~8h por padrão; recicla antes disso.
        pool_recycle=3600,
        echo=settings.app_debug and not settings.is_production,
        future=True,
    )


engine: Engine = _build_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    """Dependência do FastAPI para fornecer uma sessão de banco por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
