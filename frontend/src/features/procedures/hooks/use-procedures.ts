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
import { DEFAULT_PROCEDURES } from "../constants";
import type { ProcedureInput } from "../types/procedure";

export const procedureKeys = {
  all: ["procedures"] as const,
  list: (params: ListProceduresParams) => ["procedures", "list", params] as const,
  active: ["procedures", "active"] as const,
  detail: (id: number) => ["procedures", "detail", id] as const,
};

export function useProcedures(params: ListProceduresParams) {
  return useQuery({
    queryKey: procedureKeys.list(params),
    queryFn: () => listProcedures(params),
    placeholderData: keepPreviousData,
  });
}

/** Procedimentos ativos para montar orçamentos (cacheado). */
export function useActiveProcedures() {
  return useQuery({
    queryKey: procedureKeys.active,
    queryFn: () => listProcedures({ includeInactive: false, page: 1, pageSize: 100 }),
    staleTime: 5 * 60_000,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: procedureKeys.all }),
  });
}

export function useSetProcedureActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setProcedureActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: procedureKeys.all }),
  });
}

export interface SeedResult {
  created: number;
  failed: number;
  skipped: number;
}

/**
 * Cria o catálogo padrão de procedimentos, pulando os que já existem (comparação
 * por nome, sem diferenciar maiúsculas/acentos de espaço). Preço fica em 0,00
 * para a clínica ajustar depois. Como o backend não impõe nome único, a
 * deduplicação acontece aqui.
 */
export function useSeedDefaultProcedures() {
  const qc = useQueryClient();
  return useMutation<SeedResult>({
    mutationFn: async () => {
      const existing = await listProcedures({
        includeInactive: true,
        page: 1,
        pageSize: 100,
      });
      const have = new Set(existing.items.map((p) => p.name.trim().toLowerCase()));
      const missing = DEFAULT_PROCEDURES.filter(
        (name) => !have.has(name.trim().toLowerCase()),
      );
      const skipped = DEFAULT_PROCEDURES.length - missing.length;
      if (missing.length === 0) return { created: 0, failed: 0, skipped };

      const results = await Promise.allSettled(
        missing.map((name) =>
          createProcedure({
            name,
            description: null,
            base_price: "0.00",
            estimated_duration_minutes: null,
          }),
        ),
      );
      const created = results.filter((r) => r.status === "fulfilled").length;
      return { created, failed: results.length - created, skipped };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: procedureKeys.all }),
  });
}
