"""Authentication helpers for integration tests."""
from __future__ import annotations

from app.core.config import settings

from tests.helpers.factories import DEFAULT_PASSWORD

API = settings.api_v1_prefix


def login(client, email: str, password: str = DEFAULT_PASSWORD) -> str:
    """Perform the real OAuth2 password login and return the access token."""
    resp = client.post(
        f"{API}/auth/login",
        data={"username": email, "password": password},
    )
    assert resp.status_code == 200, f"login failed for {email}: {resp.status_code} {resp.text}"
    body = resp.json()
    assert "access_token" in body
    return body["access_token"]


def auth_headers(client, email: str, password: str = DEFAULT_PASSWORD) -> dict[str, str]:
    return {"Authorization": f"Bearer {login(client, email, password)}"}


def bearer(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
