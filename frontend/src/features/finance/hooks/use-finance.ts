import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import {
  getFinanceSummary,
  getMonthlyRevenue,
  getWeeklyRevenue,
  listPendingPayments,
  type PendingPaymentsParams,
} from "../api/finance-api";
import {
  approveBudget,
  cancelBudget,
  createBudget,
  getBudget,
  getBudgetSettlement,
  listBudgets,
  rejectBudget,
  type ListBudgetsParams,
} from "../api/budgets-api";
import {
  cancelPayment,
  changePaymentStatus,
  createPayment,
  getPayment,
  listBudgetPayments,
  listPayments,
  updatePayment,
  type ListPaymentsParams,
} from "../api/payments-api";
import type {
  BudgetCreateInput,
  PaymentCreateInput,
  PaymentStatus,
  PaymentUpdateInput,
} from "../types/finance";

export const financeKeys = {
  all: ["finance"] as const,
  summary: ["finance", "summary"] as const,
  revenueWeekly: ["finance", "revenue", "weekly"] as const,
  revenueMonthly: ["finance", "revenue", "monthly"] as const,
  pending: (params: PendingPaymentsParams) => ["finance", "pending", params] as const,
};

export const budgetKeys = {
  all: ["budgets"] as const,
  list: (params: ListBudgetsParams) => ["budgets", "list", params] as const,
  detail: (id: number) => ["budgets", "detail", id] as const,
  settlement: (id: number) => ["budgets", "settlement", id] as const,
  payments: (id: number) => ["budgets", "payments", id] as const,
};

export const paymentKeys = {
  all: ["payments"] as const,
  list: (params: ListPaymentsParams) => ["payments", "list", params] as const,
  detail: (id: number) => ["payments", "detail", id] as const,
};

/** Invalida tudo que valores afetam (pagamento muda resumo, pendências, settlement). */
function invalidateMoney(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: paymentKeys.all });
  qc.invalidateQueries({ queryKey: budgetKeys.all });
  qc.invalidateQueries({ queryKey: financeKeys.all });
}

// ===== Finance reports (clínico) =====

function useIsClinical() {
  const { user } = useAuth();
  return user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;
}

export function useFinanceSummary() {
  const isClinical = useIsClinical();
  return useQuery({
    queryKey: financeKeys.summary,
    queryFn: getFinanceSummary,
    enabled: isClinical,
    staleTime: 60_000,
  });
}

export function useWeeklyRevenue() {
  const isClinical = useIsClinical();
  return useQuery({
    queryKey: financeKeys.revenueWeekly,
    queryFn: getWeeklyRevenue,
    enabled: isClinical,
    staleTime: 60_000,
  });
}

export function useMonthlyRevenue() {
  const isClinical = useIsClinical();
  return useQuery({
    queryKey: financeKeys.revenueMonthly,
    queryFn: getMonthlyRevenue,
    enabled: isClinical,
    staleTime: 60_000,
  });
}

export function usePendingPayments(params: PendingPaymentsParams = {}) {
  return useQuery({
    queryKey: financeKeys.pending(params),
    queryFn: () => listPendingPayments(params),
    placeholderData: keepPreviousData,
  });
}

// ===== Budgets =====

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

export function useBudgetPayments(id: number) {
  return useQuery({
    queryKey: budgetKeys.payments(id),
    queryFn: () => listBudgetPayments(id),
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

export function useBudgetActions(id: number) {
  const qc = useQueryClient();
  const onSuccess = () => invalidateMoney(qc);
  return {
    approve: useMutation({ mutationFn: () => approveBudget(id), onSuccess }),
    reject: useMutation({ mutationFn: () => rejectBudget(id), onSuccess }),
    cancel: useMutation({
      mutationFn: (reason: string | null) => cancelBudget(id, reason),
      onSuccess,
    }),
  };
}

// ===== Payments =====

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
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useCancelPayment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | null) => cancelPayment(id, reason),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useChangePaymentStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: PaymentStatus) => changePaymentStatus(id, status),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useUpdatePayment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PaymentUpdateInput) => updatePayment(id, input),
    onSuccess: () => invalidateMoney(qc),
  });
}
