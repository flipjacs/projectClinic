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

```bash
# create an isolated test schema (never your real one)
mysql -u root -p -e "CREATE DATABASE clinic_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

export TEST_DATABASE_URL="mysql+pymysql://clinic:clinic_password@localhost:3306/clinic_test"
pytest
```

> The suite uses `Base.metadata.create_all` for speed. To validate the Alembic
> migrations themselves against MySQL, run `alembic upgrade head` against the
> test schema separately (planned as a Phase 2 migration-smoke test).

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

Current overall coverage is ~75%, with the critical services and routes
(auth, finance, inventory, appointments, medical records, users) covered well
above that. We intentionally **do not** fail the build on a coverage gate yet;
the Phase 2 target is `--cov-fail-under=80` once expense/report flows are added.

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
