"""Real concurrency tests for the stock invariants (MySQL only).

Exercises the pessimistic lock (``SELECT ... FOR UPDATE`` on the inventory item
row) that serializes concurrent movements. On SQLite the lock is a no-op, so the
module is ``mysql_only``.

Core invariants under test:
    * ``current_quantity`` never goes negative;
    * every *valid* movement produces exactly one history row;
    * an *invalid* movement changes neither the quantity nor the history.
"""
from __future__ import annotations

import threading
from decimal import Decimal

import pytest
from sqlalchemy import func, select

from app.modules.inventory.models import InventoryItem, InventoryMovement
from app.modules.inventory.schemas import MovementCreate
from app.modules.inventory.service import InventoryMovementService
from app.shared.exceptions import ValidationError
from tests.helpers import factories
from tests.helpers.concurrency import run_concurrently

pytestmark = [pytest.mark.integration, pytest.mark.mysql_only]


def _qty(session_factory, item_id: int) -> Decimal:
    with session_factory() as s:
        return Decimal(s.get(InventoryItem, item_id).current_quantity)


def _movement_count(session_factory, item_id: int) -> int:
    with session_factory() as s:
        stmt = select(func.count(InventoryMovement.id)).where(
            InventoryMovement.inventory_item_id == item_id
        )
        return int(s.execute(stmt).scalar_one())


def test_two_concurrent_outs_cannot_drive_stock_negative(
    db_session, session_factory, admin_user
):
    """current=10, two threads each remove 7 → only one succeeds; never negative."""
    item = factories.create_inventory_item(db_session, name="Race Item", current="10.000")
    item_id = item.id
    actor_id = admin_user.id

    def worker(session):
        svc = InventoryMovementService(session)
        actor = session.get(type(admin_user), actor_id)
        svc.register_out(
            item_id=item_id, payload=MovementCreate(quantity=Decimal("7.000")), current_user=actor
        )
        return "ok"

    results = run_concurrently(session_factory=session_factory, worker=worker, n_threads=2)

    successes = [r for r in results if r == "ok"]
    failures = [r for r in results if isinstance(r, ValidationError)]
    assert len(successes) == 1, f"expected one success, got {results!r}"
    assert len(failures) == 1, f"expected one rejection, got {results!r}"

    assert _qty(session_factory, item_id) == Decimal("3.000")
    assert _qty(session_factory, item_id) >= 0
    # Exactly one valid movement was recorded.
    assert _movement_count(session_factory, item_id) == 1


def test_many_concurrent_outs_stop_at_zero(db_session, session_factory, admin_user):
    """current=100, ten threads each remove 25 → 4 succeed, balance hits 0."""
    item = factories.create_inventory_item(db_session, name="Bulk Item", current="100.000")
    item_id = item.id
    actor_id = admin_user.id

    def worker(session):
        svc = InventoryMovementService(session)
        actor = session.get(type(admin_user), actor_id)
        svc.register_out(
            item_id=item_id, payload=MovementCreate(quantity=Decimal("25.000")), current_user=actor
        )
        return "ok"

    results = run_concurrently(session_factory=session_factory, worker=worker, n_threads=10)

    successes = [r for r in results if r == "ok"]
    assert len(successes) == 4, f"100/25 = 4 max, got {len(successes)}"
    assert _qty(session_factory, item_id) == Decimal("0.000")
    assert _movement_count(session_factory, item_id) == 4


def test_concurrent_in_and_out_are_atomic(db_session, session_factory, admin_user):
    """current=10, one +5 and one -5 at the same time → final 10, two movements."""
    item = factories.create_inventory_item(db_session, name="InOut Item", current="10.000")
    item_id = item.id
    actor_id = admin_user.id
    barrier = threading.Barrier(2)
    errors: list[Exception] = []

    def op_in():
        session = session_factory()
        try:
            barrier.wait(timeout=30)
            svc = InventoryMovementService(session)
            actor = session.get(type(admin_user), actor_id)
            svc.register_in(
                item_id=item_id, payload=MovementCreate(quantity=Decimal("5.000")), current_user=actor
            )
        except Exception as exc:  # noqa: BLE001
            errors.append(exc)
        finally:
            session.close()

    def op_out():
        session = session_factory()
        try:
            barrier.wait(timeout=30)
            svc = InventoryMovementService(session)
            actor = session.get(type(admin_user), actor_id)
            svc.register_out(
                item_id=item_id, payload=MovementCreate(quantity=Decimal("5.000")), current_user=actor
            )
        except Exception as exc:  # noqa: BLE001
            errors.append(exc)
        finally:
            session.close()

    threads = [threading.Thread(target=op_in), threading.Thread(target=op_out)]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=30)

    assert not errors, f"both atomic movements should succeed, got {errors!r}"
    assert _qty(session_factory, item_id) == Decimal("10.000")
    assert _movement_count(session_factory, item_id) == 2


def test_invalid_movement_changes_neither_quantity_nor_history(
    db_session, session_factory, admin_user
):
    """An over-withdrawal must leave quantity and movement history untouched."""
    item = factories.create_inventory_item(db_session, name="Guard Item", current="10.000")
    item_id = item.id
    actor_id = admin_user.id

    with session_factory() as s:
        svc = InventoryMovementService(s)
        actor = s.get(type(admin_user), actor_id)
        with pytest.raises(ValidationError):
            svc.register_out(
                item_id=item_id,
                payload=MovementCreate(quantity=Decimal("999.000")),
                current_user=actor,
            )

    assert _qty(session_factory, item_id) == Decimal("10.000")
    assert _movement_count(session_factory, item_id) == 0
