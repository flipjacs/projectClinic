import type { MoneyValue } from "@/utils/currency";

export type BudgetStatus = "draft" | "approved" | "rejected" | "canceled";

export type PaymentStatus = "pending" | "partially_paid" | "paid" | "canceled";

export type PaymentMethod =
  | "cash"
  | "pix"
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "other";

export interface PersonSummary {
  id: number;
  name: string;
}

export interface ProcedureSummary {
  id: number;
  name: string;
  base_price: MoneyValue;
}

export interface BudgetItem {
  id: number;
  budget_id: number;
  procedure_id: number;
  quantity: number;
  unit_price: MoneyValue;
  total_price: MoneyValue;
  created_at: string;
  updated_at: string;
  procedure: ProcedureSummary;
}

export interface Budget {
  id: number;
  patient_id: number;
  dentist_id: number;
  status: BudgetStatus;
  total_amount: MoneyValue;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items: BudgetItem[];
  patient: PersonSummary;
  dentist: PersonSummary;
}

export interface BudgetItemInput {
  procedure_id: number;
  quantity: number;
  unit_price?: string | null;
}

export interface BudgetCreateInput {
  patient_id: number;
  dentist_id: number;
  notes: string | null;
  items: BudgetItemInput[];
}

export interface Payment {
  id: number;
  patient_id: number;
  budget_id: number | null;
  amount: MoneyValue;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
  canceled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  patient: PersonSummary;
}

export interface PaymentCreateInput {
  patient_id: number;
  budget_id: number | null;
  amount: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
}

/**
 * Edição parcial de um pagamento (PATCH /payments/{id}). O backend não permite
 * alterar `patient_id`, `budget_id`, `amount` nem `status` por aqui.
 */
export interface PaymentUpdateInput {
  payment_method: PaymentMethod;
  paid_at: string | null;
  due_date: string | null;
  notes: string | null;
}

export interface BudgetSettlement {
  budget_id: number;
  total_amount: MoneyValue;
  total_paid: MoneyValue;
  total_pending: MoneyValue;
}

export interface FinanceSummary {
  total_paid_current_month: MoneyValue;
  total_paid_current_week: MoneyValue;
  total_pending: MoneyValue;
  total_canceled: MoneyValue;
  number_of_paid_payments: number;
  number_of_pending_payments: number;
}
