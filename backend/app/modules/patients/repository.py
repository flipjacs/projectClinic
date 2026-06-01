from __future__ import annotations

from typing import Optional, Sequence

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.patients.models import Patient, PatientHealthInfo
from app.shared.validators import only_digits


class PatientRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ----- single -----
    def get(self, patient_id: int) -> Optional[Patient]:
        return self.db.get(Patient, patient_id)

    def get_by_cpf(self, cpf: str) -> Optional[Patient]:
        stmt = select(Patient).where(Patient.cpf == cpf)
        return self.db.execute(stmt).scalar_one_or_none()

    # ----- list / search -----
    def search(
        self,
        *,
        term: Optional[str],
        include_inactive: bool,
        offset: int,
        limit: int,
    ) -> tuple[Sequence[Patient], int]:
        base = select(Patient)
        count_base = select(func.count(Patient.id))

        if not include_inactive:
            base = base.where(Patient.is_active.is_(True))
            count_base = count_base.where(Patient.is_active.is_(True))

        if term:
            term_clean = term.strip()
            digits = only_digits(term_clean)

            conditions = [Patient.name.ilike(f"%{term_clean}%")]
            if digits:
                # Permite busca por CPF parcial e telefone parcial (já armazenados sem máscara).
                conditions.append(Patient.cpf.like(f"%{digits}%"))
                conditions.append(Patient.phone.like(f"%{digits}%"))

            cond = or_(*conditions)
            base = base.where(cond)
            count_base = count_base.where(cond)

        total = self.db.execute(count_base).scalar_one()

        stmt = base.order_by(Patient.name.asc(), Patient.id.asc()).offset(offset).limit(limit)
        items = self.db.execute(stmt).scalars().all()
        return items, total

    # ----- mutations -----
    def add(self, patient: Patient) -> Patient:
        self.db.add(patient)
        self.db.flush()
        self.db.refresh(patient)
        return patient

    def save(self, patient: Patient) -> Patient:
        self.db.flush()
        self.db.refresh(patient)
        return patient


class PatientHealthInfoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_patient(self, patient_id: int) -> Optional[PatientHealthInfo]:
        stmt = select(PatientHealthInfo).where(PatientHealthInfo.patient_id == patient_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def add(self, info: PatientHealthInfo) -> PatientHealthInfo:
        self.db.add(info)
        self.db.flush()
        self.db.refresh(info)
        return info

    def save(self, info: PatientHealthInfo) -> PatientHealthInfo:
        self.db.flush()
        self.db.refresh(info)
        return info
