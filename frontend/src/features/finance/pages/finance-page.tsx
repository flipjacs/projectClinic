import { FileText, Plus, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toApiError } from "@/lib/api";
import { formatMoney } from "@/utils/currency";
import { formatDateOnly } from "@/utils/format";
import { FinanceSummaryCards } from "../components/finance-summary-cards";
import { PaymentStatusBadge } from "../components/payment-status-badge";
import {
  useFinanceSummary,
  useMonthlyRevenue,
  usePendingPayments,
  useWeeklyRevenue,
} from "../hooks/use-finance";

export function FinancePage() {
  const navigate = useNavigate();
  const summary = useFinanceSummary();
  const weekly = useWeeklyRevenue();
  const monthly = useMonthlyRevenue();
  const pending = usePendingPayments({ page: 1, pageSize: 6 });

  const isLoading = summary.isLoading || weekly.isLoading || monthly.isLoading;
  const isError = summary.isError || weekly.isError || monthly.isError;
  const error = summary.error ?? weekly.error ?? monthly.error;

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Resumo simples de valores recebidos e pendências."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => navigate("/budgets/new")}>
              <FileText className="h-4 w-4" />
              Novo orçamento
            </Button>
            <Button onClick={() => navigate("/payments/new")}>
              <Plus className="h-4 w-4" />
              Registrar pagamento
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title={toApiError(error).status === 403 ? "Acesso restrito" : undefined}
          message={toApiError(error).message}
          onRetry={toApiError(error).status === 403 ? undefined : () => summary.refetch()}
        />
      ) : (
        <FinanceSummaryCards
          summary={summary.data}
          weekly={weekly.data}
          monthly={monthly.data}
        />
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos pendentes</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => navigate("/payments")}>
              Ver todos
            </Button>
          </CardHeader>
          <CardBody>
            {pending.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : pending.isError ? (
              <ErrorState message={toApiError(pending.error).message} onRetry={() => pending.refetch()} />
            ) : !pending.data || pending.data.items.length === 0 ? (
              <EmptyState
                title="Nenhum pagamento encontrado"
                description="Não há pagamentos pendentes no momento."
              />
            ) : (
              <div className="divide-y divide-line">
                {pending.data.items.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-ink">{payment.patient.name}</p>
                      <p className="text-xs text-ink-mute">
                        {payment.due_date ? `Vence em ${formatDateOnly(payment.due_date)}` : "Sem vencimento"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-ink">{formatMoney(payment.amount)}</span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <Button className="w-full justify-start" onClick={() => navigate("/payments/new")}>
              <Receipt className="h-4 w-4" />
              Registrar pagamento
            </Button>
            <Button
              className="w-full justify-start"
              variant="secondary"
              onClick={() => navigate("/budgets/new")}
            >
              <FileText className="h-4 w-4" />
              Novo orçamento
            </Button>
            <p className="text-xs leading-relaxed text-ink-mute">
              O painel mostra apenas valores confirmados pelo backend. Não use totais
              estimados de orçamento como fechamento financeiro.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
