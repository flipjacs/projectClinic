"""Helpers de timezone usados por múltiplos módulos (finance, inventory,
appointments, reports).

Centralizar evita drift entre módulos que precisariam concordar sobre
"hoje", "semana corrente" e "mês corrente" da clínica.
"""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

# Timezone da clínica (Goiânia / Brasília-time).
CLINIC_TZ = ZoneInfo("America/Sao_Paulo")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def ensure_aware_utc(value: datetime, field_name: str = "datetime") -> datetime:
    """Exige timezone explícito e normaliza para UTC antes de persistir/filtrar."""
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(
            f"{field_name} deve incluir timezone (ex.: 2026-06-01T10:00:00-03:00)"
        )
    return value.astimezone(timezone.utc)


def ensure_optional_aware_utc(
    value: datetime | None,
    field_name: str = "datetime",
) -> datetime | None:
    if value is None:
        return None
    return ensure_aware_utc(value, field_name)


def today_clinic() -> date:
    return datetime.now(CLINIC_TZ).date()


def day_window(reference: datetime | None = None) -> tuple[datetime, datetime]:
    """Início e fim (exclusivo) do dia local da clínica que contém `reference`,
    em UTC. Se `reference` for None, usa "agora" em CLINIC_TZ.
    """
    if reference is None:
        local_now = datetime.now(CLINIC_TZ)
    else:
        local_now = reference.astimezone(CLINIC_TZ)
    local_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    local_end = local_start + timedelta(days=1)
    return local_start.astimezone(timezone.utc), local_end.astimezone(timezone.utc)


def current_week_window() -> tuple[datetime, datetime]:
    """Segunda-feira 00:00 → segunda-feira seguinte 00:00, em UTC."""
    local_now = datetime.now(CLINIC_TZ)
    local_today = local_now.replace(hour=0, minute=0, second=0, microsecond=0)
    monday = local_today - timedelta(days=local_today.weekday())
    next_monday = monday + timedelta(days=7)
    return monday.astimezone(timezone.utc), next_monday.astimezone(timezone.utc)


def current_month_window() -> tuple[datetime, datetime]:
    """Dia 1 00:00 → dia 1 do mês seguinte 00:00, em UTC."""
    local_now = datetime.now(CLINIC_TZ)
    first = local_now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if first.month == 12:
        next_first = first.replace(year=first.year + 1, month=1)
    else:
        next_first = first.replace(month=first.month + 1)
    return first.astimezone(timezone.utc), next_first.astimezone(timezone.utc)


def date_range_window(
    start: date | None,
    end: date | None,
) -> tuple[datetime, datetime]:
    """Converte uma janela de datas (date) em UTC, com fallback para mês corrente.

    Se ambos forem None: usa current_month_window.
    Se apenas um for fornecido: usa o mês completo do informado.
    O `end` é tratado como dia inclusivo (até o final do dia local).
    """
    if start is None and end is None:
        return current_month_window()
    if start is None:
        start = end.replace(day=1)  # type: ignore[union-attr]
    if end is None:
        end = today_clinic()
    if end < start:
        raise ValueError("end_date não pode ser anterior a start_date")

    start_local = datetime(start.year, start.month, start.day, tzinfo=CLINIC_TZ)
    end_exclusive_local = datetime(
        end.year, end.month, end.day, tzinfo=CLINIC_TZ
    ) + timedelta(days=1)
    return (
        start_local.astimezone(timezone.utc),
        end_exclusive_local.astimezone(timezone.utc),
    )


__all__ = [
    "CLINIC_TZ",
    "ensure_aware_utc",
    "ensure_optional_aware_utc",
    "now_utc",
    "today_clinic",
    "day_window",
    "current_week_window",
    "current_month_window",
    "date_range_window",
]
