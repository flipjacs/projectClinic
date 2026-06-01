"""Medical record access & integrity integration tests.

Business rules asserted:
  * dentist_id is derived from the token, never trusted from the client payload;
  * receptionist can neither create nor read clinical records;
  * inactive patient blocks record creation unless the author is ADMIN;
  * a dentist can read only their own records; admin can read any;
  * updating a record writes an audit log entry;
  * a record may only link to an appointment of the same patient.
"""
from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.core.config import settings
from app.modules.audit.models import AuditLog
from app.modules.medical_records.models import MedicalRecord
from app.shared.timezone import now_utc
from tests.helpers import factories
from tests.helpers.asserts import assert_forbidden, assert_validation_error
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def _record_payload(**overrides):
    payload = {
        "visit_date": date.today().isoformat(),
        "main_complaint": "Dor no dente",
        "diagnosis": "Carie",
    }
    payload.update(overrides)
    return payload


def _create_record(client, headers, patient_id, **overrides):
    return client.post(
        f"{API}/patients/{patient_id}/medical-records",
        headers=headers,
        json=_record_payload(**overrides),
    )


# ---------------------------------------------------------------------------
# Creation
# ---------------------------------------------------------------------------
def test_dentist_creates_record_and_dentist_id_comes_from_token(
    client, dentist_user, other_dentist_user, patient, session_factory
):
    headers = auth_headers(client, dentist_user.email)
    # Attempt to spoof dentist_id in the payload -> must be ignored.
    resp = _create_record(client, headers, patient.id, dentist_id=other_dentist_user.id)
    assert resp.status_code == 201, resp.text
    assert resp.json()["dentist_id"] == dentist_user.id

    with session_factory() as s:
        record = s.get(MedicalRecord, resp.json()["id"])
        assert record.dentist_id == dentist_user.id


def test_receptionist_cannot_create_medical_record(client, receptionist_user, patient):
    headers = auth_headers(client, receptionist_user.email)
    resp = _create_record(client, headers, patient.id)
    assert_forbidden(resp)


def test_inactive_patient_blocks_record_for_dentist(client, dentist_user, db_session):
    inactive = factories.create_patient(db_session, name="Inactive", active=False)
    headers = auth_headers(client, dentist_user.email)
    resp = _create_record(client, headers, inactive.id)
    assert_validation_error(resp)


def test_admin_can_create_record_for_inactive_patient(client, admin_user, db_session):
    inactive = factories.create_patient(db_session, name="Inactive2", active=False)
    headers = auth_headers(client, admin_user.email)
    resp = _create_record(client, headers, inactive.id)
    assert resp.status_code == 201, resp.text


# ---------------------------------------------------------------------------
# Access scope
# ---------------------------------------------------------------------------
def test_dentist_can_read_own_record(client, dentist_user, patient):
    headers = auth_headers(client, dentist_user.email)
    record = _create_record(client, headers, patient.id).json()
    resp = client.get(f"{API}/medical-records/{record['id']}", headers=headers)
    assert resp.status_code == 200, resp.text


def test_dentist_cannot_read_another_dentists_record(
    client, dentist_user, other_dentist_user, patient
):
    owner_headers = auth_headers(client, dentist_user.email)
    record = _create_record(client, owner_headers, patient.id).json()

    intruder_headers = auth_headers(client, other_dentist_user.email)
    resp = client.get(f"{API}/medical-records/{record['id']}", headers=intruder_headers)
    assert_forbidden(resp)


def test_admin_can_read_any_record(client, admin_user, dentist_user, patient):
    dentist_headers = auth_headers(client, dentist_user.email)
    record = _create_record(client, dentist_headers, patient.id).json()
    admin_headers = auth_headers(client, admin_user.email)
    resp = client.get(f"{API}/medical-records/{record['id']}", headers=admin_headers)
    assert resp.status_code == 200, resp.text


def test_receptionist_cannot_read_record(client, receptionist_user, dentist_user, patient):
    dentist_headers = auth_headers(client, dentist_user.email)
    record = _create_record(client, dentist_headers, patient.id).json()
    resp = client.get(
        f"{API}/medical-records/{record['id']}",
        headers=auth_headers(client, receptionist_user.email),
    )
    assert_forbidden(resp)


# ---------------------------------------------------------------------------
# Update + audit
# ---------------------------------------------------------------------------
def test_receptionist_cannot_update_record(client, receptionist_user, dentist_user, patient):
    dentist_headers = auth_headers(client, dentist_user.email)
    record = _create_record(client, dentist_headers, patient.id).json()
    resp = client.patch(
        f"{API}/medical-records/{record['id']}",
        headers=auth_headers(client, receptionist_user.email),
        json={"diagnosis": "tampered"},
    )
    assert_forbidden(resp)


def test_record_update_writes_audit_log(client, dentist_user, patient, session_factory):
    headers = auth_headers(client, dentist_user.email)
    record = _create_record(client, headers, patient.id).json()

    resp = client.patch(
        f"{API}/medical-records/{record['id']}",
        headers=headers,
        json={"diagnosis": "Carie profunda"},
    )
    assert resp.status_code == 200, resp.text

    with session_factory() as s:
        logs = (
            s.query(AuditLog)
            .filter(AuditLog.action == "medical_record.update", AuditLog.entity_id == record["id"])
            .all()
        )
        assert len(logs) == 1
        assert logs[0].actor_user_id == dentist_user.id
        # NOTE: current audit stores only changed field names, not before/after
        # diff values. TODO(phase-2): assert masked diff once implemented.


# ---------------------------------------------------------------------------
# Consultation link
# ---------------------------------------------------------------------------
def test_linking_record_to_appointment_of_another_patient_fails(
    client, admin_user, dentist_user, patient, db_session
):
    headers = auth_headers(client, dentist_user.email)

    # appointment belongs to a DIFFERENT patient
    other = factories.create_patient(db_session, name="Owner of appt")
    start = now_utc() + timedelta(hours=24)
    end = start + timedelta(minutes=30)
    appt = client.post(
        f"{API}/appointments",
        headers=auth_headers(client, admin_user.email),
        json={
            "patient_id": other.id,
            "dentist_id": dentist_user.id,
            "scheduled_start": start.isoformat(),
            "scheduled_end": end.isoformat(),
        },
    ).json()

    resp = _create_record(client, headers, patient.id, appointment_id=appt["id"])
    assert_validation_error(resp)
