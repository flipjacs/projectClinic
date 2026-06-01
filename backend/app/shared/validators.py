"""Validadores e normalizadores reutilizáveis."""
from __future__ import annotations

import re

BRAZILIAN_UFS: frozenset[str] = frozenset(
    {
        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
        "RS", "RO", "RR", "SC", "SP", "SE", "TO",
    }
)


def _digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def is_valid_cpf(cpf: str) -> bool:
    """Valida CPF (esperado 11 dígitos sem formatação)."""
    if len(cpf) != 11 or not cpf.isdigit():
        return False
    # CPFs com todos os dígitos iguais são tecnicamente inválidos.
    if cpf == cpf[0] * 11:
        return False

    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    dv1 = (soma * 10) % 11
    if dv1 == 10:
        dv1 = 0
    if dv1 != int(cpf[9]):
        return False

    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    dv2 = (soma * 10) % 11
    if dv2 == 10:
        dv2 = 0
    return dv2 == int(cpf[10])


def normalize_cpf(value: str) -> str:
    digits = _digits(value)
    if not is_valid_cpf(digits):
        raise ValueError("CPF inválido")
    return digits


def normalize_phone(value: str) -> str:
    digits = _digits(value)
    if not (10 <= len(digits) <= 11):
        raise ValueError("Telefone deve ter 10 ou 11 dígitos (DDD + número)")
    return digits


def normalize_zip(value: str) -> str:
    digits = _digits(value)
    if len(digits) != 8:
        raise ValueError("CEP deve ter 8 dígitos")
    return digits


def normalize_state(value: str) -> str:
    uf = (value or "").strip().upper()
    if uf not in BRAZILIAN_UFS:
        raise ValueError("UF inválida")
    return uf


def only_digits(value: str) -> str:
    """Atalho público para extrair apenas dígitos (útil em busca)."""
    return _digits(value)
