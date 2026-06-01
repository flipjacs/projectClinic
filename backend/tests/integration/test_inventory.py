"""Inventory invariant integration tests.

Business rules asserted:
  * stock-out cannot exceed available quantity / cannot go negative;
  * a failed movement mutates neither the balance nor the movement log;
  * a successful movement updates the balance and writes an immutable movement;
  * adjustment is ADMIN-only;
  * movements are immutable by design (no edit/delete endpoints);
  * low-stock and expiring alerts behave correctly.
"""
from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal

import pytest

from app.core.config import settings
from app.modules.inventory.models import InventoryItem, InventoryMovement
from tests.helpers import factories
from tests.helpers.asserts import assert_forbidden, assert_validation_error
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


# ---------------------------------------------------------------------------
# Stock out cannot exceed available / go negative
# ---------------------------------------------------------------------------
def test_inventory_out_cannot_make_stock_negative(
    client, admin_user, db_session, session_factory
):
    item = factories.create_inventory_item(db_session, name="Gauze", current="5.000", minimum="0.000")
    headers = auth_headers(client, admin_user.email)

    resp = client.post(
        f"{API}/inventory/items/{item.id}/movements/out",
        headers=headers,
        json={"quantity": "10.000"},
    )
    assert_validation_error(resp)

    # neither the balance nor the movement log changed
    with session_factory() as s:
        assert s.get(InventoryItem, item.id).current_quantity == Decimal("5.000")
        assert s.query(InventoryMovement).filter_by(inventory_item_id=item.id).count() == 0


def test_inventory_out_within_balance_succeeds_and_updates_quantity(
    client, admin_user, db_session, session_factory
):
    item = factories.create_inventory_item(db_session, name="Mask", current="5.000", minimum="0.000")
    headers = auth_headers(client, admin_user.email)

    resp = client.post(
        f"{API}/inventory/items/{item.id}/movements/out",
        headers=headers,
        json={"quantity": "3.000"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert Decimal(body["resulting_quantity"]) == Decimal("2.000")
    assert body["movement_type"] == "out"

    with session_factory() as s:
        assert s.get(InventoryItem, item.id).current_quantity == Decimal("2.000")
        movements = s.query(InventoryMovement).filter_by(inventory_item_id=item.id).all()
        assert len(movements) == 1
        assert movements[0].resulting_quantity == Decimal("2.000")
        assert movements[0].created_by_user_id == admin_user.id


def test_inventory_in_increments_quantity(client, admin_user, db_session, session_factory):
    item = factories.create_inventory_item(db_session, name="Glove", current="5.000")
    headers = auth_headers(client, admin_user.email)

    resp = client.post(
        f"{API}/inventory/items/{item.id}/movements/in",
        headers=headers,
        json={"quantity": "4.000"},
    )
    assert resp.status_code == 201, resp.text
    with session_factory() as s:
        assert s.get(InventoryItem, item.id).current_quantity == Decimal("9.000")


# ---------------------------------------------------------------------------
# Adjustment is ADMIN-only
# ---------------------------------------------------------------------------
def test_receptionist_cannot_adjust_stock(client, receptionist_user, db_session):
    item = factories.create_inventory_item(db_session, name="X", current="5.000")
    headers = auth_headers(client, receptionist_user.email)
    resp = client.post(
        f"{API}/inventory/items/{item.id}/movements/adjustment",
        headers=headers,
        json={"quantity": "1.000", "reason": "manual fix"},
    )
    assert_forbidden(resp)


def test_dentist_cannot_adjust_stock(client, dentist_user, db_session):
    item = factories.create_inventory_item(db_session, name="Y", current="5.000")
    headers = auth_headers(client, dentist_user.email)
    resp = client.post(
        f"{API}/inventory/items/{item.id}/movements/adjustment",
        headers=headers,
        json={"quantity": "1.000", "reason": "manual fix"},
    )
    assert_forbidden(resp)


def test_admin_adjustment_sets_absolute_balance_and_writes_movement(
    client, admin_user, db_session, session_factory
):
    item = factories.create_inventory_item(db_session, name="Z", current="5.000")
    headers = auth_headers(client, admin_user.email)
    resp = client.post(
        f"{API}/inventory/items/{item.id}/movements/adjustment",
        headers=headers,
        json={"quantity": "12.000", "reason": "stock count correction"},
    )
    assert resp.status_code == 201, resp.text
    with session_factory() as s:
        assert s.get(InventoryItem, item.id).current_quantity == Decimal("12.000")
        moves = s.query(InventoryMovement).filter_by(inventory_item_id=item.id).all()
        assert len(moves) == 1
        assert moves[0].movement_type.value == "adjustment"


# ---------------------------------------------------------------------------
# Immutability by design
# ---------------------------------------------------------------------------
def test_inventory_movements_have_no_edit_or_delete_routes():
    """Movements are append-only: assert the app exposes no PATCH/PUT/DELETE
    route for an individual movement (immutability enforced by route absence)."""
    from app.main import app

    movement_mutating = []
    for route in app.routes:
        path = getattr(route, "path", "")
        methods = getattr(route, "methods", set()) or set()
        if "movements" in path and methods & {"PATCH", "PUT", "DELETE"}:
            movement_mutating.append((path, methods))
    assert movement_mutating == [], f"unexpected mutating movement routes: {movement_mutating}"


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------
def test_low_stock_alert_lists_items_at_or_below_minimum(
    client, admin_user, db_session
):
    factories.create_inventory_item(db_session, name="Low", current="1.000", minimum="5.000")
    factories.create_inventory_item(db_session, name="Ok", current="50.000", minimum="5.000")
    headers = auth_headers(client, admin_user.email)

    resp = client.get(f"{API}/inventory/alerts/low-stock", headers=headers)
    assert resp.status_code == 200, resp.text
    names = {i["name"] for i in resp.json()["items"]}
    assert "Low" in names
    assert "Ok" not in names


def test_expiring_alert_lists_items_within_window(client, admin_user, db_session):
    soon = date.today() + timedelta(days=10)
    far = date.today() + timedelta(days=400)
    factories.create_inventory_item(db_session, name="Expiring", current="5.000", expiration_date=soon)
    factories.create_inventory_item(db_session, name="Stable", current="5.000", expiration_date=far)
    headers = auth_headers(client, admin_user.email)

    resp = client.get(f"{API}/inventory/alerts/expiring?days=30", headers=headers)
    assert resp.status_code == 200, resp.text
    names = {i["name"] for i in resp.json()["items"]}
    assert "Expiring" in names
    assert "Stable" not in names


# TODO(concurrency): register_in/out/adjustment use SELECT ... FOR UPDATE to
# serialize concurrent movements on the same item. SQLite ignores row locks, so
# add a parallel out/out race test under MySQL (TEST_DATABASE_URL) to prove the
# balance never goes negative under contention.
