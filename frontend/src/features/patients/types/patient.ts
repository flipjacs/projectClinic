/** Item enxuto retornado na listagem (sem CPF/endereço). */
export interface PatientListItem {
  id: number;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

/** Paciente completo (GET /patients/{id}). */
export interface Patient {
  id: number;
  name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  email: string | null;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload de criação/edição (campos pessoais). */
export interface PatientInput {
  name: string;
  cpf: string;
  birth_date: string;
  phone: string;
  email?: string | null;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

/** Informações de saúde (clínico). */
export interface PatientHealthInfo {
  id: number;
  patient_id: number;
  has_disease: boolean;
  disease_description: string | null;
  has_allergy: boolean;
  allergy_description: string | null;
  uses_medication: boolean;
  medication_description: string | null;
  health_observations: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientHealthInput {
  has_disease: boolean;
  disease_description?: string | null;
  has_allergy: boolean;
  allergy_description?: string | null;
  uses_medication: boolean;
  medication_description?: string | null;
  health_observations?: string | null;
}
