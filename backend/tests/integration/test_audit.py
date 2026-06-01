"""Audit log integration tests.

There is no public endpoint to read audit logs (by design), so these tests
trigger actions through the real API and assert the persisted AuditLog rows at
the database level.
"""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.modules.audit.models import AuditLog
from tests.helpers import factories
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def _logs(session_factory, *, action=None, entity_type=None, entity_id=None):
    with session_factory() as s:
        q = s.query(AuditLog)
        if action is not None:
            q = q.filter(AuditLog.action == action)
        if entity_type is not None:
            q = q.filter(AuditLog.entity_type == entity_type)
        if entity_id is not None:
            q = q.filter(AuditLog.entity_id == entity_id)
        return q.all()


def test_creating_patient_writes_audit_entry(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.post(
        f"{API}/patients",
        headers=headers,
        json={
            "name": "Audited Patient",
            "cpf": factories.make_cpf(),
            "birth_date": "1990-01-01",
            "phone": "11999990000",
            "street": "Rua A",
            "number": "1",
            "neighborhood": "Centro",
            "city": "Goiania",
            "state": "GO",
            "zip_code": "74000000",
        },
    )
    assert resp.status_code == 201, resp.text
    patient_id = resp.json()["id"]

    logs = _logs(session_factory, action="patient.create", entity_id=patient_id)
    assert len(logs) == 1
    entry = logs[0]
    assert entry.actor_user_id == admin_user.id
    assert entry.entity_type == "patient"


def test_payment_status_change_writes_audit_entry(
    client, admin_user, patient, session_factory
):
    headers = auth_headers(client, admin_user.email)
    payment = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "amount": "50.00", "payment_method": "pix", "status": "pending"},
    ).json()

    resp = client.patch(
        f"{API}/payments/{payment['id']}/status", headers=headers, json={"status": "paid"}
    )
    assert resp.status_code == 200, resp.text

    logs = _logs(session_factory, action="payment.status_change", entity_id=payment["id"])
    assert len(logs) == 1
    assert logs[0].actor_user_id == admin_user.id
    assert logs[0].entity_type == "payment"


def test_stock_movement_writes_audit_entry(client, admin_user, db_session, session_factory):
    item = factories.create_inventory_item(db_session, name="Audited Item", current="10.000")
    headers = auth_headers(client, admin_user.email)

    resp = client.post(
        f"{API}/inventory/items/{item.id}/movements/out", headers=headers, json={"quantity": "2.000"}
    )
    assert resp.status_code == 201, resp.text

    logs = _logs(session_factory, entity_type="inventory_item", entity_id=item.id)
    actions = {log.action for log in logs}
    assert "inventory_movement.out" in actions
    assert all(log.actor_user_id == admin_user.id for log in logs)


def test_medical_record_update_writes_audit_entry(
    client, dentist_user, patient, session_factory
):
    headers = auth_headers(client, dentist_user.email)
    record = client.post(
        f"{API}/patients/{patient.id}/medical-records",
        headers=headers,
        json={"visit_date": "2026-01-01", "main_complaint": "dor"},
    ).json()

    resp = client.patch(
        f"{API}/medical-records/{record['id']}", headers=headers, json={"diagnosis": "X"}
    )
    assert resp.status_code == 200, resp.text

    logs = _logs(session_factory, action="medical_record.update", entity_id=record["id"])
    assert len(logs) == 1
    assert logs[0].actor_user_id == dentist_user.id
