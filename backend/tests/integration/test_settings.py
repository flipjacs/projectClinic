"""Clinic settings integration tests: CRUD, RBAC, upload, validation, audit."""
from __future__ import annotations

import struct
import zlib

import pytest

from app.core.config import settings
from app.modules.audit.models import AuditLog
from app.modules.settings.models import ClinicScheduleDay, ClinicSettings
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


def _valid_payload(**overrides) -> dict:
    payload = {
        "name": "Clínica OdontoPrime",
        "trade_name": "OdontoPrime",
        "technical_director": "Dra. Ana Lima",
        "cro": "CRO-SP 45678",
        "phone": "1132654098",
        "whatsapp": "",
        "email": "contato@odontoprime.com.br",
        "website": "odontoprime.com.br",
        "address": {
            "zip_code": "01310100",
            "street": "Avenida Paulista",
            "number": "1000",
            "complement": "",
            "district": "Bela Vista",
            "city": "São Paulo",
            "state": "SP",
            "country": "Brasil",
        },
        "schedule": [
            {
                "weekday": 0,
                "enabled": True,
                "opens_at": "08:00",
                "closes_at": "18:00",
                "break_starts_at": "12:00",
                "break_ends_at": "13:00",
            },
            {"weekday": 6, "enabled": False, "opens_at": "08:00", "closes_at": "12:00"},
        ],
        "notes": {
            "observations": "obs interna",
            "default_message": "",
            "pdf_footer": "",
            "institutional_description": "",
        },
    }
    payload.update(overrides)
    return payload


def _png_bytes() -> bytes:
    """Minimal valid 1x1 PNG (correct signature + IHDR/IDAT/IEND)."""
    sig = b"\x89PNG\r\n\x1a\n"

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    idat = zlib.compress(b"\x00\x00\x00\x00")
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


# ---------------------------------------------------------------------------
# CRUD + persistence
# ---------------------------------------------------------------------------
def test_get_returns_404_before_anything_saved(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert_not_found(client.get(f"{API}/settings/clinic", headers=headers))


def test_put_creates_and_get_persists(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.put(f"{API}/settings/clinic", headers=headers, json=_valid_payload())
    assert_status(resp, 200)
    body = resp.json()
    assert body["name"] == "Clínica OdontoPrime"
    assert body["address"]["city"] == "São Paulo"
    assert len(body["schedule"]) == 2

    # Survives a fresh read (persisted).
    got = client.get(f"{API}/settings/clinic", headers=headers).json()
    assert got["trade_name"] == "OdontoPrime"
    assert got["notes"]["observations"] == "obs interna"

    # Relational schedule rows really exist.
    with session_factory() as s:
        clinic = s.query(ClinicSettings).one()
        days = s.query(ClinicScheduleDay).filter_by(clinic_id=clinic.id).all()
        assert len(days) == 2
        assert {d.weekday for d in days} == {0, 6}


def test_put_is_idempotent_singleton(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/clinic", headers=headers, json=_valid_payload())
    client.put(
        f"{API}/settings/clinic",
        headers=headers,
        json=_valid_payload(trade_name="Renomeado"),
    )
    with session_factory() as s:
        assert s.query(ClinicSettings).count() == 1  # single row, never duplicated
        assert s.query(ClinicSettings).one().trade_name == "Renomeado"


# ---------------------------------------------------------------------------
# RBAC
# ---------------------------------------------------------------------------
def test_dentist_cannot_update(client, admin_user, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    assert_forbidden(
        client.put(f"{API}/settings/clinic", headers=headers, json=_valid_payload())
    )


def test_dentist_can_view(client, admin_user, dentist_user):
    client.put(
        f"{API}/settings/clinic",
        headers=auth_headers(client, admin_user.email),
        json=_valid_payload(),
    )
    resp = client.get(
        f"{API}/settings/clinic", headers=auth_headers(client, dentist_user.email)
    )
    assert_status(resp, 200)


def test_unauthenticated_is_rejected(client):
    assert_status(client.get(f"{API}/settings/clinic"), 401)


# ---------------------------------------------------------------------------
# Validation (backend is the authority)
# ---------------------------------------------------------------------------
def test_invalid_state_rejected(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    payload = _valid_payload()
    payload["address"]["state"] = "XX"
    assert_validation_error(client.put(f"{API}/settings/clinic", headers=headers, json=payload))


def test_invalid_time_rejected(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    payload = _valid_payload()
    payload["schedule"][0]["opens_at"] = "25:99"
    assert_validation_error(client.put(f"{API}/settings/clinic", headers=headers, json=payload))


def test_duplicate_weekday_rejected(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    payload = _valid_payload()
    payload["schedule"] = [
        {"weekday": 0, "enabled": True, "opens_at": "08:00", "closes_at": "18:00"},
        {"weekday": 0, "enabled": True, "opens_at": "09:00", "closes_at": "17:00"},
    ]
    assert_validation_error(client.put(f"{API}/settings/clinic", headers=headers, json=payload))


# ---------------------------------------------------------------------------
# Logo upload
# ---------------------------------------------------------------------------
def test_logo_upload_and_remove(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.post(
        f"{API}/settings/clinic/logo",
        headers=headers,
        data={"kind": "logo"},
        files={"file": ("logo.png", _png_bytes(), "image/png")},
    )
    assert_status(resp, 201)
    assert resp.json()["url"].endswith(".png")
    with session_factory() as s:
        assert s.query(ClinicSettings).one().logo_path is not None

    # Remove it.
    assert_status(
        client.request("DELETE", f"{API}/settings/clinic/logo?kind=logo", headers=headers),
        204,
    )
    with session_factory() as s:
        assert s.query(ClinicSettings).one().logo_path is None


def test_logo_rejects_non_image(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    resp = client.post(
        f"{API}/settings/clinic/logo",
        headers=headers,
        data={"kind": "logo"},
        files={"file": ("x.png", b"not an image", "image/png")},
    )
    assert_validation_error(resp)


def test_logo_rejects_active_svg_xss(client, admin_user):
    """SVG com <script> deve ser rejeitado (defesa contra XSS via upload)."""
    headers = auth_headers(client, admin_user.email)
    evil = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    resp = client.post(
        f"{API}/settings/clinic/logo",
        headers=headers,
        data={"kind": "logo"},
        files={"file": ("logo.svg", evil, "image/svg+xml")},
    )
    assert_validation_error(resp)


def test_logo_accepts_clean_svg(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    clean = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>'
    resp = client.post(
        f"{API}/settings/clinic/logo",
        headers=headers,
        data={"kind": "logo"},
        files={"file": ("logo.svg", clean, "image/svg+xml")},
    )
    assert_status(resp, 201)


def test_logo_upload_forbidden_for_dentist(client, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    resp = client.post(
        f"{API}/settings/clinic/logo",
        headers=headers,
        data={"kind": "logo"},
        files={"file": ("logo.png", _png_bytes(), "image/png")},
    )
    assert_forbidden(resp)


# ---------------------------------------------------------------------------
# Audit + no data leaks
# ---------------------------------------------------------------------------
def test_update_records_audit_with_diff(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/clinic", headers=headers, json=_valid_payload())
    with session_factory() as s:
        logs = s.query(AuditLog).filter_by(entity_type="clinic_settings").all()
        assert logs, "expected an audit log entry"
        assert logs[0].actor_user_id == admin_user.id
        assert logs[0].action in {"clinic_settings.create", "clinic_settings.update"}


def test_response_has_no_sensitive_fields(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    resp = client.put(f"{API}/settings/clinic", headers=headers, json=_valid_payload())
    assert_no_sensitive_fields(resp.json())
