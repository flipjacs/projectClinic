"""Financial invariant integration tests (budgets & payments).

These assert business rules, not the current implementation:
  * total is always computed on the backend from items;
  * payments can never exceed the budget total;
  * only PAID payments count as revenue;
  * non-payable budgets reject payments;
  * invalid/terminal status transitions are rejected;
  * monetary values keep Decimal precision (no float drift).
"""
from __future__ import annotations

from decimal import Decimal

import pytest

from app.core.config import settings
from app.modules.finance.models import Payment, PaymentStatus
from tests.helpers.asserts import assert_not_found, assert_validation_error
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def _create_budget(client, headers, *, patient_id, dentist_id, items, extra=None):
    payload = {"patient_id": patient_id, "dentist_id": dentist_id, "items": items}
    if extra:
        payload.update(extra)
    return client.post(f"{API}/budgets", headers=headers, json=payload)


# ---------------------------------------------------------------------------
# Budget total is calculated on the backend
# ---------------------------------------------------------------------------
def test_budget_total_is_calculated_on_backend(
    client, admin_user, dentist_user, patient, procedure, session_factory
):
    headers = auth_headers(client, admin_user.email)
    resp = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[{"procedure_id": procedure.id, "quantity": 2, "unit_price": "30.00"}],
        # A malicious/incorrect client-provided total must be ignored entirely.
        extra={"total_amount": "1.00"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert Decimal(body["total_amount"]) == Decimal("60.00")

    with session_factory() as s:
        from app.modules.finance.models import Budget

        budget = s.get(Budget, body["id"])
        assert budget.total_amount == Decimal("60.00")
        assert sum(i.total_price for i in budget.items) == Decimal("60.00")


def test_budget_total_uses_procedure_base_price_when_unit_price_omitted(
    client, admin_user, dentist_user, patient, procedure
):
    headers = auth_headers(client, admin_user.email)
    resp = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[{"procedure_id": procedure.id, "quantity": 3}],  # base_price 100.00
    )
    assert resp.status_code == 201, resp.text
    assert Decimal(resp.json()["total_amount"]) == Decimal("300.00")


def test_budget_total_keeps_decimal_precision_no_float_drift(
    client, admin_user, dentist_user, patient, db_session
):
    # 0.10 + 0.20 must equal 0.30 exactly (float would give 0.30000000000000004).
    from tests.helpers import factories

    p1 = factories.create_procedure(db_session, name="P010", base_price="0.10")
    p2 = factories.create_procedure(db_session, name="P020", base_price="0.20")

    headers = auth_headers(client, admin_user.email)
    resp = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[
            {"procedure_id": p1.id, "quantity": 1},
            {"procedure_id": p2.id, "quantity": 1},
        ],
    )
    assert resp.status_code == 201, resp.text
    assert Decimal(resp.json()["total_amount"]) == Decimal("0.30")


# ---------------------------------------------------------------------------
# Payment anti-overpayment
# ---------------------------------------------------------------------------
def test_payment_cannot_exceed_budget_total(
    client, admin_user, dentist_user, patient, procedure, session_factory
):
    headers = auth_headers(client, admin_user.email)
    budget = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[{"procedure_id": procedure.id, "quantity": 1, "unit_price": "100.00"}],
    ).json()

    first = client.post(
        f"{API}/payments",
        headers=headers,
        json={
            "patient_id": patient.id,
            "budget_id": budget["id"],
            "amount": "60.00",
            "payment_method": "pix",
        },
    )
    assert first.status_code == 201, first.text

    # second payment would push the not-canceled total to 110 > 100 -> rejected
    second = client.post(
        f"{API}/payments",
        headers=headers,
        json={
            "patient_id": patient.id,
            "budget_id": budget["id"],
            "amount": "50.00",
            "payment_method": "cash",
        },
    )
    assert_validation_error(second)

    # DB must remain consistent: only the first payment persisted for this budget
    with session_factory() as s:
        payments = s.query(Payment).filter(Payment.budget_id == budget["id"]).all()
        assert len(payments) == 1
        assert payments[0].amount == Decimal("60.00")


def test_exact_remaining_amount_is_accepted(
    client, admin_user, dentist_user, patient, procedure
):
    headers = auth_headers(client, admin_user.email)
    budget = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[{"procedure_id": procedure.id, "quantity": 1, "unit_price": "100.00"}],
    ).json()

    client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "budget_id": budget["id"], "amount": "60.00", "payment_method": "pix"},
    )
    second = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "budget_id": budget["id"], "amount": "40.00", "payment_method": "cash"},
    )
    assert second.status_code == 201, second.text


