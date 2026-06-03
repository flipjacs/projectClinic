import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import { toMoneyPayload } from "@/utils/currency";
import type { Payment, PaymentCreateInput, PaymentStatus } from "../types/finance";

export interface ListPaymentsParams {
  patientId?: number;
  budgetId?: number;
  status?: PaymentStatus | "";
  from?: string;
  to?: string;
  dateField?: "paid_at" | "created_at";
  page?: number;
  pageSize?: number;
}

function serializePayment(input: PaymentCreateInput) {
  return {
    patient_id: input.patient_id,
    budget_id: input.budget_id || null,
    amount: toMoneyPayload(input.amount),
    payment_method: input.payment_method,
    status: input.status,
    paid_at: input.paid_at,
    due_date: input.due_date || null,
    notes: input.notes?.trim() || null,
  };
}

export async function listPayments(params: ListPaymentsParams): Promise<Paginated<Payment>> {
  const { data } = await api.get<Paginated<Payment>>("/payments", {
    params: {
      patient_id: params.patientId || undefined,
      budget_id: params.budgetId || undefined,
      status: params.status || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      date_field: params.dateField ?? "created_at",
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

export async function createPayment(input: PaymentCreateInput): Promise<Payment> {
  const { data } = await api.post<Payment>("/payments", serializePayment(input));
  return data;
}

export async function updatePayment(id: number, input: Partial<PaymentCreateInput>): Promise<Payment> {
  const { data } = await api.patch<Payment>(`/payments/${id}`, {
    payment_method: input.payment_method,
    paid_at: input.paid_at,
    due_date: input.due_date || null,
    notes: input.notes?.trim() || null,
  });
  return data;
}

export async function changePaymentStatus(
  id: number,
  status: PaymentStatus,
  paidAt?: string | null,
): Promise<Payment> {
  const { data } = await api.patch<Payment>(`/payments/${id}/status`, {
    status,
    paid_at: paidAt || null,
  });
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
