import type { MedicalRecord } from "@/features/medical-records/types/medical-record";

export function makeMedicalRecord(input: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: input.id ?? 1,
    patient_id: input.patient_id ?? 1,
    dentist_id: input.dentist_id ?? 2,
    appointment_id: input.appointment_id ?? null,
    visit_date: input.visit_date ?? "2026-01-10",
    main_complaint: input.main_complaint ?? "Queixa de teste",
    diagnosis: input.diagnosis ?? "Diagnóstico de teste",
    performed_procedure: input.performed_procedure ?? null,
    clinical_evolution: input.clinical_evolution ?? null,
    observations: input.observations ?? null,
    is_active: input.is_active ?? true,
    created_at: input.created_at ?? "2026-01-10T12:00:00Z",
    updated_at: input.updated_at ?? "2026-01-10T12:00:00Z",
    dentist: input.dentist ?? { id: 2, name: "Dra. Teste" },
  };
}
