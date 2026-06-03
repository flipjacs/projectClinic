import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveBudget,
  cancelBudget,
  createBudget,
  getBudget,
  getBudgetSettlement,
  listBudgets,
  rejectBudget,
  updateBudget,
  type ListBudgetsParams,
} from "../api/budgets-api";
import {
  getFinanceSummary,
  getMonthlyRevenue,
  getWeeklyRevenue,
  listPendingPayments,
  type PendingPaymentsParams,
} from "../api/finance-api";
import {
  cancelPayment,
  changePaymentStatus,
  createPayment,
  getPayment,
  listPayments,
  type ListPaymentsParams,
} from "../api/payments-api";
import type { BudgetCreateInput, PaymentCreateInput, PaymentStatus } from "../types/finance";

export const budgetKeys = {
  all: ["budgets"] as const,
  list: (params: ListBudgetsParams) => ["budgets", "list", params] as const,
  detail: (id: number) => ["budgets", "detail", id] as const,
  settlement: (id: number) => ["budgets", "settlement", id] as const,
};

export const paymentKeys = {
  all: ["payments"] as const,
  list: (params: ListPaymentsParams) => ["payments", "list", params] as const,
  detail: (id: number) => ["payments", "detail", id] as const,
  pending: (params: PendingPaymentsParams) => ["payments", "pending", params] as const,
};

export const financeKeys = {
  summary: ["finance", "summary"] as const,
  weekly: ["finance", "revenue", "weekly"] as const,
  monthly: ["finance", "revenue", "monthly"] as const,
};

export function useBudgets(params: ListBudgetsParams) {
  return useQuery({
    queryKey: budgetKeys.list(params),
    queryFn: () => listBudgets(params),
    placeholderData: keepPreviousData,
  });
}

export function useBudget(id: number) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: () => getBudget(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useBudgetSettlement(id: number) {
  return useQuery({
    queryKey: budgetKeys.settlement(id),
    queryFn: () => getBudgetSettlement(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetCreateInput) => createBudget(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: budgetKeys.all }),
  });
}

export function useUpdateBudget(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetCreateInput) => updateBudget(id, input),
    onSuccess: (budget) => {
      qc.setQueryData(budgetKeys.detail(id), budget);
      qc.invalidateQueries({ queryKey: budgetKeys.all });
      qc.invalidateQueries({ queryKey: budgetKeys.settlement(id) });
    },
  });
}

export function useApproveBudget(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => approveBudget(id),
    onSuccess: (budget) => {
      qc.setQueryData(budgetKeys.detail(id), budget);
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useRejectBudget(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => rejectBudget(id),
    onSuccess: (budget) => {
      qc.setQueryData(budgetKeys.detail(id), budget);
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useCancelBudget(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | null) => cancelBudget(id, reason),
    onSuccess: (budget) => {
      qc.setQueryData(budgetKeys.detail(id), budget);
      qc.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function usePayments(params: ListPaymentsParams) {
  return useQuery({
    queryKey: paymentKeys.list(params),
    queryFn: () => listPayments(params),
    placeholderData: keepPreviousData,
  });
}

export function usePayment(id: number) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => getPayment(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentCreateInput) => createPayment(input),
    onSuccess: (payment) => {
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: budgetKeys.all });
      qc.invalidateQueries({ queryKey: financeKeys.summary });
      if (payment.budget_id) {
        qc.invalidateQueries({ queryKey: budgetKeys.settlement(payment.budget_id) });
      }
    },
  });
}

export function useChangePaymentStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ status, paidAt }: { status: PaymentStatus; paidAt?: string | null }) =>
      changePaymentStatus(id, status, paidAt),
    onSuccess: (payment) => {
      qc.setQueryData(paymentKeys.detail(id), payment);
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: financeKeys.summary });
      if (payment.budget_id) {
        qc.invalidateQueries({ queryKey: budgetKeys.settlement(payment.budget_id) });
      }
    },
  });
}

export function useCancelPayment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | null) => cancelPayment(id, reason),
    onSuccess: (payment) => {
      qc.setQueryData(paymentKeys.detail(id), payment);
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: financeKeys.summary });
      if (payment.budget_id) {
        qc.invalidateQueries({ queryKey: budgetKeys.settlement(payment.budget_id) });
      }
    },
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: financeKeys.summary,
    queryFn: getFinanceSummary,
  });
}

export function useWeeklyRevenue() {
  return useQuery({
    queryKey: financeKeys.weekly,
    queryFn: getWeeklyRevenue,
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: financeKeys.monthly,
    queryFn: getMonthlyRevenue,
  });
}

export function usePendingPayments(params: PendingPaymentsParams) {
  return useQuery({
    queryKey: paymentKeys.pending(params),
    queryFn: () => listPendingPayments(params),
    placeholderData: keepPreviousData,
  });
}
