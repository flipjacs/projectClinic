"""Real concurrency tests for the payment/budget invariants (MySQL only).

These exercise the pessimistic lock (``SELECT ... FOR UPDATE`` on the budget
row) that serializes concurrent payment creation/settlement against the same
budget. On SQLite the lock is a no-op, so the whole module is ``mysql_only``.

Core invariant under test:
    sum(non-canceled payments of a budget) <= budget.total_amount
must hold even when many transactions race to allocate the remaining balance.
"""
from __future__ import annotations

from decimal import Decimal

import pytest
from sqlalchemy import func, select

from app.core.permissions import Role
from app.modules.finance.models import (
    Budget,
    BudgetStatus,
    Payment,
    PaymentMethod,
    PaymentStatus,
)
from app.modules.finance.schemas import PaymentCreate
from app.modules.finance.service import PaymentService
from app.shared.exceptions import ValidationError
from tests.helpers import factories
from tests.helpers.concurrency import run_concurrently

pytestmark = [pytest.mark.integration, pytest.mark.mysql_only]


def _make_approved_budget(db_session, *, total: str) -> tuple[int, int, int]:
    """Create patient + dentist + an APPROVED budget; return their ids."""
    patient = factories.create_patient(db_session, name="Concurrency Patient")
    dentist = factories.create_user(db_session, role=Role.DENTIST)
    budget = Budget(
        patient_id=patient.id,
        dentist_id=dentist.id,
        status=BudgetStatus.APPROVED,
        total_amount=Decimal(total),
    )
    db_session.add(budget)
    db_session.commit()
    db_session.refresh(budget)
    return patient.id, dentist.id, budget.id


def _not_canceled_sum(session_factory, budget_id: int) -> Decimal:
    with session_factory() as s:
        stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.budget_id == budget_id,
            Payment.status != PaymentStatus.CANCELED,
        )
        return Decimal(s.execute(stmt).scalar_one())


def test_two_concurrent_payments_cannot_exceed_budget_total(
    db_session, session_factory, admin_user
):
    """Total=100, two threads each try to allocate 60 → only one may succeed."""
    patient_id, _dentist_id, budget_id = _make_approved_budget(db_session, total="100.00")
    actor_id = admin_user.id

    def worker(session):
        svc = PaymentService(session)
        actor = session.get(type(admin_user), actor_id)
        svc.create(
            PaymentCreate(
                patient_id=patient_id,
                budget_id=budget_id,
                amount=Decimal("60.00"),
                payment_method=PaymentMethod.PIX,
                status=PaymentStatus.PENDING,
            ),
            current_user=actor,
        )
        return "ok"

    results = run_concurrently(session_factory=session_factory, worker=worker, n_threads=2)

    successes = [r for r in results if r == "ok"]
    failures = [r for r in results if isinstance(r, ValidationError)]

    assert len(successes) == 1, f"expected exactly one success, got {results!r}"
    assert len(failures) == 1, f"expected one anti-overpayment rejection, got {results!r}"
    assert _not_canceled_sum(session_factory, budget_id) <= Decimal("100.00")


def test_many_concurrent_payments_stop_at_budget_total(
    db_session, session_factory, admin_user
):
    """Total=100, ten threads each try 25 → at most 4 succeed, sum never > 100."""
    patient_id, _dentist_id, budget_id = _make_approved_budget(db_session, total="100.00")
    actor_id = admin_user.id

    def worker(session):
        svc = PaymentService(session)
        actor = session.get(type(admin_user), actor_id)
        svc.create(
            PaymentCreate(
                patient_id=patient_id,
                budget_id=budget_id,
                amount=Decimal("25.00"),
                payment_method=PaymentMethod.PIX,
                status=PaymentStatus.PENDING,
            ),
            current_user=actor,
        )
        return "ok"

    results = run_concurrently(session_factory=session_factory, worker=worker, n_threads=10)

    successes = [r for r in results if r == "ok"]
    assert len(successes) == 4, f"100/25 = 4 allocations max, got {len(successes)}"
    assert _not_canceled_sum(session_factory, budget_id) == Decimal("100.00")


def test_canceled_payment_is_not_revenue_and_frees_room(
    db_session, session_factory, admin_user
):
    """Canceling a payment frees the allocated room and never counts as revenue."""
    patient_id, _dentist_id, budget_id = _make_approved_budget(db_session, total="100.00")
    actor_id = admin_user.id

    with session_factory() as s:
        svc = PaymentService(s)
        actor = s.get(type(admin_user), actor_id)
        first = svc.create(
            PaymentCreate(
                patient_id=patient_id,
                budget_id=budget_id,
                amount=Decimal("100.00"),
                payment_method=PaymentMethod.PIX,
                status=PaymentStatus.PAID,
            ),
            current_user=actor,
        )
        first_id = first.id

    # Budget is now full; a new 100 must be rejected.
    with session_factory() as s:
        svc = PaymentService(s)
        actor = s.get(type(admin_user), actor_id)
        with pytest.raises(ValidationError):
            svc.create(
                PaymentCreate(
                    patient_id=patient_id,
                    budget_id=budget_id,
                    amount=Decimal("100.00"),
                    payment_method=PaymentMethod.PIX,
                    status=PaymentStatus.PENDING,
                ),
                current_user=actor,
            )

    # Cancel the first; room is freed and the canceled payment is not revenue.
    from app.modules.finance.schemas import PaymentCancel

    with session_factory() as s:
        svc = PaymentService(s)
        actor = s.get(type(admin_user), actor_id)
        svc.cancel(
            payment_id=first_id,
            payload=PaymentCancel(cancellation_reason="estorno"),
            current_user=actor,
        )

    with session_factory() as s:
        svc = PaymentService(s)
        actor = s.get(type(admin_user), actor_id)
        again = svc.create(
            PaymentCreate(
                patient_id=patient_id,
                budget_id=budget_id,
                amount=Decimal("100.00"),
                payment_method=PaymentMethod.PIX,
                status=PaymentStatus.PAID,
            ),
            current_user=actor,
        )
        assert again.status == PaymentStatus.PAID

    assert _not_canceled_sum(session_factory, budget_id) == Decimal("100.00")
