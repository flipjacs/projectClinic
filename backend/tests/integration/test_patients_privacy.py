"""Patient data privacy & soft-delete integration tests."""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.modules.patients.models import Patient
from tests.helpers import factories
from tests.helpers.asserts import assert_forbidden, assert_no_sensitive_fields
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


# ---------------------------------------------------------------------------
# Listing hides high-risk PII
# ---------------------------------------------------------------------------
def test_patient_list_does_not_expose_cpf_or_address(client, receptionist_user, patient):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.get(f"{API}/patients", headers=headers)
    assert resp.status_code == 200, resp.text
    items = resp.json()["items"]
    assert items, "expected at least one patient in the list"
    for item in items:
        assert "cpf" not in item
        assert "street" not in item
        assert "zip_code" not in item


def test_dashboard_does_not_expose_cpf_or_email(client, admin_user, patient):
    headers = auth_headers(client, admin_user.email)
    resp = client.get(f"{API}/dashboard", headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    for snapshot in body.get("most_recent_patients", []):
        assert "cpf" not in snapshot
        assert "email" not in snapshot
    assert_no_sensitive_fields(body)


# ---------------------------------------------------------------------------
# Patient export is ADMIN-only and includes CPF
# ---------------------------------------------------------------------------
def test_patient_export_with_cpf_is_admin_only(client, receptionist_user, dentist_user):
    assert_forbidden(client.get(f"{API}/reports/patients/export", headers=auth_headers(client, receptionist_user.email)))
    assert_forbidden(client.get(f"{API}/reports/patients/export", headers=auth_headers(client, dentist_user.email)))


def test_admin_patient_export_contains_cpf_column(client, admin_user, patient):
    headers = auth_headers(client, admin_user.email)
    resp = client.get(f"{API}/reports/patients/export", headers=headers)
    assert resp.status_code == 200, resp.text
    assert "cpf" in resp.text.splitlines()[0].lower()


# ---------------------------------------------------------------------------
# Soft delete
# ---------------------------------------------------------------------------
def test_inactive_patient_hidden_by_default_but_not_physically_deleted(
    client, admin_user, dentist_user, db_session, session_factory
):
    patient = factories.create_patient(db_session, name="ToDeactivate")

    # clinical staff performs the soft delete
    deact = client.patch(
        f"{API}/patients/{patient.id}/deactivate", headers=auth_headers(client, dentist_user.email)
    )
    assert deact.status_code == 200, deact.text

    headers = auth_headers(client, admin_user.email)
    default_list = client.get(f"{API}/patients", headers=headers).json()["items"]
    assert all(item["id"] != patient.id for item in default_list)

    # still retrievable with include_inactive=true
    with_inactive = client.get(f"{API}/patients?include_inactive=true", headers=headers).json()["items"]
    assert any(item["id"] == patient.id for item in with_inactive)

    # row is preserved in the database (soft delete, not physical delete)
    with session_factory() as s:
        row = s.get(Patient, patient.id)
        assert row is not None
        assert row.is_active is False
