from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.procedures.models import Procedure


class ProcedureRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, procedure_id: int) -> Optional[Procedure]:
        return self.db.get(Procedure, procedure_id)

    def search(
        self,
        *,
        term: Optional[str],
        include_inactive: bool,
        offset: int,
        limit: int,
    ) -> tuple[Sequence[Procedure], int]:
        base = select(Procedure)
        count_base = select(func.count(Procedure.id))

        if not include_inactive:
            base = base.where(Procedure.is_active.is_(True))
            count_base = count_base.where(Procedure.is_active.is_(True))

        if term:
            t = term.strip()
            if t:
                base = base.where(Procedure.name.ilike(f"%{t}%"))
                count_base = count_base.where(Procedure.name.ilike(f"%{t}%"))

        total = self.db.execute(count_base).scalar_one()
        stmt = (
            base.order_by(Procedure.name.asc(), Procedure.id.asc())
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def add(self, procedure: Procedure) -> Procedure:
        self.db.add(procedure)
        self.db.flush()
        self.db.refresh(procedure)
        return procedure

    def save(self, procedure: Procedure) -> Procedure:
        self.db.flush()
        self.db.refresh(procedure)
        return procedure
