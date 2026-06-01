from __future__ import annotations

import csv
import io
import re
from datetime import date, datetime
from typing import Iterable, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.reports.repository import (
    AppointmentsReportRepository,
    FinanceReportRepository,
    InventoryReportRepository,
    PatientsReportRepository,
)
from app.modules.reports.schemas import (
    AppointmentsReport,
    DashboardResponse,
    FinanceReport,
    InventoryReport,
    MedicalRecordsReport,
    PatientsReport,
)
from app.modules.reports.service import (
    DashboardService,
    ReportsService,
    _resolve_period,
)
from app.modules.users.models import User
from app.shared.exceptions import ValidationError

router = APIRouter(tags=["reports"])

# Permissões
ANY_STAFF = require_roles(Role.ADMIN, Role.DENTIST, Role.RECEPTIONIST)
ADMIN_ONLY = require_roles(Role.ADMIN)
ADMIN_DENTIST = require_roles(Role.ADMIN, Role.DENTIST)


_SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


def _safe_filename(stem: str, ext: str = "csv") -> str:
    """Sanitiza para evitar header injection / path traversal."""
    cleaned = _SAFE_FILENAME_RE.sub("_", stem).strip("._-")
    return f"{cleaned or 'report'}.{ext}"


def _safe_csv_cell(value: object) -> object:
    """Evita CSV formula injection em planilhas."""
    if not isinstance(value, str):
        return value
    if value and value[0] in ("=", "+", "-", "@", "\t", "\r", "\n"):
        return "'" + value
    return value


def _csv_response(
    *,
    filename_stem: str,
    headers: list[str],
    rows: Iterable[list[object]],
) -> StreamingResponse:
    """Streama CSV em UTF-8 com BOM para boa abertura no Excel/LibreOffice."""

    def generator():
        buf = io.StringIO()
        writer = csv.writer(buf, quoting=csv.QUOTE_MINIMAL)
        # BOM para compatibilidade com Excel (UTF-8 com acentos).
        yield "﻿"
        writer.writerow(headers)
        yield buf.getvalue()
        buf.seek(0)
        buf.truncate(0)
        for row in rows:
            writer.writerow(["" if c is None else _safe_csv_cell(c) for c in row])
            yield buf.getvalue()
            buf.seek(0)
            buf.truncate(0)

    fname = _safe_filename(filename_stem)
    return StreamingResponse(
        generator(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{fname}"',
            "X-Content-Type-Options": "nosniff",
        },
    )


def _validate_format(fmt: str) -> None:
    if fmt.lower() != "csv":
        raise ValidationError(
            "Formato não suportado. Use format=csv. PDF está previsto para uma fase futura."
        )


# ============================================================================
# DASHBOARD
# ============================================================================


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
) -> DashboardResponse:
    return DashboardService(db).get(current_user)


# ============================================================================
# REPORTS — JSON
# ============================================================================


@router.get(
    "/reports/patients",
    response_model=PatientsReport,
)
def report_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
) -> PatientsReport:
    return ReportsService(db).patients_report(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/reports/appointments",
    response_model=AppointmentsReport,
)
def report_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    dentist_id: Optional[int] = Query(default=None, ge=1),
) -> AppointmentsReport:
    return ReportsService(db).appointments_report(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        dentist_id=dentist_id,
    )


@router.get(
    "/reports/finance",
    response_model=FinanceReport,
)
def report_finance(
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_DENTIST),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
) -> FinanceReport:
    return ReportsService(db).finance_report(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/reports/inventory",
    response_model=InventoryReport,
)
def report_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
) -> InventoryReport:
    return ReportsService(db).inventory_report(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
    )


@router.get(
    "/reports/medical-records",
    response_model=MedicalRecordsReport,
)
def report_medical_records(
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_DENTIST),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    dentist_id: Optional[int] = Query(default=None, ge=1),
) -> MedicalRecordsReport:
    return ReportsService(db).medical_records_report(
        current_user=current_user,
        start_date=start_date,
        end_date=end_date,
        dentist_id=dentist_id,
    )


# ============================================================================
# EXPORTS — CSV
# ============================================================================


def _period_stem(prefix: str, start_date: Optional[date], end_date: Optional[date]) -> str:
    s = start_date.isoformat() if start_date else "auto"
    e = end_date.isoformat() if end_date else "auto"
    return f"{prefix}_{s}_to_{e}"


