import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type { FinanceSummary, Payment } from "../types/finance";

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const { data } = await api.get<FinanceSummary>("/finance/summary");
  return data;
}

export interface PendingPaymentsParams {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listPendingPayments(
  params: PendingPaymentsParams = {},
): Promise<Paginated<Payment>> {
  const { data } = await api.get<Paginated<Payment>>("/finance/pending-payments", {
    params: {
      from: params.from || undefined,
      to: params.to || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}
