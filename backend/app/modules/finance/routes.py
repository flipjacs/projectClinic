from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.database.connection import get_db
from app.modules.auth.dependencies import require_roles
from app.modules.finance.models import (
    Budget,
    BudgetStatus,
    Payment,
    PaymentStatus,
)
from app.modules.finance.schemas import (
    BudgetCancel,
    BudgetCreate,
    BudgetRead,
    BudgetSettlementReport,
    BudgetStatusChange,
    BudgetUpdate,
    FinanceSummary,
    PaymentCancel,
    PaymentCreate,
    PaymentRead,
    PaymentStatusChange,
    PaymentUpdate,
    RevenueReport,
)
from app.modules.finance.service import (
    BudgetService,
    FinanceReportsService,
    PaymentService,
)
from app.modules.users.models import User
from app.shared.pagination import Page, PaginationParams, pagination_params

# Sem prefixo: cada rota declara o path completo (/budgets, /payments, /finance, ...).
router = APIRouter()

# Dependências reutilizáveis.
ANY_STAFF = require_roles(Role.ADMIN, Role.DENTIST, Role.RECEPTIONIST)
CLINICAL_ONLY = require_roles(Role.ADMIN, Role.DENTIST)


# ============================================================================
# BUDGETS
# ============================================================================


@router.post(
    "/budgets",
    response_model=BudgetRead,
    status_code=status.HTTP_201_CREATED,
    tags=["budgets"],
)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Budget:
    return BudgetService(db).create(payload=payload, current_user=current_user)


@router.get(
    "/budgets",
    response_model=Page[BudgetRead],
    tags=["budgets"],
    dependencies=[Depends(ANY_STAFF)],
)
def list_budgets(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    patient_id: Optional[int] = Query(default=None, ge=1),
    dentist_id: Optional[int] = Query(default=None, ge=1),
    status_filter: Optional[BudgetStatus] = Query(
        default=None, alias="status", description="Filtra por status."
    ),
    include_canceled: bool = Query(
        default=False,
        description="Inclui orçamentos cancelados (por padrão são ocultos).",
    ),
) -> Page[BudgetRead]:
    statuses = [status_filter] if status_filter else None
    items, total = BudgetService(db).list_paginated(
        params=params,
        patient_id=patient_id,
        dentist_id=dentist_id,
        statuses=statuses,
        include_canceled=include_canceled,
    )
    return Page[BudgetRead].build(
        items=[BudgetRead.model_validate(b) for b in items],
        total=total,
        params=params,
    )


@router.get(
    "/budgets/{budget_id}",
    response_model=BudgetRead,
    tags=["budgets"],
    dependencies=[Depends(ANY_STAFF)],
)
def get_budget(budget_id: int, db: Session = Depends(get_db)) -> Budget:
    return BudgetService(db).get_by_id(budget_id)


@router.get(
    "/patients/{patient_id}/budgets",
    response_model=Page[BudgetRead],
    tags=["budgets"],
    dependencies=[Depends(ANY_STAFF)],
)
def list_patient_budgets(
    patient_id: int,
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    include_canceled: bool = Query(default=False),
) -> Page[BudgetRead]:
    items, total = BudgetService(db).list_paginated(
        params=params,
        patient_id=patient_id,
        include_canceled=include_canceled,
    )
    return Page[BudgetRead].build(
        items=[BudgetRead.model_validate(b) for b in items],
        total=total,
        params=params,
    )


@router.patch(
    "/budgets/{budget_id}",
    response_model=BudgetRead,
    tags=["budgets"],
)
def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Budget:
    return BudgetService(db).update(
        budget_id=budget_id, payload=payload, current_user=current_user
    )


