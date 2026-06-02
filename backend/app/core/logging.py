"""Logging técnico da aplicação (separado do audit log de negócio).

Princípios:
  * cada linha de log carrega um ``request_id`` correlacionável;
  * dados sensíveis (senha, token, hash, CPF, e-mail) são **redatados** na
    formatação, como defesa em profundidade — logs técnicos NUNCA devem conter
    PII em texto puro;
  * o audit log de negócio (tabela ``audit_logs``) é outra coisa e continua
    sendo a fonte de verdade para "quem fez o quê".
"""
from __future__ import annotations

import logging
import re
from contextvars import ContextVar

# Correlaciona todas as linhas de log de uma mesma request.
request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


# Padrões redatados na saída de log (best-effort, defesa em profundidade).
_SCRUB_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    # Bearer tokens / JWT.
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9._\-]+"), "Bearer <redacted>"),
    # Pares chave-sensível: senha/token/hash em json ou kwargs.
    (
        re.compile(r"(?i)(password|senha|token|secret|password_hash|authorization)"
                   r"([\"']?\s*[:=]\s*[\"']?)([^\s\"',}]+)"),
        r"\1\2<redacted>",
    ),
    # CPF (11 dígitos isolados, com ou sem máscara) → mantém só os 3 do meio.
    (re.compile(r"\b\d{3}\.?\d{3}\.?(\d{3})-?\d{2}\b"), r"***.***.\1-**"),
    # Hash argon2/bcrypt.
    (re.compile(r"\$argon2[a-z]{0,2}\$[^\s\"']+"), "<redacted-hash>"),
    (re.compile(r"\$2[aby]\$[^\s\"']+"), "<redacted-hash>"),
]


class RequestIdFilter(logging.Filter):
    """Injeta ``request_id`` em todo registro de log."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        record.request_id = request_id_var.get("-")
        return True


class ScrubbingFormatter(logging.Formatter):
    """Formata e então redige padrões sensíveis da linha final."""

    def format(self, record: logging.LogRecord) -> str:
        message = super().format(record)
        for pattern, replacement in _SCRUB_PATTERNS:
            message = pattern.sub(replacement, message)
        return message


_CONFIGURED = False


def setup_logging(level: str = "INFO") -> None:
    """Configura o root logger uma única vez (idempotente)."""
    global _CONFIGURED
    if _CONFIGURED:
        return

    handler = logging.StreamHandler()
    handler.addFilter(RequestIdFilter())
    handler.setFormatter(
        ScrubbingFormatter(
            fmt="%(asctime)s %(levelname)s [req:%(request_id)s] %(name)s: %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S%z",
        )
    )

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level.upper())

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
