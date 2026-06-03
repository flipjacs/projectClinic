import { apiErrorDetail, toApiError } from "@/lib/api";
import type { BudgetStatus, PaymentMethod, PaymentStatus } from "./types/finance";

type Tone = "gold" | "neutral" | "success" | "warning" | "danger" | "info";

// ===========================================================================
// Budget
// ===========================================================================

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  draft: "Rascunho",
  approved: "Aprovado",
  rejected: "Rejeitado",
  canceled: "Cancelado",
};

export const BUDGET_STATUS_TONES: Record<BudgetStatus, Tone> = {
  draft: "gold",
  approved: "success",
  rejected: "danger",
  canceled: "neutral",
};

export const BUDGET_STATUS_ORDER: BudgetStatus[] = [
  "draft",
  "approved",
  "rejected",
  "canceled",
];

/** Status terminais do orçamento (não admitem aprovar/rejeitar/cancelar). */
export const TERMINAL_BUDGET_STATUSES: BudgetStatus[] = ["rejected", "canceled"];

// ===========================================================================
// Payment
// ===========================================================================

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendente",
  partially_paid: "Parcial",
  paid: "Pago",
  canceled: "Cancelado",
};

export const PAYMENT_STATUS_TONES: Record<PaymentStatus, Tone> = {
  pending: "warning",
  partially_paid: "info",
  paid: "success",
  canceled: "neutral",
};

export const PAYMENT_STATUS_ORDER: PaymentStatus[] = [
  "pending",
  "partially_paid",
  "paid",
  "canceled",
];

/** Status escolhíveis ao registrar um pagamento (cancelado tem fluxo próprio). */
export const PAYMENT_STATUS_FORM_OPTIONS: PaymentStatus[] = [
  "paid",
  "partially_paid",
  "pending",
];

/**
 * Transições de status permitidas (espelham o backend). O cancelamento tem
 * fluxo próprio (com motivo), por isso é omitido aqui — usa-se o diálogo de
 * cancelar.
 */
export const PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["partially_paid", "paid"],
  partially_paid: ["paid"],
  paid: [],
  canceled: [],
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Transferência",
  other: "Outro",
};

/** Labels curtas para colunas/badges compactos (a tabela e os cards mobile). */
export const PAYMENT_METHOD_SHORT_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Crédito",
  debit_card: "Débito",
  bank_transfer: "Transferência",
  other: "Outro",
};

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = [
  "pix",
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "other",
];

// ===========================================================================
// Helpers de data (input "YYYY-MM-DD" <-> ISO)
// ===========================================================================

/** Converte "YYYY-MM-DD" em ISO no meio-dia local (evita salto de fuso). */
export function dateInputToIso(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0).toISOString();
}

/** Extrai "YYYY-MM-DD" local de um ISO (vazio quando nulo). */
export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "";
  const off = dt.getTimezoneOffset();
  return new Date(dt.getTime() - off * 60_000).toISOString().slice(0, 10);
}

// ===========================================================================
// Erros amigáveis
// ===========================================================================

/**
 * Mensagem humana para erros financeiros. As mensagens de domínio do backend
 * (422 com `detail` string) são curadas em PT e seguras para exibir; erros
 * estruturais e técnicos nunca chegam ao usuário.
 */
export function financeErrorMessage(error: unknown, fallback?: string): string {
  const apiError = toApiError(error);
  if (apiError.status === 403) return "Você não tem permissão para esta ação.";
  if (apiError.status === 409) {
    return "Conflito com o estado atual. Atualize a tela e tente novamente.";
  }
  if (apiError.status === 422) {
    const detail = apiErrorDetail(error);
    if (detail) {
      if (/(excede|ultrapass)/i.test(detail) && /orçament/i.test(detail)) {
        return "Este pagamento ultrapassa o valor do orçamento.";
      }
      return detail;
    }
    return fallback ?? "Não foi possível concluir. Revise os dados e tente novamente.";
  }
  return apiError.message;
}
