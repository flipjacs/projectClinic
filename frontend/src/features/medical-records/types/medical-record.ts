/** Snapshot do dentista responsável, embutido no prontuário. */
export interface DentistSummary {
  id: number;
  name: string;
}

/**
 * Prontuário odontológico (GET /medical-records/{id} e itens da listagem).
 * Espelha MedicalRecordRead do backend.
 */
export interface MedicalRecord {
  id: number;
  patient_id: number;
  dentist_id: number;
  appointment_id: number | null;

  visit_date: string; // YYYY-MM-DD
  main_complaint: string;
  diagnosis: string | null;
  performed_procedure: string | null;
  clinical_evolution: string | null;
  observations: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;

  dentist: DentistSummary;
}

/**
 * Payload de criação/edição. `dentist_id` NÃO é enviado: o backend o define a
 * partir do usuário autenticado. Campos opcionais vão como `null` quando vazios.
 */
export interface MedicalRecordInput {
  visit_date: string;
  main_complaint: string;
  diagnosis: string | null;
  performed_procedure: string | null;
  clinical_evolution: string | null;
  observations: string | null;
}
