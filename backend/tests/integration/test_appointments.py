"""Appointment scheduling integration tests.

Business rules asserted:
  * cannot schedule in the past / with inactive patient / inactive dentist;
  * overlapping appointments for the same dentist are rejected (adjacent ok);
  * different dentists may share the same slot;
  * rescheduling respects conflict, future window, original_start and counter;
  * status transitions follow the allowed state machine; terminal is terminal.
"""
from __future__ import annotations

from datetime import timedelta

import pytest

from app.core.config import settings
from app.modules.appointments.models import Appointment, AppointmentStatus
from app.shared.timezone import now_utc
from tests.helpers import factories
from tests.helpers.asserts import assert_conflict, assert_validation_error
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def _iso(dt):
    return dt.isoformat()


def _slot(hours_from_now: int, duration_min: int = 30):
    start = now_utc() + timedelta(hours=hours_from_now)
    end = start + timedelta(minutes=duration_min)
    return _iso(start), _iso(end)


def _create(client, headers, *, patient_id, dentist_id, start, end, reason=None):
    return client.post(
        f"{API}/appointments",
        headers=headers,
        json={
            "patient_id": patient_id,
            "dentist_id": dentist_id,
            "scheduled_start": start,
            "scheduled_end": end,
            "reason": reason,
        },
    )


# ---------------------------------------------------------------------------
# Creation
# ---------------------------------------------------------------------------
def test_valid_future_appointment_succeeds(client, admin_user, dentist_user, patient):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24)
    resp = _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "scheduled"


def test_cannot_create_appointment_in_the_past(client, admin_user, dentist_user, patient):
    headers = auth_headers(client, admin_user.email)
    start = _iso(now_utc() - timedelta(hours=2))
    end = _iso(now_utc() - timedelta(hours=1))
    resp = _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end)
    assert_validation_error(resp)


def test_cannot_create_appointment_with_inactive_patient(
    client, admin_user, dentist_user, db_session
):
    inactive = factories.create_patient(db_session, name="Inactive Pat", active=False)
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24)
    resp = _create(client, headers, patient_id=inactive.id, dentist_id=dentist_user.id, start=start, end=end)
    assert_validation_error(resp)


def test_cannot_create_appointment_with_inactive_dentist(
    client, admin_user, patient, db_session
):
    from app.core.permissions import Role

    inactive_dentist = factories.create_user(
        db_session, role=Role.DENTIST, email="deaddentist@clinic-test.com", active=False
    )
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24)
    resp = _create(client, headers, patient_id=patient.id, dentist_id=inactive_dentist.id, start=start, end=end)
    assert_validation_error(resp)


# ---------------------------------------------------------------------------
# Conflict detection
# ---------------------------------------------------------------------------
def test_overlapping_appointment_for_same_dentist_is_rejected(
    client, admin_user, dentist_user, patient, db_session, session_factory
):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24, 60)  # 60-minute slot
    assert _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end).status_code == 201

    other_patient = factories.create_patient(db_session, name="Other")
    # overlaps by 30 minutes
    o_start = _iso(now_utc() + timedelta(hours=24, minutes=30))
    o_end = _iso(now_utc() + timedelta(hours=25, minutes=30))
    resp = _create(client, headers, patient_id=other_patient.id, dentist_id=dentist_user.id, start=o_start, end=o_end)
    assert_conflict(resp)

    with session_factory() as s:
        assert s.query(Appointment).filter_by(dentist_id=dentist_user.id).count() == 1


def test_exact_same_slot_for_same_dentist_is_rejected(
    client, admin_user, dentist_user, patient, db_session
):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24, 60)
    assert _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end).status_code == 201
    other = factories.create_patient(db_session, name="Other2")
    resp = _create(client, headers, patient_id=other.id, dentist_id=dentist_user.id, start=start, end=end)
    assert_conflict(resp)


