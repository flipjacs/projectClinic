"""Procedure CRUD, RBAC and validation tests.

Procedures feed budget pricing, so their lifecycle (create/list/update/activate)
and the role boundaries around them are worth covering.
"""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.modules.procedures.models import Procedure
from tests.helpers.asserts import assert_forbidden, assert_validation_error
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def test_dentist_can_create_procedure(client, dentist_user, session_factory):
    headers = auth_headers(client, dentist_user.email)
    resp = client.post(
        f"{API}/procedures",
        headers=headers,
        json={"name": "Restauração", "base_price": "150.00", "estimated_duration_minutes": 45},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "Restauração"
    assert body["base_price"] == "150.00"
    with session_factory() as s:
        assert s.query(Procedure).filter_by(name="Restauração").count() == 1


def test_receptionist_cannot_create_procedure(client, receptionist_user):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.post(
        f"{API}/procedures", headers=headers, json={"name": "Limpeza", "base_price": "80.00"}
    )
    assert_forbidden(resp)


def test_any_staff_can_list_procedures(client, receptionist_user, procedure):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.get(f"{API}/procedures", headers=headers)
    assert resp.status_code == 200, resp.text
    assert any(item["id"] == procedure.id for item in resp.json()["items"])


def test_negative_price_is_rejected(client, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    resp = client.post(
        f"{API}/procedures", headers=headers, json={"name": "Inválido", "base_price": "-1.00"}
    )
    assert_validation_error(resp)


def test_update_procedure_price(client, dentist_user, procedure, session_factory):
    headers = auth_headers(client, dentist_user.email)
    resp = client.patch(
        f"{API}/procedures/{procedure.id}", headers=headers, json={"base_price": "199.90"}
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["base_price"] == "199.90"
    with session_factory() as s:
        assert str(s.get(Procedure, procedure.id).base_price) == "199.90"


def test_empty_update_is_rejected(client, dentist_user, procedure):
    headers = auth_headers(client, dentist_user.email)
    resp = client.patch(f"{API}/procedures/{procedure.id}", headers=headers, json={})
    assert_validation_error(resp)


def test_deactivate_then_hidden_from_default_list(
    client, dentist_user, procedure, session_factory
):
    headers = auth_headers(client, dentist_user.email)
    resp = client.patch(f"{API}/procedures/{procedure.id}/deactivate", headers=headers)
    assert resp.status_code == 200, resp.text

    default_list = client.get(f"{API}/procedures", headers=headers).json()["items"]
    assert all(item["id"] != procedure.id for item in default_list)

    with_inactive = client.get(
        f"{API}/procedures?include_inactive=true", headers=headers
    ).json()["items"]
    assert any(item["id"] == procedure.id for item in with_inactive)

    # The row is preserved (soft delete).
    with session_factory() as s:
        assert s.get(Procedure, procedure.id).is_active is False


def test_get_unknown_procedure_returns_404(client, dentist_user):
    headers = auth_headers(client, dentist_user.email)
    resp = client.get(f"{API}/procedures/999999", headers=headers)
    assert resp.status_code == 404
