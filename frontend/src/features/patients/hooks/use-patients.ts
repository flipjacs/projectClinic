import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  activatePatient,
  createHealthInfo,
  createPatient,
  deactivatePatient,
  getHealthInfo,
  getPatient,
  listPatients,
  updateHealthInfo,
  updatePatient,
  type ListPatientsParams,
} from "../api/patients-api";
import type { PatientHealthInput, PatientInput } from "../types/patient";

export const patientKeys = {
  all: ["patients"] as const,
  list: (params: ListPatientsParams) => ["patients", "list", params] as const,
  detail: (id: number) => ["patients", "detail", id] as const,
  health: (id: number) => ["patients", "health", id] as const,
};

export function usePatientsList(params: ListPatientsParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => listPatients(params),
    placeholderData: keepPreviousData, // evita "piscar" ao paginar/buscar
  });
}

/**
 * Contagens para o resumo da lista (ativos e total). Duas consultas leves
 * (`page_size: 1`, só o `meta.total`) sob o prefixo ["patients"], então
 * invalidam junto com o resto ao cadastrar/(in)ativar.
 */
export function usePatientCounts() {
  const active = useQuery({
    queryKey: ["patients", "count", "active"] as const,
    queryFn: () => listPatients({ includeInactive: false, page: 1, pageSize: 1 }),
    staleTime: 60_000,
  });
  const all = useQuery({
    queryKey: ["patients", "count", "all"] as const,
    queryFn: () => listPatients({ includeInactive: true, page: 1, pageSize: 1 }),
    staleTime: 60_000,
  });
  return {
    total: all.data?.meta.total ?? 0,
    active: active.data?.meta.total ?? 0,
    inactive: (all.data?.meta.total ?? 0) - (active.data?.meta.total ?? 0),
    isLoading: active.isLoading || all.isLoading,
  };
}

export function usePatient(id: number) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => getPatient(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function usePatientHealth(id: number, enabled: boolean) {
  return useQuery({
    queryKey: patientKeys.health(id),
    queryFn: () => getHealthInfo(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
    retry: false, // 404 = ainda não cadastrado; não faz sentido repetir
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) => createPatient(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.all }),
  });
}

export function useUpdatePatient(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientInput) => updatePatient(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.all });
      qc.invalidateQueries({ queryKey: patientKeys.detail(id) });
    },
  });
}

export function useTogglePatientActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      active ? activatePatient(id) : deactivatePatient(id),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: patientKeys.all });
      qc.invalidateQueries({ queryKey: patientKeys.detail(vars.id) });
    },
  });
}

export function useSaveHealthInfo(patientId: number, exists: boolean) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientHealthInput) =>
      exists ? updateHealthInfo(patientId, input) : createHealthInfo(patientId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.health(patientId) }),
  });
}
