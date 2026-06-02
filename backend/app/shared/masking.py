"""Mascaramento de dados sensíveis para o audit log.

Regras de ouro:
  * Senha e ``password_hash`` NUNCA são registrados (nem mascarados — são
    removidos por completo).
  * CPF, telefone, e-mail, CEP e conteúdo clínico livre são mascarados.
  * O objetivo é manter rastreabilidade ("o que mudou") sem vazar o dado em si.
"""
from __future__ import annotations

from typing import Any

# Campos que jamais podem aparecer no audit, nem mascarados.
NEVER_LOG_FIELDS: frozenset[str] = frozenset(
    {"password", "password_hash", "hashed_password", "senha", "token", "secret"}
)

# Campos cujo valor deve ser mascarado (substituído por versão ofuscada).
SENSITIVE_FIELDS: frozenset[str] = frozenset(
    {
        "cpf",
        "phone",
        "telefone",
        "email",
        "zip_code",
        "cep",
        # Conteúdo clínico livre — registra apenas que mudou, não o conteúdo.
        "disease_description",
        "allergy_description",
        "medication_description",
        "health_observations",
        "diagnosis",
        "main_complaint",
        "treatment_performed",
        "clinical_notes",
        "observations",
        "notes",
    }
)


def mask_cpf(value: str) -> str:
    digits = "".join(c for c in str(value) if c.isdigit())
    if len(digits) != 11:
        return "***"
    return f"***.***.{digits[6:9]}-**"


def mask_phone(value: str) -> str:
    digits = "".join(c for c in str(value) if c.isdigit())
    if len(digits) < 4:
        return "***"
    return f"****{digits[-4:]}"


def mask_email(value: str) -> str:
    text = str(value)
    if "@" not in text:
        return "***"
    local, _, domain = text.partition("@")
    visible = local[:1] if local else ""
    return f"{visible}***@{domain}"


def mask_generic(value: Any) -> str:
    """Mascara conteúdo livre: registra apenas o tamanho, nunca o conteúdo."""
    text = str(value)
    return f"<redacted:{len(text)} chars>"


def mask_value(field: str, value: Any) -> Any:
    """Mascara um único valor de acordo com o nome do campo."""
    if value is None:
        return None
    key = field.lower()
    if key in NEVER_LOG_FIELDS:
        return "<never-logged>"
    if key in ("cpf",):
        return mask_cpf(value)
    if key in ("phone", "telefone"):
        return mask_phone(value)
    if key in ("email",):
        return mask_email(value)
    if key in SENSITIVE_FIELDS:
        return mask_generic(value)
    return value


def mask_mapping(data: dict[str, Any]) -> dict[str, Any]:
    """Mascara um dicionário inteiro, removendo campos proibidos."""
    masked: dict[str, Any] = {}
    for field, value in data.items():
        if field.lower() in NEVER_LOG_FIELDS:
            # Não registra nem a chave de senha; segurança em primeiro lugar.
            continue
        masked[field] = mask_value(field, value)
    return masked