@router.patch(
    "/budgets/{budget_id}/status",
    response_model=BudgetRead,
    tags=["budgets"],
)
def change_budget_status(
    budget_id: int,
    payload: BudgetStatusChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Budget:
    return BudgetService(db).change_status(
        budget_id=budget_id, payload=payload, current_user=current_user
    )


@router.patch(
    "/budgets/{budget_id}/approve",
    response_model=BudgetRead,
    tags=["budgets"],
)
def approve_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Budget:
    return BudgetService(db).approve(budget_id=budget_id, current_user=current_user)


@router.patch(
    "/budgets/{budget_id}/reject",
    response_model=BudgetRead,
    tags=["budgets"],
)
def reject_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Budget:
    return BudgetService(db).reject(budget_id=budget_id, current_user=current_user)


@router.patch(
    "/budgets/{budget_id}/cancel",
    response_model=BudgetRead,
    tags=["budgets"],
)
def cancel_budget(
    budget_id: int,
    payload: BudgetCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Budget:
    return BudgetService(db).cancel(
        budget_id=budget_id, payload=payload, current_user=current_user
    )


@router.get(
    "/budgets/{budget_id}/settlement",
    response_model=BudgetSettlementReport,
    tags=["budgets"],
    dependencies=[Depends(ANY_STAFF)],
)
def budget_settlement(
    budget_id: int,
    db: Session = Depends(get_db),
) -> BudgetSettlementReport:
    return BudgetService(db).settlement_report(budget_id)


# ============================================================================
# PAYMENTS
# ============================================================================


@router.post(
    "/payments",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
    tags=["payments"],
)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(ANY_STAFF),
) -> Payment:
    return PaymentService(db).create(payload=payload, current_user=current_user)


@router.get(
    "/payments",
    response_model=Page[PaymentRead],
    tags=["payments"],
    dependencies=[Depends(ANY_STAFF)],
)
def list_payments(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    patient_id: Optional[int] = Query(default=None, ge=1),
    budget_id: Optional[int] = Query(default=None, ge=1),
    status_filter: Optional[PaymentStatus] = Query(
        default=None, alias="status", description="Filtra por status."
    ),
    from_dt: Optional[datetime] = Query(
        default=None,
        alias="from",
        description="Início (ISO 8601 com timezone). Aplica em paid_at por padrão.",
    ),
    to_dt: Optional[datetime] = Query(
        default=None,
        alias="to",
        description="Fim exclusivo (ISO 8601 com timezone).",
    ),
    date_field: str = Query(
        default="paid_at",
        description="Campo de data alvo do filtro: 'paid_at' (default) ou 'created_at'.",
        pattern="^(paid_at|created_at)$",
    ),
) -> Page[PaymentRead]:
    statuses = [status_filter] if status_filter else None
    items, total = PaymentService(db).list_paginated(
        params=params,
        patient_id=patient_id,
        budget_id=budget_id,
        statuses=statuses,
        from_dt=from_dt,
        to_dt=to_dt,
        date_field=date_field,
    )
    return Page[PaymentRead].build(
        items=[PaymentRead.model_validate(p) for p in items],
        total=total,
        params=params,
    )


@router.get(
    "/payments/{payment_id}",
    response_model=PaymentRead,
    tags=["payments"],
    dependencies=[Depends(ANY_STAFF)],
)
def get_payment(payment_id: int, db: Session = Depends(get_db)) -> Payment:
    return PaymentService(db).get_by_id(payment_id)


@router.get(
    "/patients/{patient_id}/payments",
    response_model=Page[PaymentRead],
    tags=["payments"],
    dependencies=[Depends(ANY_STAFF)],
)
def list_patient_payments(
    patient_id: int,
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> Page[PaymentRead]:
    items, total = PaymentService(db).list_paginated(
        params=params, patient_id=patient_id
    )
    return Page[PaymentRead].build(
        items=[PaymentRead.model_validate(p) for p in items],
        total=total,
        params=params,
    )


@router.get(
    "/budgets/{budget_id}/payments",
    response_model=Page[PaymentRead],
    tags=["payments"],
    dependencies=[Depends(ANY_STAFF)],
)
def list_budget_payments(
    budget_id: int,
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
) -> Page[PaymentRead]:
    items, total = PaymentService(db).list_paginated(
        params=params, budget_id=budget_id
    )
    return Page[PaymentRead].build(
        items=[PaymentRead.model_validate(p) for p in items],
        total=total,
        params=params,
    )


@router.patch(
    "/payments/{payment_id}",
    response_model=PaymentRead,
    tags=["payments"],
)
def update_payment(
    payment_id: int,
    payload: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Payment:
    return PaymentService(db).update(
        payment_id=payment_id, payload=payload, current_user=current_user
    )


@router.patch(
    "/payments/{payment_id}/status",
    response_model=PaymentRead,
    tags=["payments"],
)
def change_payment_status(
    payment_id: int,
    payload: PaymentStatusChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Payment:
    return PaymentService(db).change_status(
        payment_id=payment_id, payload=payload, current_user=current_user
    )


@router.patch(
    "/payments/{payment_id}/cancel",
    response_model=PaymentRead,
    tags=["payments"],
)
def cancel_payment(
    payment_id: int,
    payload: PaymentCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(CLINICAL_ONLY),
) -> Payment:
    return PaymentService(db).cancel(
        payment_id=payment_id, payload=payload, current_user=current_user
    )


# ============================================================================
# FINANCE REPORTS
# ============================================================================


@router.get(
    "/finance/revenue",
    response_model=RevenueReport,
    tags=["finance"],
    dependencies=[Depends(CLINICAL_ONLY)],
)
def revenue_in_period(
    db: Session = Depends(get_db),
    from_dt: datetime = Query(
        ...,
        alias="from",
        description="Início do período (ISO 8601 com timezone).",
    ),
    to_dt: datetime = Query(
        ...,
        alias="to",
        description="Fim exclusivo (ISO 8601 com timezone).",
    ),
) -> RevenueReport:
    return FinanceReportsService(db).revenue_in_period(start=from_dt, end=to_dt)


@router.get(
    "/finance/revenue/weekly",
    response_model=RevenueReport,
    tags=["finance"],
    dependencies=[Depends(CLINICAL_ONLY)],
)
def revenue_current_week(db: Session = Depends(get_db)) -> RevenueReport:
    return FinanceReportsService(db).revenue_current_week()


@router.get(
    "/finance/revenue/monthly",
    response_model=RevenueReport,
    tags=["finance"],
    dependencies=[Depends(CLINICAL_ONLY)],
)
def revenue_current_month(db: Session = Depends(get_db)) -> RevenueReport:
    return FinanceReportsService(db).revenue_current_month()


@router.get(
    "/finance/pending-payments",
    response_model=Page[PaymentRead],
    tags=["finance"],
    dependencies=[Depends(ANY_STAFF)],
)
def list_pending_payments(
    db: Session = Depends(get_db),
    params: PaginationParams = Depends(pagination_params),
    from_dt: Optional[datetime] = Query(
        default=None,
        alias="from",
        description="Filtra pagamentos com due_date a partir desta data.",
    ),
    to_dt: Optional[datetime] = Query(
        default=None,
        alias="to",
        description="Filtra pagamentos com due_date antes desta data (exclusivo).",
    ),
) -> Page[PaymentRead]:
    items, total = FinanceReportsService(db).list_pending_payments(
        params=params, from_due=from_dt, to_due=to_dt
    )
    return Page[PaymentRead].build(
        items=[PaymentRead.model_validate(p) for p in items],
        total=total,
        params=params,
    )


@router.get(
    "/finance/summary",
    response_model=FinanceSummary,
    tags=["finance"],
    dependencies=[Depends(CLINICAL_ONLY)],
)
def finance_summary(db: Session = Depends(get_db)) -> FinanceSummary:
    return FinanceReportsService(db).summary()
