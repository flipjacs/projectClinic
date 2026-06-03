import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import { onlyDigits } from "@/utils/masks";
import type {
  Patient,
  PatientHealthInfo,
  PatientHealthInput,
  PatientInput,
  PatientListItem,
} from "../types/patient";

export interface ListPatientsParams {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

/** Normaliza campos mascarados para dígitos antes de enviar ao backend. */
function serializePatient(input: PatientInput) {
  return {
    ...input,
    cpf: onlyDigits(input.cpf),
    phone: onlyDigits(input.phone),
    zip_code: onlyDigits(input.zip_code),
    email: input.email ? input.email : null,
  };
}

export async function listPatients(
  params: ListPatientsParams,
): Promise<Paginated<PatientListItem>> {
  const { data } = await api.get<Paginated<PatientListItem>>("/patients", {
    params: {
      search: params.search || undefined,
      include_inactive: params.includeInactive || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

export async function getPatient(id: number): Promise<Patient> {
  const { data } = await api.get<Patient>(`/patients/${id}`);
  return data;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const { data } = await api.post<Patient>("/patients", serializePatient(input));
  return data;
}

export async function updatePatient(id: number, input: PatientInput): Promise<Patient> {
  const { data } = await api.patch<Patient>(`/patients/${id}`, serializePatient(input));
  return data;
}

export async function deactivatePatient(id: number): Promise<Patient> {
  const { data } = await api.patch<Patient>(`/patients/${id}/deactivate`);
  return data;
}

export async function activatePatient(id: number): Promise<Patient> {
  const { data } = await api.patch<Patient>(`/patients/${id}/activate`);
  return data;
}

// --- Health info (clínico) --------------------------------------------------
export async function getHealthInfo(patientId: number): Promise<PatientHealthInfo> {
  const { data } = await api.get<PatientHealthInfo>(`/patients/${patientId}/health-info`);
  return data;
}

export async function createHealthInfo(
  patientId: number,
  input: PatientHealthInput,
): Promise<PatientHealthInfo> {
  const { data } = await api.post<PatientHealthInfo>(
    `/patients/${patientId}/health-info`,
    input,
  );
  return data;
}

export async function updateHealthInfo(
  patientId: number,
  input: PatientHealthInput,
): Promise<PatientHealthInfo> {
  const { data } = await api.patch<PatientHealthInfo>(
    `/patients/${patientId}/health-info`,
    input,
  );
  return data;
}
