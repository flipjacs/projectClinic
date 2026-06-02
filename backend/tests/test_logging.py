"""Technical-log scrubbing: sensitive data must never reach the log stream."""
from __future__ import annotations

import logging

from app.core.logging import ScrubbingFormatter, request_id_var


def _format(msg: str, *args) -> str:
    fmt = ScrubbingFormatter(fmt="%(message)s")
    record = logging.LogRecord(
        name="test", level=logging.INFO, pathname=__file__, lineno=1,
        msg=msg, args=args, exc_info=None,
    )
    return fmt.format(record)


def test_scrubs_password_assignments():
    out = _format('login payload {"email": "a@b.com", "password": "hunter2"}')
    assert "hunter2" not in out
    assert "redacted" in out.lower()


def test_scrubs_bearer_token():
    out = _format("Authorization: Bearer abc.def.ghi")
    assert "abc.def.ghi" not in out


def test_scrubs_cpf_keeping_only_middle_digits():
    out = _format("paciente cpf 39053344705 criado")
    assert "39053344705" not in out
    assert "***" in out


def test_scrubs_argon2_hash():
    out = _format("hash=$argon2id$v=19$m=65536,t=3,p=4$abc$def")
    assert "$argon2id$v=19" not in out
    assert "redacted-hash" in out


def test_request_id_contextvar_defaults_to_dash():
    assert request_id_var.get("-") == "-"
