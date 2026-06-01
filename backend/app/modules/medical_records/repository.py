from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.medical_records.models import MedicalRecord


class MedicalRecordRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get(self, record_id: int) -> Optional[MedicalRecord]:
        return self.db.get(MedicalRecord, record_id)

    def list_for_patient(
        self,
        *,
        patient_id: int,
        dentist_id: Optional[int] = None,
        include_inactive: bool,
        offset: int,
        limit: int,
    ) -> tuple[Sequence[MedicalRecord], int]:
        base = select(MedicalRecord).where(MedicalRecord.patient_id == patient_id)
        count_base = select(func.count(MedicalRecord.id)).where(
            MedicalRecord.patient_id == patient_id
        )

        if dentist_id is not None:
            base = base.where(MedicalRecord.dentist_id == dentist_id)
            count_base = count_base.where(MedicalRecord.dentist_id == dentist_id)

        if not include_inactive:
            base = base.where(MedicalRecord.is_active.is_(True))
            count_base = count_base.where(MedicalRecord.is_active.is_(True))

        total = self.db.execute(count_base).scalar_one()

        # Histórico do mais recente para o mais antigo (visit_date).
        # created_at quebra empate quando há mais de um registro no mesmo dia.
        stmt = (
            base.order_by(
                MedicalRecord.visit_date.desc(),
                MedicalRecord.created_at.desc(),
                MedicalRecord.id.desc(),
            )
            .offset(offset)
            .limit(limit)
        )
        items = self.db.execute(stmt).scalars().all()
        return items, total

    def add(self, record: MedicalRecord) -> MedicalRecord:
        self.db.add(record)
        self.db.flush()
        self.db.refresh(record)
        return record

    def save(self, record: MedicalRecord) -> MedicalRecord:
        self.db.flush()
        self.db.refresh(record)
        return record
