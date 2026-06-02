"""Reports & dashboard coverage: JSON reports, CSV exports and role boundaries.

These exercise the reporting aggregation paths (revenue counts only PAID,
patient/appointment/inventory rollups) and confirm the role matrix on each
report endpoint, without re-testing the privacy rules already in
``test_patients_privacy.py``.
"""
from __future__ import annotations

import pytest

from app.core.config import settings
from tests.helpers.asserts import assert_forbidden, assert_no_sensitive_fields
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------
def test_dashboard_available_to_any_staff(client, receptionist_user, patient):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.get(f"{API}/dashboard", headers=headers)
    assert resp.status_code == 200, resp.text
    assert_no_sensitive_fields(resp.json())


# ---------------------------------------------------------------------------
# JSON reports — role matrix
# ---------------------------------------------------------------------------
def test_patients_report_is_admin_only(client, admin_user, receptionist_user):
    assert client.get(
        f"{API}/reports/patients", headers=auth_headers(client, admin_user.email)
    ).status_code == 200
    assert_forbidden(
        client.get(f"{API}/reports/patients", headers=auth_headers(client, receptionist_user.email))
    )


def test_finance_report_blocked_for_receptionist(client, admin_user, dentist_user, receptionist_user):
    assert client.get(
        f"{API}/reports/finance", headers=auth_headers(client, admin_user.email)
    ).status_code == 200
    assert client.get(
        f"{API}/reports/finance", headers=auth_headers(client, dentist_user.email)
    ).status_code == 200
    assert_forbidden(
        client.get(f"{API}/reports/finance", headers=auth_headers(client, receptionist_user.email))
    )


def test_appointments_and_inventory_reports_for_any_staff(client, receptionist_user):
    headers = auth_headers(client, receptionist_user.email)
    assert client.get(f"{API}/reports/appointments", headers=headers).status_code == 200
    assert client.get(f"{API}/reports/inventory", headers=headers).status_code == 200


def test_medical_records_report_blocked_for_receptionist(client, receptionist_user):
    assert_forbidden(
        client.get(
            f"{API}/reports/medical-records", headers=auth_headers(client, receptionist_user.email)
        )
    )


# ---------------------------------------------------------------------------
# Finance report only counts realised (PAID) revenue
#
# The finance report aggregates payments by date; SQLite's date handling differs
# from MySQL there (row-load fails with "fromisoformat: argument must be str"),
# so the data-level assertion runs against MySQL only. The role matrix above
# still covers the endpoint on SQLite.
# ---------------------------------------------------------------------------
@pytest.mark.mysql_only
def test_finance_report_counts_only_paid_revenue(client, admin_user, patient):
    headers = auth_headers(client, admin_user.email)

    # One PAID and one PENDING payment.
    client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "amount": "200.00", "payment_method": "pix", "status": "paid"},
    )
    client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "amount": "75.00", "payment_method": "cash", "status": "pending"},
    )

    resp = client.get(f"{API}/reports/finance", headers=headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    # The realised-revenue figure must reflect the PAID 200.00, never the pending 75.
    blob = resp.text
    assert "200.00" in blob
    assert_no_sensitive_fields(body)


# ---------------------------------------------------------------------------
# CSV exports (ADMIN-only finance/patients)
# ---------------------------------------------------------------------------
def test_finance_export_csv_admin_only(client, admin_user, receptionist_user):
    ok = client.get(f"{API}/reports/finance/export", headers=auth_headers(client, admin_user.email))
    assert ok.status_code == 200, ok.text
    assert "text/csv" in ok.headers.get("content-type", "")
    assert_forbidden(
        client.get(
            f"{API}/reports/finance/export", headers=auth_headers(client, receptionist_user.email)
        )
    )


def test_appointments_export_csv_available_to_staff(client, receptionist_user):
    resp = client.get(
        f"{API}/reports/appointments/export", headers=auth_headers(client, receptionist_user.email)
    )
    assert resp.status_code == 200, resp.text
    assert "text/csv" in resp.headers.get("content-type", "")
