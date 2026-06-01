from __future__ import annotations

from decimal import Decimal
from typing import Optional

from sqlalchemy.orm import Session

from app.modules.procedures.models import Procedure
from app.modules.procedures.repository import ProcedureRepository
from app.modules.procedures.schemas import ProcedureCreate, ProcedureUpdate
from app.shared.exceptions import NotFoundError
from app.shared.pagination import PaginationParams


class ProcedureService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = ProcedureRepository(db)

    # ----- queries -----
    def get_by_id(self, procedure_id: int) -> Procedure:
        proc = self.repo.get(procedure_id)
        if not proc:
            raise NotFoundError("Procedimento não encontrado")
        return proc

    def list_paginated(
        self,
        *,
        term: Optional[str],
        include_inactive: bool,
        params: PaginationParams,
    ) -> tuple[list[Procedure], int]:
        items, total = self.repo.search(
            term=term,
            include_inactive=include_inactive,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    # ----- mutations -----
    def create(self, payload: ProcedureCreate) -> Procedure:
        proc = Procedure(
            name=payload.name,
            description=payload.description,
            base_price=Decimal(payload.base_price).quantize(Decimal("0.01")),
            estimated_duration_minutes=payload.estimated_duration_minutes,
            is_active=True,
        )
        self.repo.add(proc)
        self.db.commit()
        self.db.refresh(proc)
        return proc

    def update(self, procedure_id: int, payload: ProcedureUpdate) -> Procedure:
        proc = self.get_by_id(procedure_id)
        data = payload.model_dump(exclude_unset=True)

        # Garante que base_price chega como Decimal com 2 casas.
        if "base_price" in data and data["base_price"] is not None:
            data["base_price"] = Decimal(data["base_price"]).quantize(Decimal("0.01"))

        for field, value in data.items():
            setattr(proc, field, value)

        self.repo.save(proc)
        self.db.commit()
        self.db.refresh(proc)
        return proc

    def set_active(self, procedure_id: int, active: bool) -> Procedure:
        proc = self.get_by_id(procedure_id)
        if proc.is_active == active:
            return proc
        proc.is_active = active
        self.repo.save(proc)
        self.db.commit()
        self.db.refresh(proc)
        return proc
