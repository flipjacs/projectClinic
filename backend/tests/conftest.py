"""Shared pytest fixtures: isolated test database, app client and core users.

Database strategy
-----------------
By default each test runs against a **fresh, isolated SQLite database file**
(created in a per-test temporary directory) so tests are deterministic and never
touch the development/production MySQL instance.

Set ``TEST_DATABASE_URL`` (e.g. a dedicated MySQL schema) to run the exact same
suite against MySQL for full-fidelity behaviour. See ``docs/testing.md``.

Known SQLite limitations vs MySQL (documented, not hidden):
  * ``SELECT ... FOR UPDATE`` is a no-op (row-level pessimistic locks are not
    exercised). Concurrency invariants are therefore tested deterministically;
    a real stress test requires MySQL (see TODOs in test_finance/test_inventory).
  * ``DateTime(timezone=True)`` is stored as naive UTC. Values are persisted and
    compared consistently in UTC, so range filters still behave correctly.
  * ``BigInteger`` primary keys are compiled to ``INTEGER`` (test-only shim) so
    that SQLite's rowid autoincrement works. This does not affect MySQL.
"""
from __future__ import annotations

import os
from typing import Callable, Iterator

import pytest
from sqlalchemy import BigInteger, create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker

# ---------------------------------------------------------------------------
# Test-only DDL shim: SQLite only treats "INTEGER PRIMARY KEY" as an
# autoincrementing rowid alias. The app models use BigInteger PKs (correct for
# MySQL), so we compile BigInteger -> INTEGER *for the sqlite dialect only*.
# This never runs against MySQL and does not change application code.
# ---------------------------------------------------------------------------
@compiles(BigInteger, "sqlite")
def _compile_biginteger_as_integer_on_sqlite(element, compiler, **kw):  # noqa: ANN001
    return "INTEGER"


from app.core.config import settings  # noqa: E402
from app.database.base import Base  # noqa: E402
from app.database.connection import get_db  # noqa: E402
from app.main import app  # noqa: E402  (importing populates Base.metadata)

API = settings.api_v1_prefix


def _make_engine(tmp_path) -> Engine:
    url = os.getenv("TEST_DATABASE_URL")
    if url:
        return create_engine(url, future=True, pool_pre_ping=True)

    db_file = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_file}",
        future=True,
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_con, _record):  # noqa: ANN001
        cur = dbapi_con.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA busy_timeout=5000")
        cur.close()

    return engine


@pytest.fixture()
def db_engine(tmp_path) -> Iterator[Engine]:
    engine = _make_engine(tmp_path)
    Base.metadata.create_all(engine)
    try:
        yield engine
    finally:
        Base.metadata.drop_all(engine)
        engine.dispose()


@pytest.fixture()
def session_factory(db_engine) -> Callable[[], Session]:
    """Factory of short-lived sessions for asserting persisted DB state.

    Each call returns a brand new session (fresh transaction) so it always sees
    the latest committed state produced by the application during a request.
    """
    return sessionmaker(bind=db_engine, autoflush=False, expire_on_commit=False, future=True)


@pytest.fixture()
def db_session(session_factory) -> Iterator[Session]:
    """Long-lived session used to arrange test data (factories)."""
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_engine, session_factory):
    """FastAPI TestClient wired to the isolated test database via get_db override."""
    from fastapi.testclient import TestClient

    def _override_get_db() -> Iterator[Session]:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _reset_login_rate_limiter():
    """The login rate limiter is a process-global singleton; reset between tests
    so attempts from one test cannot leak into another and trip a false 429."""
    from app.modules.auth.routes import _login_limiter

    _login_limiter._attempts.clear()
    yield
    _login_limiter._attempts.clear()


# ---------------------------------------------------------------------------
# Core user fixtures
# ---------------------------------------------------------------------------
from app.core.permissions import Role  # noqa: E402
from tests.helpers import factories  # noqa: E402
from tests.helpers.auth import auth_headers  # noqa: E402


@pytest.fixture()
def admin_user(db_session):
    return factories.create_user(db_session, role=Role.ADMIN, email="admin@clinic-test.com", name="Admin User")


@pytest.fixture()
def dentist_user(db_session):
    return factories.create_user(db_session, role=Role.DENTIST, email="dentist@clinic-test.com", name="Dr. Dentist")


@pytest.fixture()
def other_dentist_user(db_session):
    return factories.create_user(
        db_session, role=Role.DENTIST, email="dentist2@clinic-test.com", name="Dr. Other"
    )


@pytest.fixture()
def receptionist_user(db_session):
    return factories.create_user(
        db_session, role=Role.RECEPTIONIST, email="recep@clinic-test.com", name="Reception"
    )


@pytest.fixture()
def inactive_user(db_session):
    return factories.create_user(
        db_session, role=Role.RECEPTIONIST, email="inactive@clinic-test.com", name="Inactive", active=False
    )


@pytest.fixture()
def patient(db_session):
    return factories.create_patient(db_session, name="Paciente Teste")


@pytest.fixture()
def procedure(db_session):
    return factories.create_procedure(db_session, name="Limpeza", base_price="100.00")


@pytest.fixture()
def inventory_item(db_session):
    return factories.create_inventory_item(db_session, name="Luva", current="10.000", minimum="2.000")


# Convenience header fixtures ------------------------------------------------
@pytest.fixture()
def admin_headers(client, admin_user):
    return auth_headers(client, admin_user.email)


@pytest.fixture()
def dentist_headers(client, dentist_user):
    return auth_headers(client, dentist_user.email)


@pytest.fixture()
def receptionist_headers(client, receptionist_user):
    return auth_headers(client, receptionist_user.email)
