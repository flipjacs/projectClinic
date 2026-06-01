"""Authentication integration tests."""
from __future__ import annotations

from datetime import timedelta

import pytest

from app.core.config import settings
from app.core.security import create_access_token
from tests.helpers.asserts import assert_no_sensitive_fields, assert_unauthorized
from tests.helpers.auth import bearer

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


# --- successful login -------------------------------------------------------
def test_login_with_valid_credentials_returns_access_token(client, admin_user):
    resp = client.post(
        f"{API}/auth/login",
        data={"username": admin_user.email, "password": "Senha12345"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["expires_in"] == settings.access_token_expire_minutes * 60


def test_login_response_does_not_expose_password_hash(client, admin_user):
    resp = client.post(
        f"{API}/auth/login",
        data={"username": admin_user.email, "password": "Senha12345"},
    )
    assert_no_sensitive_fields(resp.json())


def test_me_endpoint_returns_current_user_without_password_hash(client, admin_user):
    headers = bearer(_token(client, admin_user.email))
    resp = client.get(f"{API}/auth/me", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == admin_user.email
    assert_no_sensitive_fields(body)


# --- invalid login (must be generic, no account enumeration) ----------------
def test_login_with_wrong_password_fails_generic(client, admin_user):
    resp = client.post(
        f"{API}/auth/login",
        data={"username": admin_user.email, "password": "WrongPass123"},
    )
    assert_unauthorized(resp)
    assert resp.json()["detail"] == "Credenciais inválidas"


def test_login_with_nonexistent_email_fails_with_same_message(client, admin_user):
    resp = client.post(
        f"{API}/auth/login",
        data={"username": "ghost@clinic-test.com", "password": "Senha12345"},
    )
    assert_unauthorized(resp)
    # Same generic message as wrong password -> no account enumeration.
    assert resp.json()["detail"] == "Credenciais inválidas"


def test_inactive_user_cannot_login_and_message_is_indistinguishable(client, inactive_user):
    resp = client.post(
        f"{API}/auth/login",
        data={"username": inactive_user.email, "password": "Senha12345"},
    )
    assert_unauthorized(resp)
    # Inactive must not be distinguishable from wrong credentials.
    assert resp.json()["detail"] == "Credenciais inválidas"


# --- token validation -------------------------------------------------------
def test_valid_token_allows_access_to_protected_route(client, admin_user):
    headers = bearer(_token(client, admin_user.email))
    resp = client.get(f"{API}/auth/me", headers=headers)
    assert resp.status_code == 200


def test_missing_token_is_rejected(client):
    resp = client.get(f"{API}/auth/me")
    assert_unauthorized(resp)


def test_expired_token_is_rejected(client, admin_user):
    expired = create_access_token(str(admin_user.id), expires_delta=timedelta(seconds=-5))
    resp = client.get(f"{API}/auth/me", headers=bearer(expired))
    assert_unauthorized(resp)


def test_malformed_token_is_rejected(client):
    resp = client.get(f"{API}/auth/me", headers=bearer("not-a-real-jwt"))
    assert_unauthorized(resp)


def test_refresh_typed_token_is_rejected_on_access_route(client, admin_user):
    # The app validates token "type" == "access"; a refresh-typed token must fail.
    from app.core.security import create_refresh_token

    refresh = create_refresh_token(str(admin_user.id))
    resp = client.get(f"{API}/auth/me", headers=bearer(refresh))
    assert_unauthorized(resp)


# --- deactivation invalidates an already-issued token -----------------------
def test_token_stops_working_after_user_is_deactivated(
    client, admin_user, receptionist_user
):
    # receptionist logs in and gets a valid token
    token = _token(client, receptionist_user.email)
    assert client.get(f"{API}/auth/me", headers=bearer(token)).status_code == 200

    # admin deactivates the receptionist
    admin_h = bearer(_token(client, admin_user.email))
    deact = client.patch(f"{API}/users/{receptionist_user.id}/deactivate", headers=admin_h)
    assert deact.status_code == 200

    # the previously valid token must now be rejected
    resp = client.get(f"{API}/auth/me", headers=bearer(token))
    assert_unauthorized(resp)


def _token(client, email: str) -> str:
    from tests.helpers.auth import login

    return login(client, email)
