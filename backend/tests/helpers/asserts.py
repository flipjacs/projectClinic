"""Reusable assertion helpers for common error responses and data exposure."""
from __future__ import annotations

from typing import Any


def assert_status(resp, expected: int) -> None:
    assert resp.status_code == expected, (
        f"expected {expected}, got {resp.status_code}: {resp.text}"
    )


def assert_unauthorized(resp) -> None:
    assert_status(resp, 401)


def assert_forbidden(resp) -> None:
    assert_status(resp, 403)


def assert_validation_error(resp) -> None:
    # Domain ValidationError -> 422; FastAPI body validation -> 422.
    assert resp.status_code == 422, f"expected 422, got {resp.status_code}: {resp.text}"


def assert_conflict(resp) -> None:
    assert_status(resp, 409)


def assert_not_found(resp) -> None:
    assert_status(resp, 404)


def _walk(value: Any):
    if isinstance(value, dict):
        for k, v in value.items():
            yield k
            yield from _walk(v)
    elif isinstance(value, list):
        for item in value:
            yield from _walk(item)


def assert_no_sensitive_fields(payload: Any) -> None:
    """Recursively assert no password/hash field leaks anywhere in the payload."""
    forbidden = {"password", "password_hash", "hashed_password"}
    leaked = [key for key in _walk(payload) if key in forbidden]
    assert not leaked, f"sensitive field(s) leaked in response: {leaked}"
