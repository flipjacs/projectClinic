import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import { toMoneyPayload } from "@/utils/currency";
import type { Procedure, ProcedureInput } from "../types/procedure";

export interface ListProceduresParams {
  search?: string;
  includeInactive?: boolean;
  page?: number;
  pageSize?: number;
}

function serialize(input: ProcedureInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || null,
    base_price: toMoneyPayload(input.base_price),
    estimated_duration_minutes: input.estimated_duration_minutes || null,
  };
}

export async function listProcedures(
  params: ListProceduresParams,
): Promise<Paginated<Procedure>> {
  const { data } = await api.get<Paginated<Procedure>>("/procedures", {
    params: {
      search: params.search || undefined,
      include_inactive: params.includeInactive || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

export async function getProcedure(id: number): Promise<Procedure> {
  const { data } = await api.get<Procedure>(`/procedures/${id}`);
  return data;
}

export async function createProcedure(input: ProcedureInput): Promise<Procedure> {
  const { data } = await api.post<Procedure>("/procedures", serialize(input));
  return data;
}

export async function updateProcedure(id: number, input: ProcedureInput): Promise<Procedure> {
  const { data } = await api.patch<Procedure>(`/procedures/${id}`, serialize(input));
  return data;
}

export async function setProcedureActive(id: number, active: boolean): Promise<Procedure> {
  const action = active ? "activate" : "deactivate";
  const { data } = await api.patch<Procedure>(`/procedures/${id}/${action}`);
  return data;
}
