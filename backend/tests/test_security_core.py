from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.modules.patients.schemas import PatientListItem
from app.modules.reports.schemas import DashboardPatientSnapshot
from app.modules.users.schemas import UserRead
from app.shared.rate_limit import FixedWindowRateLimiter


def test_password_hash_is_not_plaintext_and_verifies():
    password = "Senha12345"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("SenhaErrada123", hashed)


def test_expired_access_token_is_rejected():
    token = create_access_token("123", expires_delta=timedelta(seconds=-1))

    with pytest.raises(ValueError):
        decode_token(token)


def test_user_response_schema_never_exposes_password_hash():
    assert "password_hash" not in UserRead.model_fields


def test_patient_list_schema_omits_high_risk_pii():
    assert "cpf" not in PatientListItem.model_fields
    assert "street" not in PatientListItem.model_fields
    assert "zip_code" not in PatientListItem.model_fields


def test_dashboard_patient_snapshot_omits_cpf_and_email():
    assert "cpf" not in DashboardPatientSnapshot.model_fields
    assert "email" not in DashboardPatientSnapshot.model_fields


def test_rate_limiter_blocks_after_configured_failures():
    limiter = FixedWindowRateLimiter(max_attempts=2, window_seconds=60)

    limiter.check("client:user@example.com")
    limiter.register_failure("client:user@example.com")
    limiter.register_failure("client:user@example.com")

    with pytest.raises(HTTPException) as exc_info:
        limiter.check("client:user@example.com")

    assert exc_info.value.status_code == 429