@router.get("/reports/patients/export")
def export_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_ONLY),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    format: str = Query(default="csv", description="Formato: csv"),
) -> StreamingResponse:
    _validate_format(format)
    start_utc, end_utc, _, _ = _resolve_period(start_date, end_date)
    rows = PatientsReportRepository(db).recent(
        start=start_utc, end=end_utc, limit=10000
    )
    return _csv_response(
        filename_stem=_period_stem("patients", start_date, end_date),
        headers=[
            "id",
            "name",
            "cpf",
            "birth_date",
            "phone",
            "email",
            "city",
            "state",
            "is_active",
            "created_at",
        ],
        rows=(
            [
                p.id,
                p.name,
                p.cpf,
                p.birth_date.isoformat(),
                p.phone,
                p.email or "",
                p.city,
                p.state,
                "true" if p.is_active else "false",
                p.created_at.isoformat(),
            ]
            for p in rows
        ),
    )


@router.get("/reports/appointments/export")
def export_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    dentist_id: Optional[int] = Query(default=None, ge=1),
    format: str = Query(default="csv"),
) -> StreamingResponse:
    _validate_format(format)
    start_utc, end_utc, _, _ = _resolve_period(start_date, end_date)
    applied = (
        current_user.id if current_user.role == Role.DENTIST else dentist_id
    )
    rows = AppointmentsReportRepository(db).list_in_window(
        start=start_utc, end=end_utc, dentist_id=applied, limit=10000
    )
    return _csv_response(
        filename_stem=_period_stem("appointments", start_date, end_date),
        headers=[
            "id",
            "scheduled_start",
            "scheduled_end",
            "status",
            "patient_id",
            "patient_name",
            "dentist_id",
            "dentist_name",
            "reason",
        ],
        rows=(
            [
                a.id,
                a.scheduled_start.isoformat(),
                a.scheduled_end.isoformat(),
                a.status.value,
                a.patient_id,
                a.patient.name if a.patient else "",
                a.dentist_id,
                a.dentist.name if a.dentist else "",
                a.reason or "",
            ]
            for a in rows
        ),
    )


@router.get("/reports/finance/export")
def export_finance(
    db: Session = Depends(get_db),
    current_user: User = Depends(ADMIN_DENTIST),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    format: str = Query(default="csv"),
) -> StreamingResponse:
    _validate_format(format)
    start_utc, end_utc, _, _ = _resolve_period(start_date, end_date)
    rows = FinanceReportRepository(db).list_paid_between(
        start=start_utc, end=end_utc, limit=10000
    )
    return _csv_response(
        filename_stem=_period_stem("finance_paid", start_date, end_date),
        headers=[
            "id",
            "patient_id",
            "budget_id",
            "amount",
            "payment_method",
            "status",
            "paid_at",
            "due_date",
            "created_at",
        ],
        rows=(
            [
                p.id,
                p.patient_id,
                p.budget_id if p.budget_id is not None else "",
                f"{p.amount:.2f}",
                p.payment_method.value,
                p.status.value,
                p.paid_at.isoformat() if p.paid_at else "",
                p.due_date.isoformat() if p.due_date else "",
                p.created_at.isoformat(),
            ]
            for p in rows
        ),
    )


@router.get("/reports/inventory/export")
def export_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    format: str = Query(default="csv"),
) -> StreamingResponse:
    _validate_format(format)
    # Exporta o catálogo atual (ativo + inativo).
    rows = InventoryReportRepository(db).list_active(limit=10000)
    return _csv_response(
        filename_stem=_period_stem("inventory", start_date, end_date),
        headers=[
            "id",
            "name",
            "category",
            "current_quantity",
            "minimum_quantity",
            "unit_of_measure",
            "supplier",
            "unit_price",
            "expiration_date",
            "is_active",
        ],
        rows=(
            [
                i.id,
                i.name,
                i.category.value,
                f"{i.current_quantity:.3f}",
                f"{i.minimum_quantity:.3f}",
                i.unit_of_measure.value,
                i.supplier or "",
                f"{i.unit_price:.2f}" if i.unit_price is not None else "",
                i.expiration_date.isoformat() if i.expiration_date else "",
                "true" if i.is_active else "false",
            ]
            for i in rows
        ),
    )
