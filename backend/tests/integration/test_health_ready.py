"""Liveness/readiness probes and request-id correlation."""
from __future__ import annotations

import pytest

from app.database.connection import get_db
from app.main import app

pytestmark = pytest.mark.integration


def test_health_is_liveness_only(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_ready_reports_database_up(client):
    resp = client.get("/ready")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "ready"
    assert body["database"] == "up"


def test_ready_returns_503_when_database_is_down(client):
    """If the DB check raises, /ready must degrade to 503 (not 500, no trace)."""

    class _BrokenSession:
        def execute(self, *args, **kwargs):
            raise RuntimeError("connection refused")

    def _broken_db():
        yield _BrokenSession()

    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = _broken_db
    try:
        resp = client.get("/ready")
    finally:
        if previous is not None:
            app.dependency_overrides[get_db] = previous
        else:
            app.dependency_overrides.pop(get_db, None)

    assert resp.status_code == 503
    body = resp.json()
    assert body["status"] == "unavailable"
    assert body["database"] == "down"


def test_response_carries_request_id_header(client):
    resp = client.get("/health")
    assert resp.headers.get("X-Request-ID")


def test_incoming_request_id_is_echoed(client):
    resp = client.get("/health", headers={"X-Request-ID": "test-correlation-123"})
    assert resp.headers.get("X-Request-ID") == "test-correlation-123"
