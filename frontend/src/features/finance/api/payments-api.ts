import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type {
  Payment,
  PaymentCreateInput,
  PaymentStatus,
  PaymentUpdateInput,
} from "../types/finance";

export interface ListPaymentsParams {
  patientId?: number;
  budgetId?: number;
  status?: PaymentStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listPayments(
  params: ListPaymentsParams,
): Promise<Paginated<Payment>> {
  const { data } = await api.get<Paginated<Payment>>("/payments", {
    params: {
      patient_id: params.patientId || undefined,
      budget_id: params.budgetId || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

export async function getPayment(id: number): Promise<Payment> {
  const { data } = await api.get<Payment>(`/payments/${id}`);
  return data;
}

export async function listBudgetPayments(
  budgetId: number,
): Promise<Paginated<Payment>> {
  const { data } = await api.get<Paginated<Payment>>(`/budgets/${budgetId}/payments`, {
    params: { page: 1, page_size: 100 },
  });
  return data;
}

export async function createPayment(input: PaymentCreateInput): Promise<Payment> {
  const { data } = await api.post<Payment>("/payments", input);
  return data;
}

export async function cancelPayment(
  id: number,
  cancellationReason: string | null,
): Promise<Payment> {
  const { data } = await api.patch<Payment>(`/payments/${id}/cancel`, {
    cancellation_reason: cancellationReason,
  });
  return data;
}

export async function changePaymentStatus(
  id: number,
  status: PaymentStatus,
): Promise<Payment> {
  const { data } = await api.patch<Payment>(`/payments/${id}/status`, { status });
  return data;
}

export async function updatePayment(
  id: number,
  input: PaymentUpdateInput,
): Promise<Payment> {
  const { data } = await api.patch<Payment>(`/payments/${id}`, input);
  return data;
}
