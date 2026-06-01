"""RBAC / authorization integration tests for sensitive real endpoints.

All paths used here are the real route paths from the application. Each test
asserts the HTTP authorization outcome (200/201 allowed vs 403 forbidden).
"""
from __future__ import annotations

import pytest

from app.core.config import settings
from tests.helpers import factories
from tests.helpers.asserts import assert_forbidden
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


# ---------------------------------------------------------------------------
# RECEPTIONIST restrictions
# ---------------------------------------------------------------------------
def test_receptionist_cannot_access_medical_records(client, receptionist_user, patient):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.get(f"{API}/patients/{patient.id}/medical-records", headers=headers)
    assert_forbidden(resp)


def test_receptionist_cannot_read_patient_health_info(client, receptionist_user, patient):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.get(f"{API}/patients/{patient.id}/health-info", headers=headers)
    assert_forbidden(resp)


def test_receptionist_cannot_access_finance_revenue_report(client, receptionist_user):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.get(f"{API}/finance/revenue/monthly", headers=headers)
    assert_forbidden(resp)


def test_receptionist_cannot_export_patients_with_cpf(client, receptionist_user):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.get(f"{API}/reports/patients/export", headers=headers)
    assert_forbidden(resp)


def test_receptionist_cannot_perform_admin_inventory_adjustment(
    client, receptionist_user, inventory_item
):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.post(
        f"{API}/inventory/items/{inventory_item.id}/movements/adjustment",
        headers=headers,
        json={"quantity": "5.000", "reason": "manual correction"},
    )
    assert_forbidden(resp)


def test_receptionist_cannot_create_user(client, receptionist_user):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.post(
        f"{API}/users",
        headers=headers,
        json={
            "name": "New",
            "email": "new@clinic-test.com",
            "role": "receptionist",
            "password": "Senha12345",
        },
    )
    assert_forbidden(resp)


def test_receptionist_can_access_allowed_operational_routes(
    client, receptionist_user, patient
):
    headers = auth_headers(client, receptionist_user.email)
    # listing patients and appointments is an allowed operational flow
    assert client.get(f"{API}/patients", headers=headers).status_code == 200
    assert client.get(f"{API}/appointments", headers=headers).status_code == 200


# ---------------------------------------------------------------------------
# DENTIST restrictions
# ---------------------------------------------------------------------------
def test_dentist_cannot_manage_users(client, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    assert_forbidden(client.get(f"{API}/users", headers=headers))


def test_dentist_cannot_perform_inventory_adjustment(client, dentist_user, inventory_item):
    headers = auth_headers(client, dentist_user.email)
    resp = client.post(
        f"{API}/inventory/items/{inventory_item.id}/movements/adjustment",
        headers=headers,
        json={"quantity": "5.000", "reason": "manual correction"},
    )
    assert_forbidden(resp)


def test_dentist_can_access_clinical_routes(client, dentist_user, patient):
    headers = auth_headers(client, dentist_user.email)
    assert client.get(f"{API}/patients/{patient.id}/medical-records", headers=headers).status_code == 200
    assert client.get(f"{API}/finance/revenue/monthly", headers=headers).status_code == 200


# ---------------------------------------------------------------------------
# ADMIN capabilities
# ---------------------------------------------------------------------------
def test_admin_can_manage_users(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert client.get(f"{API}/users", headers=headers).status_code == 200


def test_admin_can_export_patients(client, admin_user, patient):
    headers = auth_headers(client, admin_user.email)
    resp = client.get(f"{API}/reports/patients/export", headers=headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]


def test_admin_can_access_finance_reports(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    assert client.get(f"{API}/finance/summary", headers=headers).status_code == 200


# ---------------------------------------------------------------------------
# Unauthenticated access is always rejected on sensitive routes
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/users"),
        ("get", "/patients"),
        ("get", "/appointments"),
        ("get", "/finance/summary"),
        ("get", "/inventory/items"),
        ("get", "/dashboard"),
    ],
)
def test_sensitive_routes_require_authentication(client, method, path):
    resp = getattr(client, method)(f"{API}{path}")
    assert resp.status_code == 401
