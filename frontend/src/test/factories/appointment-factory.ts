import type { Appointment } from "@/features/appointments/types/appointment";

export function makeAppointment(input: Partial<Appointment> = {}): Appointment {
  return {
    id: input.id ?? 1,
    patient_id: input.patient_id ?? 1,
    dentist_id: input.dentist_id ?? 2,
    scheduled_start: input.scheduled_start ?? "2026-01-10T13:00:00Z",
    scheduled_end: input.scheduled_end ?? "2026-01-10T13:30:00Z",
    status: input.status ?? "scheduled",
    reason: input.reason ?? "Consulta de teste",
    notes: input.notes ?? null,
    rescheduled_count: input.rescheduled_count ?? 0,
    original_start: input.original_start ?? null,
    canceled_at: input.canceled_at ?? null,
    cancellation_reason: input.cancellation_reason ?? null,
    created_at: input.created_at ?? "2026-01-10T12:00:00Z",
    updated_at: input.updated_at ?? "2026-01-10T12:00:00Z",
    patient: input.patient ?? { id: 1, name: "Paciente Teste" },
    dentist: input.dentist ?? { id: 2, name: "Dra. Teste" },
  };
}
