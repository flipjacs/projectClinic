import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createProcedure,
  getProcedure,
  listProcedures,
  setProcedureActive,
  updateProcedure,
  type ListProceduresParams,
} from "../api/procedures-api";
import type { ProcedureInput } from "../types/procedure";

export const procedureKeys = {
  all: ["procedures"] as const,
  list: (params: ListProceduresParams) => ["procedures", "list", params] as const,
  detail: (id: number) => ["procedures", "detail", id] as const,
};

export function useProcedures(params: ListProceduresParams) {
  return useQuery({
    queryKey: procedureKeys.list(params),
    queryFn: () => listProcedures(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60_000,
  });
}

export function useProcedure(id: number) {
  return useQuery({
    queryKey: procedureKeys.detail(id),
    queryFn: () => getProcedure(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateProcedure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProcedureInput) => createProcedure(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: procedureKeys.all }),
  });
}

export function useUpdateProcedure(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProcedureInput) => updateProcedure(id, input),
    onSuccess: (procedure) => {
      qc.setQueryData(procedureKeys.detail(id), procedure);
      qc.invalidateQueries({ queryKey: procedureKeys.all });
    },
  });
}

export function useSetProcedureActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setProcedureActive(id, active),
    onSuccess: (procedure) => {
      qc.setQueryData(procedureKeys.detail(procedure.id), procedure);
      qc.invalidateQueries({ queryKey: procedureKeys.all });
    },
  });
}
