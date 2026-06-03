import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import { toMoneyPayload } from "@/utils/currency";
import type {
  Budget,
  BudgetCreateInput,
  BudgetSettlement,
  BudgetStatus,
} from "../types/finance";

export interface ListBudgetsParams {
  patientId?: number;
  dentistId?: number;
  status?: BudgetStatus | "";
  includeCanceled?: boolean;
  page?: number;
  pageSize?: number;
}

function serializeBudget(input: BudgetCreateInput) {
  return {
    patient_id: input.patient_id,
    dentist_id: input.dentist_id,
    notes: input.notes?.trim() || null,
    items: input.items.map((item) => ({
      procedure_id: item.procedure_id,
      quantity: item.quantity,
      unit_price: item.unit_price ? toMoneyPayload(item.unit_price) : null,
    })),
  };
}

export async function listBudgets(params: ListBudgetsParams): Promise<Paginated<Budget>> {
  const { data } = await api.get<Paginated<Budget>>("/budgets", {
    params: {
      patient_id: params.patientId || undefined,
      dentist_id: params.dentistId || undefined,
      status: params.status || undefined,
      include_canceled: params.includeCanceled || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

export async function getBudget(id: number): Promise<Budget> {
  const { data } = await api.get<Budget>(`/budgets/${id}`);
  return data;
}

export async function createBudget(input: BudgetCreateInput): Promise<Budget> {
  const { data } = await api.post<Budget>("/budgets", serializeBudget(input));
  return data;
}

export async function updateBudget(id: number, input: BudgetCreateInput): Promise<Budget> {
  const { data } = await api.patch<Budget>(`/budgets/${id}`, {
    notes: input.notes?.trim() || null,
    items: serializeBudget(input).items,
  });
  return data;
}

export async function approveBudget(id: number): Promise<Budget> {
  const { data } = await api.patch<Budget>(`/budgets/${id}/approve`);
  return data;
}

export async function rejectBudget(id: number): Promise<Budget> {
  const { data } = await api.patch<Budget>(`/budgets/${id}/reject`);
  return data;
}

export async function cancelBudget(id: number, reason: string | null): Promise<Budget> {
  const { data } = await api.patch<Budget>(`/budgets/${id}/cancel`, { reason });
  return data;
}

export async function changeBudgetStatus(id: number, status: BudgetStatus): Promise<Budget> {
  const { data } = await api.patch<Budget>(`/budgets/${id}/status`, { status });
  return data;
}

export async function getBudgetSettlement(id: number): Promise<BudgetSettlement> {
  const { data } = await api.get<BudgetSettlement>(`/budgets/${id}/settlement`);
  return data;
}
