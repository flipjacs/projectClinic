from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.modules.audit.service import AuditLogService
from app.modules.patients.models import Patient, PatientHealthInfo
from app.modules.patients.repository import (
    PatientHealthInfoRepository,
    PatientRepository,
)
from app.modules.patients.schemas import (
    PatientCreate,
    PatientHealthInfoCreate,
    PatientHealthInfoUpdate,
    PatientUpdate,
)
from app.modules.users.models import User
from app.shared.exceptions import AlreadyExistsError, NotFoundError, ValidationError
from app.shared.pagination import PaginationParams


class PatientService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = PatientRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get_by_id(self, patient_id: int) -> Patient:
        patient = self.repo.get(patient_id)
        if not patient:
            raise NotFoundError("Paciente não encontrado")
        return patient

    def list_paginated(
        self,
        *,
        term: Optional[str],
        include_inactive: bool,
        params: PaginationParams,
    ) -> tuple[list[Patient], int]:
        items, total = self.repo.search(
            term=term,
            include_inactive=include_inactive,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    # ----- mutations -----
    def create(self, payload: PatientCreate, current_user: User) -> Patient:
        if self.repo.get_by_cpf(payload.cpf):
            raise AlreadyExistsError("Já existe um paciente com este CPF")

        patient = Patient(
            name=payload.name,
            cpf=payload.cpf,
            birth_date=payload.birth_date,
            phone=payload.phone,
            email=payload.email,
            street=payload.street,
            number=payload.number,
            neighborhood=payload.neighborhood,
            city=payload.city,
            state=payload.state,
            zip_code=payload.zip_code,
            is_active=True,
        )
        self.repo.add(patient)
        self.audit.record(
            actor_user_id=current_user.id,
            action="patient.create",
            entity_type="patient",
            entity_id=patient.id,
            summary="Paciente criado",
        )
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def update(self, patient_id: int, payload: PatientUpdate, current_user: User) -> Patient:
        patient = self.get_by_id(patient_id)
        data = payload.model_dump(exclude_unset=True)

        if "cpf" in data and data["cpf"] and data["cpf"] != patient.cpf:
            existing = self.repo.get_by_cpf(data["cpf"])
            if existing and existing.id != patient.id:
                raise AlreadyExistsError("Já existe um paciente com este CPF")

        for field, value in data.items():
            setattr(patient, field, value)

        self.repo.save(patient)
        self.audit.record(
            actor_user_id=current_user.id,
            action="patient.update",
            entity_type="patient",
            entity_id=patient.id,
            summary="Paciente atualizado",
            metadata={"fields": sorted(data.keys())},
        )
        self.db.commit()
        self.db.refresh(patient)
        return patient

    def set_active(self, patient_id: int, active: bool, current_user: User) -> Patient:
        patient = self.get_by_id(patient_id)
        if patient.is_active == active:
            return patient
        patient.is_active = active
        self.repo.save(patient)
        self.audit.record(
            actor_user_id=current_user.id,
            action="patient.activate" if active else "patient.deactivate",
            entity_type="patient",
            entity_id=patient.id,
            summary="Paciente ativado" if active else "Paciente inativado",
        )
        self.db.commit()
        self.db.refresh(patient)
        return patient


class PatientHealthInfoService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.info_repo = PatientHealthInfoRepository(db)
        self.patient_repo = PatientRepository(db)
        self.audit = AuditLogService(db)

    def _ensure_patient(self, patient_id: int) -> Patient:
        patient = self.patient_repo.get(patient_id)
        if not patient:
            raise NotFoundError("Paciente não encontrado")
        return patient

    def _validate_health_consistency(
        self,
        *,
        has_disease: bool,
        disease_description: Optional[str],
        has_allergy: bool,
        allergy_description: Optional[str],
        uses_medication: bool,
        medication_description: Optional[str],
    ) -> None:
        checks = [
            (has_disease, disease_description, "disease_description"),
            (has_allergy, allergy_description, "allergy_description"),
            (uses_medication, medication_description, "medication_description"),
        ]
        for flag, description, field_name in checks:
            if flag and not (description and description.strip()):
                raise ValidationError(
                    f"'{field_name}' é obrigatório quando a flag correspondente for verdadeira"
                )

    def get(self, patient_id: int) -> PatientHealthInfo:
        self._ensure_patient(patient_id)
        info = self.info_repo.get_by_patient(patient_id)
        if not info:
            raise NotFoundError("Informações de saúde não cadastradas para este paciente")
        return info

    def get_optional(self, patient_id: int) -> Optional[PatientHealthInfo]:
        return self.info_repo.get_by_patient(patient_id)

    def create(
        self,
        patient_id: int,
        payload: PatientHealthInfoCreate,
        current_user: User,
    ) -> PatientHealthInfo:
        self._ensure_patient(patient_id)
        if self.info_repo.get_by_patient(patient_id):
            raise AlreadyExistsError(
                "Informações de saúde já cadastradas; use PATCH para atualizar"
            )

        self._validate_health_consistency(
            has_disease=payload.has_disease,
            disease_description=payload.disease_description,
            has_allergy=payload.has_allergy,
            allergy_description=payload.allergy_description,
            uses_medication=payload.uses_medication,
            medication_description=payload.medication_description,
        )

        info = PatientHealthInfo(
            patient_id=patient_id,
            has_disease=payload.has_disease,
            disease_description=payload.disease_description,
            has_allergy=payload.has_allergy,
            allergy_description=payload.allergy_description,
            uses_medication=payload.uses_medication,
            medication_description=payload.medication_description,
            health_observations=payload.health_observations,
        )
        self.info_repo.add(info)
        self.audit.record(
            actor_user_id=current_user.id,
            action="patient_health_info.create",
            entity_type="patient",
            entity_id=patient_id,
            summary="Informações de saúde criadas",
        )
        self.db.commit()
        self.db.refresh(info)
        return info

    def update(
        self,
        patient_id: int,
        payload: PatientHealthInfoUpdate,
        current_user: User,
    ) -> PatientHealthInfo:
        info = self.get(patient_id)
        data = payload.model_dump(exclude_unset=True)
        final_state = {
            "has_disease": info.has_disease,
            "disease_description": info.disease_description,
            "has_allergy": info.has_allergy,
            "allergy_description": info.allergy_description,
            "uses_medication": info.uses_medication,
            "medication_description": info.medication_description,
        }
        final_state.update(
            {key: value for key, value in data.items() if key in final_state}
        )
        self._validate_health_consistency(**final_state)
        for field, value in data.items():
            setattr(info, field, value)
        self.info_repo.save(info)
        self.audit.record(
            actor_user_id=current_user.id,
            action="patient_health_info.update",
            entity_type="patient",
            entity_id=patient_id,
            summary="Informações de saúde atualizadas",
            metadata={"fields": sorted(data.keys())},
        )
        self.db.commit()
        self.db.refresh(info)
        return info
