"""User management & admin-safety integration tests."""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.core.permissions import Role
from app.modules.users.models import User
from app.shared.exceptions import ValidationError
from tests.helpers import factories
from tests.helpers.asserts import assert_forbidden, assert_no_sensitive_fields, assert_validation_error
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


# ---------------------------------------------------------------------------
# Self-protection rules (reachable via the HTTP API)
# ---------------------------------------------------------------------------
def test_user_cannot_change_their_own_role(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.patch(
        f"{API}/users/{admin_user.id}", headers=headers, json={"role": "dentist"}
    )
    assert_validation_error(resp)
    with session_factory() as s:
        assert s.get(User, admin_user.id).role == Role.ADMIN


def test_user_cannot_deactivate_themselves(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.patch(f"{API}/users/{admin_user.id}/deactivate", headers=headers)
    assert_validation_error(resp)
    with session_factory() as s:
        assert s.get(User, admin_user.id).is_active is True


# ---------------------------------------------------------------------------
# Privilege escalation prevention
# ---------------------------------------------------------------------------
def test_non_admin_cannot_create_admin_user(client, receptionist_user):
    headers = auth_headers(client, receptionist_user.email)
    resp = client.post(
        f"{API}/users",
        headers=headers,
        json={"name": "Evil", "email": "evil@clinic-test.com", "role": "admin", "password": "Senha12345"},
    )
    assert_forbidden(resp)


def test_non_admin_cannot_change_roles(client, dentist_user, receptionist_user):
    headers = auth_headers(client, dentist_user.email)
    resp = client.patch(
        f"{API}/users/{receptionist_user.id}", headers=headers, json={"role": "admin"}
    )
    assert_forbidden(resp)


def test_admin_can_create_user_following_rules(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.post(
        f"{API}/users",
        headers=headers,
        json={"name": "Nurse", "email": "nurse@clinic-test.com", "role": "receptionist", "password": "Senha12345"},
    )
    assert resp.status_code == 201, resp.text
    assert_no_sensitive_fields(resp.json())
    with session_factory() as s:
        assert s.query(User).filter_by(email="nurse@clinic-test.com").count() == 1


# ---------------------------------------------------------------------------
# Last-active-admin protection (service-level invariant)
#
# The route layer makes the "last admin" branch hard to reach (self-role-change
# and self-deactivation are blocked first, and any acting admin is itself an
# active admin). We therefore assert the defense-in-depth guard directly against
# the real service + real DB (no mocks): removing the last active admin must
# raise a domain ValidationError and must NOT mutate the database.
# ---------------------------------------------------------------------------
def test_service_blocks_deactivating_last_active_admin(db_session):
    from app.modules.users.service import UserService

    admin = factories.create_user(db_session, role=Role.ADMIN, email="solo-admin@clinic-test.com")
    actor = factories.create_user(db_session, role=Role.RECEPTIONIST, email="actor@clinic-test.com")

    service = UserService(db_session)
    with pytest.raises(ValidationError):
        service.set_active(admin.id, active=False, current_user_id=actor.id)

    db_session.expire_all()
    assert db_session.get(User, admin.id).is_active is True


def test_service_blocks_downgrading_last_active_admin_role(db_session):
    from app.modules.users.schemas import UserUpdate
    from app.modules.users.service import UserService

    admin = factories.create_user(db_session, role=Role.ADMIN, email="solo-admin2@clinic-test.com")
    actor = factories.create_user(db_session, role=Role.RECEPTIONIST, email="actor2@clinic-test.com")

    service = UserService(db_session)
    with pytest.raises(ValidationError):
        service.update(admin.id, UserUpdate(role=Role.DENTIST), current_user=actor)

    db_session.expire_all()
    assert db_session.get(User, admin.id).role == Role.ADMIN


# ---------------------------------------------------------------------------
# Data exposure
# ---------------------------------------------------------------------------
def test_user_list_does_not_expose_password_hash(client, admin_user, dentist_user):
    headers = auth_headers(client, admin_user.email)
    resp = client.get(f"{API}/users", headers=headers)
    assert resp.status_code == 200
    assert_no_sensitive_fields(resp.json())


def test_user_detail_does_not_expose_password_hash(client, admin_user):
    headers = auth_headers(client, admin_user.email)
    resp = client.get(f"{API}/users/{admin_user.id}", headers=headers)
    assert resp.status_code == 200
    assert_no_sensitive_fields(resp.json())
