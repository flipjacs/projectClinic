from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.permissions import Role
from app.modules.audit.service import AuditLogService
from app.modules.appointments.repository import AppointmentRepository
from app.modules.medical_records.models import MedicalRecord
from app.modules.medical_records.repository import MedicalRecordRepository
from app.modules.medical_records.schemas import (
    MedicalRecordCreate,
    MedicalRecordUpdate,
)
from app.modules.patients.repository import PatientRepository
from app.modules.users.models import User
from app.shared.exceptions import ForbiddenError, NotFoundError, ValidationError
from app.shared.pagination import PaginationParams


class MedicalRecordService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = MedicalRecordRepository(db)
        self.appointment_repo = AppointmentRepository(db)
        self.patient_repo = PatientRepository(db)
        self.audit = AuditLogService(db)

    # ----- queries -----
    def get_by_id(self, record_id: int, current_user: User | None = None) -> MedicalRecord:
        record = self.repo.get(record_id)
        if not record:
            raise NotFoundError("Prontuário não encontrado")
        if current_user is not None:
            self._ensure_record_access(record, current_user)
        return record

    def list_for_patient(
        self,
        *,
        patient_id: int,
        include_inactive: bool,
        params: PaginationParams,
        current_user: User,
    ) -> tuple[list[MedicalRecord], int]:
        if not self.patient_repo.get(patient_id):
            raise NotFoundError("Paciente não encontrado")

        items, total = self.repo.list_for_patient(
            patient_id=patient_id,
            dentist_id=current_user.id if current_user.role == Role.DENTIST else None,
            include_inactive=include_inactive,
            offset=params.offset,
            limit=params.limit,
        )
        return list(items), total

    def _ensure_record_access(self, record: MedicalRecord, current_user: User) -> None:
        if current_user.role == Role.ADMIN:
            return
        if current_user.role == Role.DENTIST and record.dentist_id == current_user.id:
            return
        raise ForbiddenError("Acesso negado para este prontuário")

    def _ensure_appointment_matches_patient(
        self,
        *,
        appointment_id: int | None,
        patient_id: int,
    ) -> None:
        if appointment_id is None:
            return
        appointment = self.appointment_repo.get(appointment_id)
        if not appointment:
            raise NotFoundError("Consulta vinculada ao prontuário não encontrada")
        if appointment.patient_id != patient_id:
            raise ValidationError(
                "Consulta vinculada pertence a outro paciente"
            )

    # ----- mutations -----
    def create(
        self,
        *,
        patient_id: int,
        payload: MedicalRecordCreate,
        current_user: User,
    ) -> MedicalRecord:
        patient = self.patient_repo.get(patient_id)
        if not patient:
            raise NotFoundError("Paciente não encontrado")

        # Regra: paciente inativo só recebe novo prontuário se o autor for ADMIN.
        if not patient.is_active and current_user.role != Role.ADMIN:
            raise ValidationError(
                "Paciente inativo. Apenas ADMIN pode registrar prontuário nesta condição"
            )

        self._ensure_appointment_matches_patient(
            appointment_id=payload.appointment_id,
            patient_id=patient.id,
        )

        record = MedicalRecord(
            patient_id=patient.id,
            dentist_id=current_user.id,
            appointment_id=payload.appointment_id,
            visit_date=payload.visit_date,
            main_complaint=payload.main_complaint,
            diagnosis=payload.diagnosis,
            performed_procedure=payload.performed_procedure,
            clinical_evolution=payload.clinical_evolution,
            observations=payload.observations,
            is_active=True,
        )
        self.repo.add(record)
        self.audit.record(
            actor_user_id=current_user.id,
            action="medical_record.create",
            entity_type="medical_record",
            entity_id=record.id,
            summary="Prontuário criado",
        )
        self.db.commit()
        self.db.refresh(record)
        return record

    def update(
        self,
        *,
        record_id: int,
        payload: MedicalRecordUpdate,
        current_user: User,
    ) -> MedicalRecord:
        record = self.get_by_id(record_id, current_user=current_user)

        if not record.is_active:
            raise ValidationError(
                "Prontuário inativo. Reative antes de editar"
            )

        data = payload.model_dump(exclude_unset=True)

        # patient_id, dentist_id e is_active jamais mudam por update normal.
        for field in ("patient_id", "dentist_id", "is_active"):
            data.pop(field, None)

        if "appointment_id" in data:
            self._ensure_appointment_matches_patient(
                appointment_id=data["appointment_id"],
                patient_id=record.patient_id,
            )

        for field, value in data.items():
            setattr(record, field, value)

        self.repo.save(record)
        self.audit.record(
            actor_user_id=current_user.id,
            action="medical_record.update",
            entity_type="medical_record",
            entity_id=record.id,
            summary="Prontuário atualizado",
            metadata={"fields": sorted(data.keys())},
        )
        self.db.commit()
        self.db.refresh(record)
        return record

    def set_active(
        self,
        *,
        record_id: int,
        active: bool,
        current_user: User,
    ) -> MedicalRecord:
        record = self.get_by_id(record_id, current_user=current_user)
        if record.is_active == active:
            return record
        record.is_active = active
        self.repo.save(record)
        self.audit.record(
            actor_user_id=current_user.id,
            action="medical_record.activate" if active else "medical_record.deactivate",
            entity_type="medical_record",
            entity_id=record.id,
            summary="Prontuário ativado" if active else "Prontuário inativado",
        )
        self.db.commit()
        self.db.refresh(record)
        return record
