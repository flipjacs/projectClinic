"""Per-user appearance settings: CRUD, per-user isolation, validation, audit."""
from __future__ import annotations

import pytest

from app.core.config import settings
from app.modules.audit.models import AuditLog
from app.modules.settings.appearance_models import UserAppearanceSettings
from tests.helpers.asserts import assert_status, assert_validation_error
from tests.helpers.auth import auth_headers

API = settings.api_v1_prefix

pytestmark = pytest.mark.integration


def _payload(**overrides) -> dict:
    body = {
        "theme": "dark",
        "density": "compact",
        "language": "pt-BR",
        "preferences": {
            "reduced_motion": True,
            "high_contrast": False,
            "confirm_critical_actions": True,
            "auto_save_filters": True,
            "reopen_last_page": False,
        },
    }
    body.update(overrides)
    return body


def test_get_returns_defaults_not_404(client, admin_user):
    """Nunca 404: usuário sem preferências recebe os padrões (200)."""
    headers = auth_headers(client, admin_user.email)
    resp = client.get(f"{API}/settings/appearance", headers=headers)
    assert_status(resp, 200)
    body = resp.json()
    assert body["theme"] == "light"
    assert body["density"] == "comfortable"


def test_put_persists_and_get_reflects(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    resp = client.put(f"{API}/settings/appearance", headers=headers, json=_payload())
    assert_status(resp, 200)
    assert resp.json()["theme"] == "dark"

    got = client.get(f"{API}/settings/appearance", headers=headers).json()
    assert got["density"] == "compact"
    assert got["preferences"]["reduced_motion"] is True
    with session_factory() as s:
        assert s.query(UserAppearanceSettings).filter_by(user_id=admin_user.id).count() == 1


def test_is_idempotent_per_user(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/appearance", headers=headers, json=_payload(theme="dark"))
    client.put(f"{API}/settings/appearance", headers=headers, json=_payload(theme="system"))
    with session_factory() as s:
        rows = s.query(UserAppearanceSettings).filter_by(user_id=admin_user.id).all()
        assert len(rows) == 1
        assert rows[0].theme == "system"


def test_preferences_are_per_user(client, admin_user, dentist_user, session_factory):
    """O tema de um usuário não afeta o de outro."""
    client.put(
        f"{API}/settings/appearance",
        headers=auth_headers(client, admin_user.email),
        json=_payload(theme="dark"),
    )
    # O dentista, sem personalizar, ainda recebe os padrões.
    resp = client.get(
        f"{API}/settings/appearance", headers=auth_headers(client, dentist_user.email)
    )
    assert resp.json()["theme"] == "light"


def test_any_authenticated_user_can_manage_own(client, dentist_user):
    """Não exige ADMIN — cada um gerencia as próprias preferências."""
    headers = auth_headers(client, dentist_user.email)
    resp = client.put(f"{API}/settings/appearance", headers=headers, json=_payload())
    assert_status(resp, 200)


def test_unauthenticated_rejected(client):
    assert_status(client.get(f"{API}/settings/appearance"), 401)


@pytest.mark.parametrize(
    "field,value",
    [("theme", "neon"), ("density", "huge"), ("language", "fr")],
)
def test_invalid_enum_rejected(client, admin_user, field, value):
    headers = auth_headers(client, admin_user.email)
    assert_validation_error(
        client.put(f"{API}/settings/appearance", headers=headers, json=_payload(**{field: value}))
    )


def test_update_records_audit(client, admin_user, session_factory):
    headers = auth_headers(client, admin_user.email)
    client.put(f"{API}/settings/appearance", headers=headers, json=_payload())
    with session_factory() as s:
        logs = s.query(AuditLog).filter_by(entity_type="appearance_settings").all()
        assert logs
        assert logs[0].actor_user_id == admin_user.id
