"""Notification settings integration tests: CRUD, RBAC, validation, audit."""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.modules.audit.models import AuditLog
from app.modules.settings.notification_models import NotificationSettings
from tests.helpers.asserts import (
    assert_forbidden,
    assert_not_found,
    assert_status,
    assert_validation_error,
)
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def _payload(**group_overrides) -> dict:
    body = {
        "appointments": {
            "remind_24h": True,
            "remind_2h": True,
            "remind_30min": False,
            "confirmation_message": True,
        },
        "finance": {
            "payment_overdue": True,
            "payment_received": True,
            "new_budget": False,
            "reminder_cancelled": True,
        },
        "inventory": {
            "low_stock": True,
            "product_expiring": False,
            "auto_replenishment": True,
        },
        "system": {
            "updates": True,
            "critical_failures": True,
            "backup_completed": False,
            "integrations": False,
        },
    }
    for group, fields in group_overrides.items():
        body[group].update(fields)
    return body


# ---------------------------------------------------------------------------
# CRUD + persistence
# ---------------------------------------------------------------------------
def test_get_returns_404_before_anything_saved(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert_not_found(client.get(f"{API}/settings/notifications", headers=headers))


def test_put_creates_and_persists(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.put(f"{API}/settings/notifications", headers=headers, json=_payload())
    assert_status(resp, 200)
    body = resp.json()
    assert body["appointments"]["remind_2h"] is True
    assert body["inventory"]["auto_replenishment"] is True

    got = client.get(f"{API}/settings/notifications", headers=headers).json()
    assert got["finance"]["new_budget"] is False
    assert got["system"]["updates"] is True

    with session_factory() as s:
        assert s.query(NotificationSettings).count() == 1


def test_put_is_idempotent_singleton(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/notifications", headers=headers, json=_payload())
    client.put(
        f"{API}/settings/notifications",
        headers=headers,
        json=_payload(system={"updates": False}),
    )
    with session_factory() as s:
        rows = s.query(NotificationSettings).all()
        assert len(rows) == 1
        assert rows[0].system_updates is False


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------
def test_dentist_cannot_update(client, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    assert_forbidden(
        client.put(f"{API}/settings/notifications", headers=headers, json=_payload())
    )


def test_dentist_can_read_after_admin_saves(client, admin_user, dentist_user):
    client.put(
        f"{API}/settings/notifications",
        headers=auth_headers(client, admin_user.email),
        json=_payload(),
    )
    resp = client.get(
        f"{API}/settings/notifications", headers=auth_headers(client, dentist_user.email)
    )
    assert_status(resp, 200)


def test_unauthenticated_rejected(client):
    assert_status(client.get(f"{API}/settings/notifications"), 401)


# ---------------------------------------------------------------------------
# Validation (backend is the authority) — full payload required, no partials.
# ---------------------------------------------------------------------------
def test_missing_group_rejected(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    payload = _payload()
    del payload["finance"]
    assert_validation_error(
        client.put(f"{API}/settings/notifications", headers=headers, json=payload)
    )


def test_non_boolean_rejected(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert_validation_error(
        client.put(
            f"{API}/settings/notifications",
            headers=headers,
            json=_payload(appointments={"remind_24h": "banana"}),
        )
    )


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------
def test_update_records_audit(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/notifications", headers=headers, json=_payload())
    with session_factory() as s:
        logs = s.query(AuditLog).filter_by(entity_type="notification_settings").all()
        assert logs
        assert logs[0].actor_user_id == admin_user.id