# ---------------------------------------------------------------------------
# Revenue counts only PAID payments
# ---------------------------------------------------------------------------
def test_only_paid_payments_count_as_revenue(
    client, admin_user, dentist_user, patient, procedure
):
    headers = auth_headers(client, admin_user.email)
    budget = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[{"procedure_id": procedure.id, "quantity": 1, "unit_price": "100.00"}],
    ).json()

    # one PAID (counts) and one PENDING (must not count)
    client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "budget_id": budget["id"], "amount": "70.00",
              "payment_method": "pix", "status": "paid"},
    )
    client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "budget_id": budget["id"], "amount": "30.00",
              "payment_method": "cash", "status": "pending"},
    )

    report = client.get(f"{API}/finance/revenue/monthly", headers=headers)
    assert report.status_code == 200, report.text
    body = report.json()
    assert Decimal(body["total_paid"]) == Decimal("70.00")
    assert body["number_of_payments"] == 1


# ---------------------------------------------------------------------------
# Non-payable budgets reject payments
# ---------------------------------------------------------------------------
def test_payment_rejected_for_canceled_budget(
    client, admin_user, dentist_user, patient, procedure, session_factory
):
    headers = auth_headers(client, admin_user.email)
    budget = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[{"procedure_id": procedure.id, "quantity": 1, "unit_price": "100.00"}],
    ).json()

    cancel = client.patch(f"{API}/budgets/{budget['id']}/cancel", headers=headers, json={})
    assert cancel.status_code == 200, cancel.text

    resp = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "budget_id": budget["id"], "amount": "10.00", "payment_method": "pix"},
    )
    assert_validation_error(resp)

    with session_factory() as s:
        assert s.query(Payment).filter(Payment.budget_id == budget["id"]).count() == 0


def test_payment_rejected_for_rejected_budget(
    client, admin_user, dentist_user, patient, procedure
):
    headers = auth_headers(client, admin_user.email)
    budget = _create_budget(
        client,
        headers,
        patient_id=patient.id,
        dentist_id=dentist_user.id,
        items=[{"procedure_id": procedure.id, "quantity": 1, "unit_price": "100.00"}],
    ).json()
    assert client.patch(f"{API}/budgets/{budget['id']}/reject", headers=headers).status_code == 200

    resp = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "budget_id": budget["id"], "amount": "10.00", "payment_method": "pix"},
    )
    assert_validation_error(resp)


def test_payment_for_nonexistent_budget_fails(client, admin_user, patient):
    headers = auth_headers(client, admin_user.email)
    resp = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "budget_id": 999999, "amount": "10.00", "payment_method": "pix"},
    )
    assert_not_found(resp)


# ---------------------------------------------------------------------------
# Payment status transitions
# ---------------------------------------------------------------------------
def test_invalid_payment_status_transition_is_rejected(
    client, admin_user, patient, session_factory
):
    headers = auth_headers(client, admin_user.email)
    payment = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "amount": "50.00", "payment_method": "pix", "status": "paid"},
    ).json()

    # PAID -> PENDING is not an allowed transition (PAID only -> CANCELED)
    resp = client.patch(
        f"{API}/payments/{payment['id']}/status",
        headers=headers,
        json={"status": "pending"},
    )
    assert_validation_error(resp)

    with session_factory() as s:
        assert s.get(Payment, payment["id"]).status == PaymentStatus.PAID


def test_canceled_payment_is_terminal(client, admin_user, patient, session_factory):
    headers = auth_headers(client, admin_user.email)
    payment = client.post(
        f"{API}/payments",
        headers=headers,
        json={"patient_id": patient.id, "amount": "50.00", "payment_method": "pix", "status": "pending"},
    ).json()

    assert client.patch(
        f"{API}/payments/{payment['id']}/cancel", headers=headers, json={}
    ).status_code == 200

    # moving away from CANCELED must fail
    resp = client.patch(
        f"{API}/payments/{payment['id']}/status", headers=headers, json={"status": "paid"}
    )
    assert_validation_error(resp)
    with session_factory() as s:
        assert s.get(Payment, payment["id"]).status == PaymentStatus.CANCELED


# TODO(concurrency): the anti-overpayment guard relies on SELECT ... FOR UPDATE,
# which is a no-op on SQLite. Add a true concurrency stress test (two parallel
# payments racing for the last remaining amount) when running against MySQL via
# TEST_DATABASE_URL to prove the row lock serializes them.
