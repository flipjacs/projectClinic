"""Audit log integration tests.

There is no public endpoint to read audit logs (by design), so these tests
trigger actions through the real API and assert the persisted AuditLog rows at
the database level.
"""
from __future__ import annotations

import json

import pytest

from app.core.config import settings
from app.modules.audit.models import AuditLog
from app.shared import masking
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


# ---------------------------------------------------------------------------
# Masking helper (unit-level, no DB)
# ---------------------------------------------------------------------------
def test_masking_never_logs_password_fields():
    masked = masking.mask_mapping(
        {"name": "Ana", "password": "Senha12345", "password_hash": "$argon2id$..."}
    )
    assert "password" not in masked
    assert "password_hash" not in masked
    assert masked["name"] == "Ana"


def test_masking_obfuscates_cpf_phone_email():
    masked = masking.mask_mapping(
        {"cpf": "39053344705", "phone": "11988887777", "email": "joana@example.com"}
    )
    assert masked["cpf"] != "39053344705"
    assert masked["cpf"] == "***.***.447-**"  # only middle digits kept for traceability
    assert masked["phone"].endswith("7777")
    assert masked["email"].startswith("j") and "@example.com" in masked["email"]
    assert "joana" not in masked["email"]


def test_masking_redacts_free_clinical_text():
    masked = masking.mask_mapping({"diagnosis": "cárie profunda no dente 36"})
    assert "cárie" not in masked["diagnosis"]
    assert "redacted" in masked["diagnosis"]


# ---------------------------------------------------------------------------
# Masked diff persisted on sensitive updates
# ---------------------------------------------------------------------------
def test_patient_update_audit_masks_cpf_and_records_changed_fields(
    client, admin_user, db_session, session_factory
):
    patient = factories.create_patient(db_session, name="Diff Patient")
    headers = auth_headers(client, admin_user.email)
    new_cpf = factories.make_cpf(seed=777)

    resp = client.patch(
        f"{API}/patients/{patient.id}", headers=headers, json={"cpf": new_cpf, "name": "Renamed"}
    )
    assert resp.status_code == 200, resp.text

    logs = _logs(session_factory, action="patient.update", entity_id=patient.id)
    assert len(logs) == 1
    entry = logs[0]

    changed = json.loads(entry.changed_fields)
    assert set(changed) == {"cpf", "name"}

    after = json.loads(entry.masked_after)
    # The raw CPF must never be stored in the audit trail.
    assert new_cpf not in entry.masked_after
    assert after["cpf"] != new_cpf
    assert after["name"] == "Renamed"


def test_medical_record_update_audit_does_not_leak_clinical_text(
    client, dentist_user, patient, session_factory
):
    headers = auth_headers(client, dentist_user.email)
    record = client.post(
        f"{API}/patients/{patient.id}/medical-records",
        headers=headers,
        json={"visit_date": "2026-01-01", "main_complaint": "dor"},
    ).json()

    secret_dx = "tumor maligno confidencial"
    resp = client.patch(
        f"{API}/medical-records/{record['id']}", headers=headers, json={"diagnosis": secret_dx}
    )
    assert resp.status_code == 200, resp.text

    logs = _logs(session_factory, action="medical_record.update", entity_id=record["id"])
    entry = logs[0]
    # The clinical content must never appear in plaintext anywhere in the row.
    assert secret_dx not in (entry.masked_after or "")
    assert secret_dx not in (entry.masked_before or "")
    assert "diagnosis" in json.loads(entry.changed_fields)


# ---------------------------------------------------------------------------
# Request context capture (IP / User-Agent)
# ---------------------------------------------------------------------------
def test_audit_captures_request_ip_and_user_agent(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    headers["User-Agent"] = "pytest-suite/1.0"
    resp = client.post(
        f"{API}/patients",
        headers=headers,
        json={
            "name": "Context Patient",
            "cpf": factories.make_cpf(seed=888),
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

    entry = _logs(session_factory, action="patient.create", entity_id=patient_id)[0]
    assert entry.user_agent == "pytest-suite/1.0"
    assert entry.ip_address  # populated from the request (testclient -> testclient)


# ---------------------------------------------------------------------------
# Finance audit: payment & budget before/after
# ---------------------------------------------------------------------------
def test_payment_create_audit_records_after_state(client, admin_user, patient, session_factory):
    headers = auth_headers(client, admin_user.email)
    payment = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "amount": "120.00", "payment_method": "pix", "status": "pending"},
    ).json()

    entry = _logs(session_factory, action="payment.create", entity_id=payment["id"])[0]
    after = json.loads(entry.masked_after)
    assert after["status"] == "pending"
    assert after["amount"] == "120.00"


def test_payment_status_change_audit_has_before_after(client, admin_user, patient, session_factory):
    headers = auth_headers(client, admin_user.email)
    payment = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "amount": "50.00", "payment_method": "cash", "status": "pending"},
    ).json()
    client.patch(f"{API}/payments/{payment['id']}/status", headers=headers, json={"status": "paid"})

    entry = _logs(session_factory, action="payment.status_change", entity_id=payment["id"])[0]
    assert json.loads(entry.masked_before)["status"] == "pending"
    assert json.loads(entry.masked_after)["status"] == "paid"
    assert json.loads(entry.changed_fields) == ["status"]


