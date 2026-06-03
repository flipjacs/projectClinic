import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type { MedicalRecord, MedicalRecordInput } from "../types/medical-record";

export interface ListMedicalRecordsParams {
  patientId: number;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Converte strings vazias dos campos opcionais em `null` antes de enviar
 * (o backend trata `null` como "sem informação"). A queixa principal é sempre
 * obrigatória, então não é normalizada para null.
 */
function serialize(input: MedicalRecordInput) {
  const nullable = (v: string | null) => (v && v.trim() ? v.trim() : null);
  return {
    visit_date: input.visit_date,
    main_complaint: input.main_complaint.trim(),
    diagnosis: nullable(input.diagnosis),
    performed_procedure: nullable(input.performed_procedure),
    clinical_evolution: nullable(input.clinical_evolution),
    observations: nullable(input.observations),
  };
}

export async function listMedicalRecords(
  params: ListMedicalRecordsParams,
): Promise<Paginated<MedicalRecord>> {
  const { data } = await api.get<Paginated<MedicalRecord>>(
    `/patients/${params.patientId}/medical-records`,
    {
      params: {
        include_inactive: params.includeInactive || undefined,
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
      },
    },
  );
  return data;
}

export async function getMedicalRecord(recordId: number): Promise<MedicalRecord> {
  const { data } = await api.get<MedicalRecord>(`/medical-records/${recordId}`);
  return data;
}

export async function createMedicalRecord(
  patientId: number,
  input: MedicalRecordInput,
): Promise<MedicalRecord> {
  const { data } = await api.post<MedicalRecord>(
    `/patients/${patientId}/medical-records`,
    serialize(input),
  );
  return data;
}

export async function updateMedicalRecord(
  recordId: number,
  input: MedicalRecordInput,
): Promise<MedicalRecord> {
  const { data } = await api.patch<MedicalRecord>(
    `/medical-records/${recordId}`,
    serialize(input),
  );
  return data;
}

export async function setMedicalRecordActive(
  recordId: number,
  active: boolean,
): Promise<MedicalRecord> {
  const action = active ? "activate" : "deactivate";
  const { data } = await api.patch<MedicalRecord>(`/medical-records/${recordId}/${action}`);
  return data;
}
