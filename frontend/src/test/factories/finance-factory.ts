import type { Budget, FinanceSummary, Payment } from "@/features/finance/types/finance";

export function makeFinanceSummary(input: Partial<FinanceSummary> = {}): FinanceSummary {
  return {
    total_paid_current_month: input.total_paid_current_month ?? "12500.00",
    total_paid_current_week: input.total_paid_current_week ?? "3200.00",
    total_pending: input.total_pending ?? "1800.00",
    total_canceled: input.total_canceled ?? "250.00",
    number_of_paid_payments: input.number_of_paid_payments ?? 8,
    number_of_pending_payments: input.number_of_pending_payments ?? 3,
  };
}

export function makeBudget(input: Partial<Budget> = {}): Budget {
  return {
    id: input.id ?? 1,
    patient_id: input.patient_id ?? 1,
    dentist_id: input.dentist_id ?? 2,
    status: input.status ?? "draft",
    total_amount: input.total_amount ?? "500.00",
    notes: input.notes ?? null,
    created_at: input.created_at ?? "2026-01-10T12:00:00Z",
    updated_at: input.updated_at ?? "2026-01-10T12:00:00Z",
    patient: input.patient ?? { id: 1, name: "Paciente Teste" },
    dentist: input.dentist ?? { id: 2, name: "Dra. Teste" },
    items: input.items ?? [],
  };
}

export function makePayment(input: Partial<Payment> = {}): Payment {
  return {
    id: input.id ?? 1,
    patient_id: input.patient_id ?? 1,
    budget_id: input.budget_id ?? 1,
    amount: input.amount ?? "200.00",
    payment_method: input.payment_method ?? "pix",
    status: input.status ?? "paid",
    paid_at: input.paid_at ?? "2026-01-10T12:00:00Z",
    due_date: input.due_date ?? null,
    notes: input.notes ?? null,
    canceled_at: input.canceled_at ?? null,
    cancellation_reason: input.cancellation_reason ?? null,
    created_at: input.created_at ?? "2026-01-10T12:00:00Z",
    updated_at: input.updated_at ?? "2026-01-10T12:00:00Z",
    patient: input.patient ?? { id: 1, name: "Paciente Teste" },
  };
}
