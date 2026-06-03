import { ArrowLeft, Check, Plus, X, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { formatMoney } from "@/utils/currency";
import { CancelReasonDialog } from "../components/cancel-reason-dialog";
import { BudgetStatusBadge } from "../components/budget-status-badge";
import { PaymentsTable } from "../components/payments-table";
import { financeErrorMessage, TERMINAL_BUDGET_STATUSES } from "../constants";
import {
  useBudget,
  useBudgetActions,
  useBudgetPayments,
  useBudgetSettlement,
} from "../hooks/use-finance";

function SettlementRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-ink-mute">{label}</span>
      <span className={strong ? "text-sm font-semibold text-ink" : "text-sm text-ink"}>{value}</span>
    </div>
  );
}

export function BudgetDetailsPage() {
  const navigate = useNavigate();
  const { budgetId } = useParams();
  const id = Number(budgetId);
  const { user } = useAuth();
  const isClinical = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const { data: budget, isLoading, isError, error, refetch } = useBudget(id);
  const settlement = useBudgetSettlement(id);
  const payments = useBudgetPayments(id);
  const actions = useBudgetActions(id);

  const [cancelOpen, setCancelOpen] = useState(false);

  if (isLoading) return <Loading fullPage label="Carregando orçamento…" />;
  if (isError || !budget) {
    const apiError = toApiError(error);
    return (
      <>
        <PageHeader title="Orçamento" />
        <ErrorState
          title={apiError.status === 403 ? "Acesso restrito" : "Não foi possível carregar os dados"}
          message={apiError.message}
          onRetry={apiError.status === 403 ? undefined : () => refetch()}
        />
      </>
    );
  }

  const isTerminal = TERMINAL_BUDGET_STATUSES.includes(budget.status);
  const isDraft = budget.status === "draft";

  async function runAction(
    label: string,
    run: () => Promise<unknown>,
  ) {
    try {
      await run();
      toast.success(label);
    } catch (err) {
      toast.error(financeErrorMessage(err));
    }
  }

  function goToNewPayment() {
    navigate("/payments/new", {
      state: { patientId: budget!.patient_id, patientName: budget!.patient.name, budgetId: budget!.id },
    });
  }

  return (
    <>
      <PageHeader
        title={`Orçamento #${budget.id}`}
        description={`${budget.patient.name} · Dr(a). ${budget.dentist.name}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/budgets")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            {isClinical && isDraft && (
              <>
                <Button
                  onClick={() => runAction("Orçamento aprovado.", () => actions.approve.mutateAsync())}
                  isLoading={actions.approve.isPending}
                >
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => runAction("Orçamento rejeitado.", () => actions.reject.mutateAsync())}
                  isLoading={actions.reject.isPending}
                >
                  <X className="h-4 w-4" />
                  Rejeitar
                </Button>
              </>
            )}
            {isClinical && !isTerminal && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Procedimentos</CardTitle>
              <BudgetStatusBadge status={budget.status} />
            </CardHeader>
            <CardBody className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-line text-sm">
                  <thead className="bg-graphite-50">
                    <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
                      <th className="px-5 py-2.5">Procedimento</th>
                      <th className="px-5 py-2.5">Qtd</th>
                      <th className="px-5 py-2.5">Valor unit.</th>
                      <th className="px-5 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {budget.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-5 py-2.5 font-medium text-ink">{item.procedure.name}</td>
                        <td className="px-5 py-2.5 text-ink-soft">{item.quantity}</td>
                        <td className="px-5 py-2.5 text-ink-soft">{formatMoney(item.unit_price)}</td>
                        <td className="px-5 py-2.5 text-right font-medium text-ink">
                          {formatMoney(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-line bg-graphite-50/60">
                      <td colSpan={3} className="px-5 py-3 font-medium text-ink-mute">
                        Total do orçamento
                      </td>
                      <td className="px-5 py-3 text-right text-base font-semibold text-ink">
                        {formatMoney(budget.total_amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {budget.notes && (
                <p className="border-t border-line px-5 py-3 text-sm text-ink-soft">{budget.notes}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamentos do orçamento</CardTitle>
              <Button size="sm" onClick={goToNewPayment}>
                <Plus className="h-4 w-4" />
                Registrar pagamento
              </Button>
            </CardHeader>
            <CardBody className="p-0">
              {payments.isLoading ? (
                <div className="p-5">
                  <Loading label="Carregando pagamentos…" />
                </div>
              ) : !payments.data || payments.data.items.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="Nenhum pagamento encontrado"
                    description="Registre o primeiro pagamento deste orçamento."
                  />
                </div>
              ) : (
                <PaymentsTable payments={payments.data.items} hidePatient />
              )}
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardBody>
              {settlement.isLoading ? (
                <Loading label="Calculando…" />
              ) : settlement.data ? (
                <>
                  <SettlementRow label="Total" value={formatMoney(settlement.data.total_amount)} />
                  <SettlementRow label="Pago" value={formatMoney(settlement.data.total_paid)} />
                  <div className="mt-1 border-t border-line pt-2">
                    <SettlementRow
                      label="Pendente"
                      value={formatMoney(settlement.data.total_pending)}
                      strong
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-mute">Resumo indisponível.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {cancelOpen && (
        <CancelReasonDialog
          title="Cancelar orçamento"
          description={`Orçamento #${budget.id} de ${budget.patient.name}.`}
          confirmLabel="Cancelar orçamento"
          isLoading={actions.cancel.isPending}
          onConfirm={async (reason) => {
            await runAction("Orçamento cancelado.", () => actions.cancel.mutateAsync(reason));
            setCancelOpen(false);
          }}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </>
  );
}