def test_budget_create_and_cancel_write_audit(
    client, admin_user, dentist_user, patient, procedure, session_factory
):
    headers = auth_headers(client, admin_user.email)
    budget = client.post(
        f"{API}/budgets",
        headers=headers,
        json={
            "patient_id": patient.id,
            "dentist_id": dentist_user.id,
            "items": [{"procedure_id": procedure.id, "quantity": 1, "unit_price": "100.00"}],
        },
    ).json()

    create_entry = _logs(session_factory, action="budget.create", entity_id=budget["id"])[0]
    assert json.loads(create_entry.masked_after)["status"] == "draft"

    client.patch(f"{API}/budgets/{budget['id']}/cancel", headers=headers, json={"reason": "desistência"})
    cancel_entry = _logs(session_factory, action="budget.cancel", entity_id=budget["id"])[0]
    assert json.loads(cancel_entry.masked_before)["status"] == "draft"
    assert json.loads(cancel_entry.masked_after)["status"] == "canceled"


# ---------------------------------------------------------------------------
# Inventory audit: item & movement before/after
# ---------------------------------------------------------------------------
def test_inventory_item_create_and_update_audit(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    item = client.post(
        f"{API}/inventory/items",
        headers=headers,
        json={
            "name": "Anestésico",
            "category": "medication",
            "unit_of_measure": "unit",
            "current_quantity": "5.000",
            "minimum_quantity": "1.000",
        },
    ).json()

    create_entry = _logs(session_factory, action="inventory_item.create", entity_id=item["id"])[0]
    assert json.loads(create_entry.masked_after)["name"] == "Anestésico"

    client.patch(
        f"{API}/inventory/items/{item['id']}", headers=headers, json={"minimum_quantity": "2.000"}
    )
    upd_entry = _logs(session_factory, action="inventory_item.update", entity_id=item["id"])[0]
    assert "minimum_quantity" in json.loads(upd_entry.changed_fields)


def test_inventory_movement_audit_records_quantity_delta(
    client, admin_user, db_session, session_factory
):
    item = factories.create_inventory_item(db_session, name="Gaze", current="10.000")
    headers = auth_headers(client, admin_user.email)
    client.post(
        f"{API}/inventory/items/{item.id}/movements/out", headers=headers, json={"quantity": "3.000"}
    )

    entry = _logs(session_factory, action="inventory_movement.out", entity_id=item.id)[0]
    assert json.loads(entry.masked_before)["current_quantity"] == "10.000"
    after = json.loads(entry.masked_after)
    assert after["current_quantity"] == "7.000"
    assert after["movement_type"] == "out"


# ---------------------------------------------------------------------------
# Global invariant: no password hash ever lands in the audit table
# ---------------------------------------------------------------------------
def test_no_audit_row_ever_contains_password_hash(
    client, admin_user, session_factory
):
    headers = auth_headers(client, admin_user.email)
    # Create a user (exercises user.create audit path with a password in payload).
    resp = client.post(
        f"{API}/users",
        headers=headers,
        json={
            "name": "Audited Staff",
            "email": "audited-staff@clinic-test.com",
            "role": "receptionist",
            "password": "SuperSecret123",
        },
    )
    assert resp.status_code == 201, resp.text

    with session_factory() as s:
        rows = s.query(AuditLog).all()
    for row in rows:
        blob = " ".join(
            str(v or "")
            for v in (
                row.summary,
                row.metadata_json,
                row.changed_fields,
                row.masked_before,
                row.masked_after,
            )
        )
        assert "SuperSecret123" not in blob
        assert "password_hash" not in blob
        assert "$argon2" not in blob
