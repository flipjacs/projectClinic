import { ArrowLeft, Ban, CheckCircle2, CreditCard, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { formatMoney } from "@/utils/currency";
import { formatDateOnly } from "@/utils/format";
import { PaymentsTable } from "../components/payments-table";
import { BudgetStatusBadge } from "../components/budget-status-badge";
import {
  useApproveBudget,
  useBudget,
  useBudgetSettlement,
  useCancelBudget,
  usePayments,
  useRejectBudget,
} from "../hooks/use-finance";

export function BudgetDetailsPage() {
  const navigate = useNavigate();
  const { budgetId: budgetIdParam } = useParams();
  const budgetId = Number(budgetIdParam);
  const { user } = useAuth();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const budgetQuery = useBudget(budgetId);
  const settlementQuery = useBudgetSettlement(budgetId);
  const paymentsQuery = usePayments({ budgetId, page: 1, pageSize: 20 });
  const approveMutation = useApproveBudget(budgetId);
  const rejectMutation = useRejectBudget(budgetId);
  const cancelMutation = useCancelBudget(budgetId);

  if (budgetQuery.isLoading) return <Loading fullPage label="Carregando orçamento…" />;
  if (budgetQuery.isError || !budgetQuery.data) {
    const apiError = toApiError(budgetQuery.error);
    return (
      <>
        <PageHeader title="Orçamento" />
        <ErrorState
          title={apiError.status === 403 ? "Acesso restrito" : "Não foi possível carregar os dados"}
          message={apiError.message}
          onRetry={apiError.status === 403 ? undefined : () => budgetQuery.refetch()}
        />
      </>
    );
  }

  const budget = budgetQuery.data;
  const isCanceled = budget.status === "canceled";
  const isDraft = budget.status === "draft";
  const isTerminal = budget.status === "rejected" || budget.status === "canceled";
  const canReceivePayment = budget.status === "draft" || budget.status === "approved";

  async function approve() {
    try {
      await approveMutation.mutateAsync();
      toast.success("Orçamento aprovado.");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function reject() {
    try {
      await rejectMutation.mutateAsync();
      toast.success("Orçamento rejeitado.");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function cancel() {
    try {
      await cancelMutation.mutateAsync(cancelReason || null);
      toast.success("Orçamento cancelado.");
      setCancelOpen(false);
      setCancelReason("");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  return (
    <>
      <PageHeader
        title={`Orçamento #${budget.id}`}
        description={`${budget.patient.name} · Dr(a). ${budget.dentist.name}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => navigate("/budgets")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            {canReceivePayment && (
              <Button
                onClick={() => navigate(`/payments/new?budgetId=${budget.id}`)}
                variant="secondary"
              >
                <CreditCard className="h-4 w-4" />
                Registrar pagamento
              </Button>
            )}
            {canManage && isDraft && (
              <>
                <Button variant="outline" onClick={approve} isLoading={approveMutation.isPending}>
                  <CheckCircle2 className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button variant="secondary" onClick={reject} isLoading={rejectMutation.isPending}>
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </Button>
              </>
            )}
            {canManage && !isTerminal && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <Ban className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      {isCanceled && (
        <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Este orçamento está cancelado.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Itens do orçamento</CardTitle>
              <BudgetStatusBadge status={budget.status} />
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-line">
                  <thead>
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
                      <th className="py-2 pr-4">Procedimento</th>
                      <th className="py-2 pr-4">Qtd.</th>
                      <th className="py-2 pr-4">Unitário</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {budget.items.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-3 pr-4 font-medium text-ink">{item.procedure.name}</td>
                        <td className="py-3 pr-4 text-ink-soft">{item.quantity}</td>
                        <td className="py-3 pr-4 text-ink-soft">{formatMoney(item.unit_price)}</td>
                        <td className="py-3 text-right font-semibold text-ink">
                          {formatMoney(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {budget.notes && (
                <div className="mt-5 rounded-xl bg-graphite-50 px-4 py-3 text-sm text-ink-soft">
                  {budget.notes}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamentos deste orçamento</CardTitle>
            </CardHeader>
            <CardBody>
              {paymentsQuery.isLoading ? (
                <Loading label="Carregando pagamentos…" />
              ) : paymentsQuery.isError ? (
                <ErrorState message={toApiError(paymentsQuery.error).message} onRetry={() => paymentsQuery.refetch()} />
              ) : !paymentsQuery.data || paymentsQuery.data.items.length === 0 ? (
                <EmptyState
                  title="Nenhum pagamento encontrado"
                  description="Registre o primeiro pagamento vinculado a este orçamento."
                />
              ) : (
                <PaymentsTable payments={paymentsQuery.data.items} />
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs text-ink-mute">Criado em</p>
              <p className="font-medium text-ink">{formatDateOnly(budget.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-mute">Total final</p>
              <p className="text-3xl font-semibold tracking-tight text-ink">
                {formatMoney(budget.total_amount)}
              </p>
              <p className="mt-1 text-xs text-ink-mute">O total final é calculado pelo sistema.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-graphite-50 p-3">
                <p className="text-xs text-ink-mute">Valor recebido</p>
                <p className="font-semibold text-ink">
                  {formatMoney(settlementQuery.data?.total_paid)}
                </p>
              </div>
              <div className="rounded-xl bg-gold-50 p-3">
                <p className="text-xs text-gold-800">Valor pendente</p>
                <p className="font-semibold text-ink">
                  {formatMoney(settlementQuery.data?.total_pending)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancelar orçamento">
        <div className="space-y-4">
          <Textarea
            label="Motivo do cancelamento (opcional)"
            rows={3}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelMutation.isPending}>
              Voltar
            </Button>
            <Button variant="danger" onClick={cancel} isLoading={cancelMutation.isPending}>
              Cancelar orçamento
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
