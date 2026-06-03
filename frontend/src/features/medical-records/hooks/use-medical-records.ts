import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createMedicalRecord,
  getMedicalRecord,
  listMedicalRecords,
  setMedicalRecordActive,
  updateMedicalRecord,
  type ListMedicalRecordsParams,
} from "../api/medical-records-api";
import type { MedicalRecordInput } from "../types/medical-record";

export const medicalRecordKeys = {
  all: ["medical-records"] as const,
  /** Tudo de um paciente (prefixo — invalida todas as combinações de filtro). */
  patient: (patientId: number) => ["medical-records", "patient", patientId] as const,
  list: (params: ListMedicalRecordsParams) =>
    ["medical-records", "patient", params.patientId, params] as const,
  detail: (recordId: number) => ["medical-records", "detail", recordId] as const,
};

/** Histórico paginado de um paciente. */
export function useMedicalRecords(params: ListMedicalRecordsParams) {
  return useQuery({
    queryKey: medicalRecordKeys.list(params),
    queryFn: () => listMedicalRecords(params),
    enabled: Number.isFinite(params.patientId) && params.patientId > 0,
    placeholderData: keepPreviousData, // evita "piscar" ao paginar
  });
}

/** Um prontuário específico. */
export function useMedicalRecord(recordId: number) {
  return useQuery({
    queryKey: medicalRecordKeys.detail(recordId),
    queryFn: () => getMedicalRecord(recordId),
    enabled: Number.isFinite(recordId) && recordId > 0,
  });
}

export function useCreateMedicalRecord(patientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicalRecordInput) => createMedicalRecord(patientId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: medicalRecordKeys.patient(patientId) });
    },
  });
}

export function useUpdateMedicalRecord(recordId: number, patientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicalRecordInput) => updateMedicalRecord(recordId, input),
    onSuccess: (record) => {
      qc.setQueryData(medicalRecordKeys.detail(recordId), record);
      qc.invalidateQueries({ queryKey: medicalRecordKeys.patient(patientId) });
    },
  });
}

export function useSetMedicalRecordActive(recordId: number, patientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => setMedicalRecordActive(recordId, active),
    onSuccess: (record) => {
      qc.setQueryData(medicalRecordKeys.detail(recordId), record);
      qc.invalidateQueries({ queryKey: medicalRecordKeys.patient(patientId) });
    },
  });
}
