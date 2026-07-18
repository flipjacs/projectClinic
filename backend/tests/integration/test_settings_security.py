"""Security settings integration tests: CRUD, RBAC, validation, 501, audit."""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.modules.audit.models import AuditLog
from app.modules.settings.security_models import SecuritySettings
from tests.helpers.asserts import (
    assert_forbidden,
    assert_no_sensitive_fields,
    assert_not_found,
    assert_status,
    assert_validation_error,
)
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def _policy(**overrides) -> dict:
    policy = {
        "min_length": 12,
        "require_uppercase": True,
        "require_lowercase": True,
        "require_numbers": True,
        "require_special_chars": True,
        "allow_password_reuse": False,
        "expiration_days": 90,
    }
    policy.update(overrides)
    return {"password_policy": policy}


# ---------------------------------------------------------------------------
# CRUD + persistence
# ---------------------------------------------------------------------------
def test_get_returns_404_before_anything_saved(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert_not_found(client.get(f"{API}/settings/security", headers=headers))


def test_put_creates_and_persists(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.put(f"{API}/settings/security", headers=headers, json=_policy())
    assert_status(resp, 200)
    body = resp.json()
    assert body["password_policy"]["min_length"] == 12
    assert body["password_policy"]["require_lowercase"] is True
    # session + lockout groups come back with defaults, persisted.
    assert body["session"]["max_minutes"] == 480
    assert body["lockout"]["max_attempts"] == 5
    assert body["two_factor_enabled"] is False

    got = client.get(f"{API}/settings/security", headers=headers).json()
    assert got["password_policy"]["expiration_days"] == 90

    with session_factory() as s:
        assert s.query(SecuritySettings).count() == 1


def test_partial_update_preserves_other_groups(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/security", headers=headers, json=_policy(min_length=10))
    # Second PUT sends only password_policy; session/lockout must be preserved.
    client.put(f"{API}/settings/security", headers=headers, json=_policy(min_length=16))
    with session_factory() as s:
        row = s.query(SecuritySettings).one()
        assert row.password_min_length == 16
        assert row.session_max_minutes == 480  # untouched default preserved
        assert row.lockout_max_attempts == 5


def test_put_is_idempotent_singleton(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/security", headers=headers, json=_policy())
    client.put(f"{API}/settings/security", headers=headers, json=_policy(min_length=8))
    with session_factory() as s:
        assert s.query(SecuritySettings).count() == 1
        assert s.query(SecuritySettings).one().password_min_length == 8


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------
def test_dentist_cannot_update(client, admin_user, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    assert_forbidden(client.put(f"{API}/settings/security", headers=headers, json=_policy()))


def test_unauthenticated_rejected(client):
    assert_status(client.get(f"{API}/settings/security"), 401)


# ---------------------------------------------------------------------------
# Validation (backend is the authority)
# ---------------------------------------------------------------------------
def test_min_length_below_range_rejected(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert_validation_error(
        client.put(f"{API}/settings/security", headers=headers, json=_policy(min_length=3))
    )


def test_expiration_above_range_rejected(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert_validation_error(
        client.put(f"{API}/settings/security", headers=headers, json=_policy(expiration_days=999))
    )


# ---------------------------------------------------------------------------
# 501 (prepared architecture) — never 404
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "method,path",
    [
        ("post", "/settings/security/logout-all"),
        ("get", "/settings/security/sessions"),
        ("delete", "/settings/security/sessions/abc"),
        ("post", "/settings/security/2fa/enable"),
        ("post", "/settings/security/2fa/disable"),
    ],
)
def test_prepared_endpoints_return_501(client, admin_user, method, path):
    headers = auth_headers(client, admin_user.email)
    resp = client.request(method, f"{API}{path}", headers=headers)
    assert_status(resp, 501)
    assert resp.json()["detail"]


def test_prepared_endpoints_still_enforce_rbac(client, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    assert_forbidden(client.post(f"{API}/settings/security/logout-all", headers=headers))


# ---------------------------------------------------------------------------
# Audit + no leaks
# ---------------------------------------------------------------------------
def test_update_records_audit(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/security", headers=headers, json=_policy())
    with session_factory() as s:
        logs = s.query(AuditLog).filter_by(entity_type="security_settings").all()
        assert logs
        assert logs[0].actor_user_id == admin_user.id


def test_audit_summary_endpoint(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/security", headers=headers, json=_policy())
    resp = client.get(f"{API}/settings/security/audit", headers=headers)
    assert_status(resp, 200)
    body = resp.json()
    assert "recent_events_count" in body
    assert body["recent_events_count"] >= 1  # the PUT above generated an event


def test_response_has_no_sensitive_fields(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    resp = client.put(f"{API}/settings/security", headers=headers, json=_policy())
    assert_no_sensitive_fields(resp.json())
