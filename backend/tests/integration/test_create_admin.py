"""Initial-admin bootstrap CLI tests (``python -m app.cli.create_admin``).

The CLI uses its own ``SessionLocal``; we monkeypatch it to the isolated test
engine so the command runs end-to-end against the throwaway database.
"""
from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.cli import create_admin as cli
from app.core.permissions import Role
from app.core.security import verify_password
from app.modules.users.models import User
from app.modules.users.schemas import UserCreate

pytestmark = pytest.mark.integration


@pytest.fixture()
def patched_session(db_engine, monkeypatch):
    """Point the CLI's SessionLocal at the test engine."""
    factory = sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False, future=True)
    monkeypatch.setattr(cli, "SessionLocal", factory)
    return factory


def test_env_example_admin_email_is_valid():
    """The .env.example email must pass EmailStr (regression for clinic.local)."""
    payload = UserCreate(
        name="Administrador", email="admin@clinic.com.br", password="Senha12345", role=Role.ADMIN
    )
    assert payload.email == "admin@clinic.com.br"


def test_create_admin_creates_admin_with_hashed_password(patched_session):
    rc = cli.main(
        ["--name", "Dra. Chefe", "--email", "chefe@clinic-test.com", "--password", "Senha12345"]
    )
    assert rc == 0

    with patched_session() as s:
        admin = s.execute(select(User).where(User.email == "chefe@clinic-test.com")).scalar_one()
        assert admin.role == Role.ADMIN
        assert admin.is_active is True
        # Stored as a hash, never plaintext, and verifiable.
        assert admin.password_hash != "Senha12345"
        assert verify_password("Senha12345", admin.password_hash)


def test_create_admin_is_idempotent(patched_session):
    rc1 = cli.main(["--name", "Admin 1", "--email", "a1@clinic-test.com", "--password", "Senha12345"])
    assert rc1 == 0

    # A second run without --force must NOT create another admin.
    rc2 = cli.main(["--name", "Admin 2", "--email", "a2@clinic-test.com", "--password", "Senha12345"])
    assert rc2 == 0

    with patched_session() as s:
        admins = s.execute(select(User).where(User.role == Role.ADMIN)).scalars().all()
        assert len(admins) == 1
        assert admins[0].email == "a1@clinic-test.com"


def test_create_admin_force_allows_second_admin(patched_session):
    cli.main(["--name", "Admin 1", "--email", "f1@clinic-test.com", "--password", "Senha12345"])
    rc = cli.main(
        ["--force", "--name", "Admin 2", "--email", "f2@clinic-test.com", "--password", "Senha12345"]
    )
    assert rc == 0

    with patched_session() as s:
        admins = s.execute(select(User).where(User.role == Role.ADMIN)).scalars().all()
        assert {a.email for a in admins} == {"f1@clinic-test.com", "f2@clinic-test.com"}


def test_create_admin_rejects_invalid_email(patched_session):
    # ".local" reserved TLD must be rejected before touching the database.
    rc = cli.main(["--name", "X", "--email", "admin@clinic.local", "--password", "Senha12345"])
    assert rc == 2

    with patched_session() as s:
        assert s.execute(select(User)).scalars().first() is None
