import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionTitle } from "@/components/layout/section-title";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import { financeErrorMessage } from "../constants";
import { CancelReasonDialog } from "../components/cancel-reason-dialog";
import { ChangePaymentStatusDialog } from "../components/change-payment-status-dialog";
import { EditPaymentDialog } from "../components/edit-payment-dialog";
import { FinanceSummaryCards } from "../components/finance-summary-cards";
import { PaymentFilters, type PaymentFiltersValue } from "../components/payment-filters";
import { PaymentsTable } from "../components/payments-table";
import { useCancelPayment, usePayments } from "../hooks/use-finance";
import { toast } from "@/stores/toast-store";
import type { Payment } from "../types/finance";

const PAGE_SIZE = 20;

const INITIAL_FILTERS: PaymentFiltersValue = {
  status: "",
  patientId: null,
  from: "",
  to: "",
};

export function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClinical = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const [filters, setFilters] = useState<PaymentFiltersValue>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);
  const [statusTarget, setStatusTarget] = useState<Payment | null>(null);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);

  const cancelMutation = useCancelPayment(cancelTarget?.id ?? 0);

  function updateFilters(next: Partial<PaymentFiltersValue>) {
    setFilters((f) => ({ ...f, ...next }));
    setPage(1);
  }

  const params = useMemo(
    () => ({
      status: filters.status || undefined,
      patientId: filters.patientId ?? undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [filters, page],
  );

  const { data, isLoading, isError, isFetching, refetch } = usePayments(params);
  const totalPages = data?.meta.total_pages ?? 0;

  async function confirmCancel(reason: string | null) {
    try {
      await cancelMutation.mutateAsync(reason);
      toast.success("Pagamento cancelado com sucesso.");
      setCancelTarget(null);
    } catch (error) {
      toast.error(financeErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Registre e acompanhe pagamentos da clínica."
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate("/finance")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={() => navigate("/payments/new")}>
              <Plus className="h-4 w-4" />
              Registrar pagamento
            </Button>
          </>
        }
      />

      {isClinical && (
        <section className="mb-6">
          <SectionTitle>Resumo financeiro</SectionTitle>
          <FinanceSummaryCards />
        </section>
      )}

      <PaymentFilters value={filters} onChange={updateFilters} />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar os pagamentos"
          onRetry={() => refetch()}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhum pagamento encontrado"
          description="Ajuste os filtros ou registre um novo pagamento."
        />
      ) : (
        <>
          <PaymentsTable
            payments={data.items}
            canCancel={isClinical}
            onCancel={setCancelTarget}
            onChangeStatus={isClinical ? setStatusTarget : undefined}
            onEdit={isClinical ? setEditTarget : undefined}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {data.meta.total} pagamento(s){isFetching ? " · atualizando…" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="px-1">
                  {page} / {Math.max(totalPages, 1)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      {cancelTarget && (
        <CancelReasonDialog
          title="Cancelar pagamento"
          description={`${cancelTarget.patient.name} · pagamento #${cancelTarget.id}`}
          confirmLabel="Cancelar pagamento"
          isLoading={cancelMutation.isPending}
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {statusTarget && (
        <ChangePaymentStatusDialog
          payment={statusTarget}
          onClose={() => setStatusTarget(null)}
        />
      )}

      {editTarget && (
        <EditPaymentDialog payment={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </>
  );
}
