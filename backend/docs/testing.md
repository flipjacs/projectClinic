# Automated tests

This project ships an integration-first automated test suite that exercises the
**real application stack** (FastAPI app + dependency-injected SQLAlchemy session)
against an **isolated test database**. Tests focus on the business invariants
whose failure would cause security, privacy, financial or stock corruption.

> ⚠️ **Tests must never run against the production or development database.**
> The suite always builds its own throwaway database (see below) and overrides
> `get_db`. It never reads your real `.env` `DATABASE_URL` for storage.

---

## Test layout

```
tests/
├── conftest.py                 # foundation: engine, session, client, user fixtures
├── helpers/
│   ├── auth.py                 # login / Authorization header helpers
│   ├── factories.py            # users, patients, procedures, inventory, valid CPF
│   └── asserts.py              # 401/403/422/409 + "no password leak" helpers
├── integration/
│   ├── test_auth.py            # login, token validation, deactivation
│   ├── test_rbac.py            # role × route matrix on real endpoints
│   ├── test_finance.py         # budget total, anti-overpayment, revenue, status
│   ├── test_inventory.py       # negative stock, atomicity, admin adjustment, alerts
│   ├── test_appointments.py    # conflict, past/inactive, reschedule, transitions
│   ├── test_medical_records.py # dentist scope, RBAC, audit, appointment link
│   ├── test_users.py           # admin safety, privilege escalation, no hash leak
│   ├── test_patients_privacy.py# PII hiding, admin-only export, soft delete
│   └── test_audit.py           # audit rows for patient/payment/stock/record
└── test_health.py / test_security_core.py   # pre-existing unit tests
```

---

## Database strategy

### Default: isolated SQLite file (zero setup)

Each test gets a **fresh SQLite database file** in a per-test temp directory.
Tables are created from the SQLAlchemy metadata, foreign keys are enforced
(`PRAGMA foreign_keys=ON`), and the file is dropped at the end of the test. This
makes the suite deterministic and order-independent with no external services.

Documented differences from MySQL (the suite does not hide them):

| Behaviour | SQLite (default) | MySQL (`TEST_DATABASE_URL`) |
|-----------|------------------|------------------------------|
| `SELECT ... FOR UPDATE` row locks | no-op | enforced |
| `DateTime(timezone=True)` | stored naive UTC | tz-aware |
| `BigInteger` PK autoincrement | shimmed to `INTEGER` for rowid | native |

The concurrency invariants (payment anti-overpayment, stock locking) are tested
**deterministically**. True parallel stress tests require MySQL — see the
`TODO(concurrency)` notes in `test_finance.py` and `test_inventory.py`.

### Full fidelity: MySQL test database

To run the identical suite against a real MySQL schema (recommended before a
production go-live), point `TEST_DATABASE_URL` at a **dedicated, disposable**
database and run the suite. The schema is created/dropped automatically.

The fastest way is the bundled throwaway MySQL (host port `3307`, data in RAM):

```bash
docker compose -f docker-compose.test.yml up -d        # wait until healthy
export TEST_DATABASE_URL="mysql+pymysql://clinic:clinic_password@127.0.0.1:3307/clinic_test"
pytest
docker compose -f docker-compose.test.yml down -v       # wipe when done
```

Or use any MySQL you already run:

```bash
mysql -u root -p -e "CREATE DATABASE clinic_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
export TEST_DATABASE_URL="mysql+pymysql://clinic:clinic_password@localhost:3306/clinic_test"
pytest
```

**Safety guard.** The suite refuses to run if `TEST_DATABASE_URL` does not look
like a throwaway test database: the schema name must contain `test`, must not
contain production markers (`prod`/`production`/`live`), and must not equal the
application's configured `DATABASE_URL`. This makes it hard to point the
destructive `create_all`/`drop_all` cycle at real data.

#### `mysql_only` tests

Some tests require real InnoDB row locks / `SELECT ... FOR UPDATE` and are
marked `mysql_only`. They are **skipped automatically** on the default SQLite
engine and run only when `TEST_DATABASE_URL` is MySQL:

* `tests/integration/test_concurrency_finance.py` — concurrent payments cannot
  exceed the budget total (anti-overpayment under contention).
* `tests/integration/test_concurrency_inventory.py` — concurrent stock
  movements never drive the balance negative; valid moves always log history.
* `tests/integration/test_migrations.py` — Alembic migration smoke test.

```bash
# run ONLY the MySQL-specific tests
export TEST_DATABASE_URL="mysql+pymysql://clinic:clinic_password@127.0.0.1:3307/clinic_test"
pytest -m mysql_only
```

### Alembic migration smoke test (real production schema path)

`test_migrations.py` validates the **real** schema path — `alembic upgrade head`
on a clean database (not `Base.metadata.create_all`) — then checks the core
tables, indexes and foreign keys exist, and that `downgrade base` tears the
schema down cleanly. It runs only against MySQL.

You can also run it by hand against the test schema:

```bash
export DATABASE_URL="mysql+pymysql://clinic:clinic_password@127.0.0.1:3307/clinic_test"
alembic upgrade head
alembic downgrade base
```

---

## Required environment

* Tests reuse the app settings (`APP_ENV=test` in `.env`). A `SECRET_KEY`
  (>= 32 chars) must be present — the repo `.env` already provides a test value.
* No MySQL is required for the default SQLite run.

---

## Running the tests

```bash
# everything
pytest

# only the integration suite
pytest tests/integration

# quiet
pytest -q

# a single area
pytest tests/integration/test_finance.py

# coverage (HTML + terminal)
pytest --cov=app --cov-report=term-missing
```

### Coverage target

Current overall coverage is **~81%** (SQLite run), with the critical services and
routes (auth, finance, inventory, appointments, medical records, users,
procedures) covered well above that. The 80% gate is now achievable:

```bash
pytest --cov=app --cov-report=term-missing --cov-fail-under=80
```

We keep `--cov` **out of the default `addopts`** so the everyday `pytest` run
stays fast and does not require `pytest-cov`; run the command above (e.g. in CI)
to enforce the gate. The largest remaining gaps are the report aggregation
queries and some procedure/patient repository branches.

### Creating the initial admin

The first ADMIN is bootstrapped with a CLI (idempotent — it will not create a
second admin unless `--force` is given):

```bash
# reads INITIAL_ADMIN_NAME / INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD from .env
python -m app.cli.create_admin

# or pass explicitly
python -m app.cli.create_admin --name "Dra. Chefe" --email "chefe@clinic.com.br" --password "<strong>"
```

> The e-mail must use a public TLD (`.com`, `.com.br`, …). Reserved TLDs such as
> `.local` / `.test` are rejected by the e-mail validator — `.env.example` ships
> a valid `admin@clinic.com.br`. The CLI stores the password as an argon2 hash;
> it is covered by `tests/integration/test_create_admin.py`.

---

## Installation (Python 3.14, no compiler)

The versions pinned in `requirements.txt` predate cp314 wheels for
`pydantic-core` and try to compile from source. On a machine without a
C/Rust toolchain, install current wheel-backed versions instead:

```bash
python -m venv .venv && . .venv/bin/activate
pip install --only-binary=:all: \
  fastapi starlette "sqlalchemy>=2.0.36" alembic pymysql cryptography \
  "pydantic>=2.11" pydantic-settings "python-jose[cryptography]" \
  passlib bcrypt argon2-cffi python-multipart email-validator python-dotenv \
  httpx pytest pytest-asyncio pytest-cov
pytest
```

On Python 3.12 the pinned set installs cleanly:
`pip install -r requirements.txt -r requirements-dev.txt`.