def test_adjacent_appointment_end_equals_next_start_is_allowed(
    client, admin_user, dentist_user, patient, db_session
):
    headers = auth_headers(client, admin_user.email)
    first_start = now_utc() + timedelta(hours=24)
    first_end = first_start + timedelta(minutes=30)
    assert _create(
        client, headers, patient_id=patient.id, dentist_id=dentist_user.id,
        start=_iso(first_start), end=_iso(first_end),
    ).status_code == 201

    other = factories.create_patient(db_session, name="Adjacent")
    second_start = first_end  # starts exactly when the first ends
    second_end = second_start + timedelta(minutes=30)
    resp = _create(
        client, headers, patient_id=other.id, dentist_id=dentist_user.id,
        start=_iso(second_start), end=_iso(second_end),
    )
    assert resp.status_code == 201, resp.text


def test_different_dentists_can_share_the_same_slot(
    client, admin_user, dentist_user, other_dentist_user, patient, db_session
):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24, 60)
    assert _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end).status_code == 201
    other = factories.create_patient(db_session, name="P2")
    resp = _create(client, headers, patient_id=other.id, dentist_id=other_dentist_user.id, start=start, end=end)
    assert resp.status_code == 201, resp.text


# ---------------------------------------------------------------------------
# Rescheduling
# ---------------------------------------------------------------------------
def test_reschedule_to_valid_future_time_updates_and_tracks_history(
    client, admin_user, dentist_user, patient, session_factory
):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24, 60)
    appt = _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end).json()

    new_start = now_utc() + timedelta(hours=48)
    new_end = new_start + timedelta(minutes=60)
    resp = client.patch(
        f"{API}/appointments/{appt['id']}/reschedule",
        headers=headers,
        json={"scheduled_start": _iso(new_start), "scheduled_end": _iso(new_end), "reason": "patient request"},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["rescheduled_count"] == 1
    assert body["original_start"] is not None

    with session_factory() as s:
        stored = s.get(Appointment, appt["id"])
        assert stored.rescheduled_count == 1
        assert stored.original_start is not None


def test_reschedule_to_conflicting_time_is_rejected(
    client, admin_user, dentist_user, patient, db_session
):
    headers = auth_headers(client, admin_user.email)
    # appointment A occupies hour 24..25
    a_start, a_end = _slot(24, 60)
    _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=a_start, end=a_end)

    # appointment B at hour 48..49
    other = factories.create_patient(db_session, name="B")
    b_start = now_utc() + timedelta(hours=48)
    b_end = b_start + timedelta(minutes=60)
    appt_b = _create(
        client, headers, patient_id=other.id, dentist_id=dentist_user.id,
        start=_iso(b_start), end=_iso(b_end),
    ).json()

    # try to move B onto A's slot -> conflict
    resp = client.patch(
        f"{API}/appointments/{appt_b['id']}/reschedule",
        headers=headers,
        json={"scheduled_start": a_start, "scheduled_end": a_end},
    )
    assert_conflict(resp)


# ---------------------------------------------------------------------------
# Status transitions
# ---------------------------------------------------------------------------
def test_valid_status_transition_succeeds(client, admin_user, dentist_user, patient):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24)
    appt = _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end).json()
    resp = client.patch(
        f"{API}/appointments/{appt['id']}/status", headers=headers, json={"status": "confirmed"}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["status"] == "confirmed"


def test_invalid_status_transition_is_rejected(
    client, admin_user, dentist_user, patient, session_factory
):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24)
    appt = _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end).json()
    # SCHEDULED -> COMPLETED is not allowed (must pass through IN_PROGRESS)
    resp = client.patch(
        f"{API}/appointments/{appt['id']}/status", headers=headers, json={"status": "completed"}
    )
    assert_validation_error(resp)
    with session_factory() as s:
        assert s.get(Appointment, appt["id"]).status == AppointmentStatus.SCHEDULED


def test_canceled_appointment_cannot_be_rescheduled(
    client, admin_user, dentist_user, patient
):
    headers = auth_headers(client, admin_user.email)
    start, end = _slot(24)
    appt = _create(client, headers, patient_id=patient.id, dentist_id=dentist_user.id, start=start, end=end).json()
    assert client.patch(f"{API}/appointments/{appt['id']}/cancel", headers=headers, json={}).status_code == 200

    new_start = now_utc() + timedelta(hours=72)
    new_end = new_start + timedelta(minutes=30)
    resp = client.patch(
        f"{API}/appointments/{appt['id']}/reschedule",
        headers=headers,
        json={"scheduled_start": _iso(new_start), "scheduled_end": _iso(new_end)},
    )
    assert_validation_error(resp)
