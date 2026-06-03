/** Status de uma consulta (espelha o backend, lowercase). */
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "canceled"
  | "no_show";

/** Pessoa resumida embutida na consulta (paciente/dentista). */
export interface PersonSummary {
  id: number;
  name: string;
}

/** Consulta (GET /appointments/{id} e itens da listagem). */
export interface Appointment {
  id: number;
  patient_id: number;
  dentist_id: number;

  scheduled_start: string; // ISO 8601
  scheduled_end: string; // ISO 8601
  status: AppointmentStatus;

  reason: string | null;
  notes: string | null;

  rescheduled_count: number;
  original_start: string | null;

  canceled_at: string | null;
  cancellation_reason: string | null;

  created_at: string;
  updated_at: string;

  patient: PersonSummary;
  dentist: PersonSummary;
}

/** Profissional disponível para agendamento. */
export interface Dentist {
  id: number;
  name: string;
}

/** Payload de criação (POST /appointments) — datas em ISO com timezone. */
export interface AppointmentCreateInput {
  patient_id: number;
  dentist_id: number;
  scheduled_start: string;
  scheduled_end: string;
  reason: string | null;
  notes: string | null;
}

/** Payload de remarcação (PATCH .../reschedule). */
export interface AppointmentRescheduleInput {
  scheduled_start: string;
  scheduled_end: string;
  reason: string | null;
}
