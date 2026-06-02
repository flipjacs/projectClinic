"""Alembic migration smoke test against MySQL (mysql_only).

Validates the *real* production schema path — ``alembic upgrade head`` on a clean
database — instead of ``Base.metadata.create_all``. It then checks that the core
tables, indexes and foreign keys exist, and that ``downgrade base`` tears the
schema back down cleanly.

This does NOT use the ``db_engine`` fixture (which uses ``create_all``); it drives
Alembic directly so we test the migration scripts as production would run them.
"""
from __future__ import annotations

import os
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

pytestmark = [pytest.mark.integration, pytest.mark.mysql_only]

CORE_TABLES = {
    "users",
    "patients",
    "patient_health_info",
    "medical_records",
    "appointments",
    "procedures",
    "budgets",
    "budget_items",
    "payments",
    "inventory_items",
    "inventory_movements",
    "audit_logs",
    "alembic_version",
}


def _alembic_config(url: str) -> Config:
    ini_path = Path(__file__).resolve().parents[2] / "alembic.ini"
    cfg = Config(str(ini_path))
    cfg.set_main_option("sqlalchemy.url", url)
    return cfg


def _drop_everything(engine) -> None:
    """Reset the schema (drop all tables + alembic_version) for a clean run."""
    insp = inspect(engine)
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for table in insp.get_table_names():
            conn.execute(text(f"DROP TABLE IF EXISTS `{table}`"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))


@pytest.fixture()
def migration_env(monkeypatch):
    url = os.environ["TEST_DATABASE_URL"]
    # Make alembic/env.py resolve the test database (it reads settings.*).
    from app.core.config import settings

    monkeypatch.setattr(settings, "database_url", url, raising=False)

    engine = create_engine(url, future=True)
    _drop_everything(engine)
    try:
        yield url, engine
    finally:
        _drop_everything(engine)
        engine.dispose()


def test_alembic_upgrade_head_builds_full_schema(migration_env):
    url, engine = migration_env
    cfg = _alembic_config(url)

    command.upgrade(cfg, "head")

    insp = inspect(engine)
    tables = set(insp.get_table_names())
    missing = CORE_TABLES - tables
    assert not missing, f"migrations did not create: {sorted(missing)}"

    # The hardened indexes from later migrations must be present.
    audit_indexes = {ix["name"] for ix in insp.get_indexes("audit_logs")}
    assert "ix_audit_logs_action" in audit_indexes
    assert "ix_audit_logs_entity_created" in audit_indexes

    # The masked-diff / request-context columns (migration 0011) must exist.
    audit_cols = {c["name"] for c in insp.get_columns("audit_logs")}
    assert {"changed_fields", "masked_before", "masked_after", "ip_address", "user_agent"} <= audit_cols

    # Foreign keys exist where expected (payments -> patients/budgets).
    payment_fks = insp.get_foreign_keys("payments")
    referred = {fk["referred_table"] for fk in payment_fks}
    assert "patients" in referred
    assert "budgets" in referred


def test_alembic_downgrade_base_drops_schema(migration_env):
    url, engine = migration_env
    cfg = _alembic_config(url)

    command.upgrade(cfg, "head")
    command.downgrade(cfg, "base")

    insp = inspect(engine)
    remaining = set(insp.get_table_names()) - {"alembic_version"}
    assert not remaining, f"downgrade left tables behind: {sorted(remaining)}"
