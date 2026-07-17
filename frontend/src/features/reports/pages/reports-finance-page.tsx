import { AlertTriangle, Ban, Coins, Receipt, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { Card, CardBody } from "@/components/ui/card";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/features/finance/constants";
import type { PaymentStatus } from "@/features/finance/types/finance";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/utils/currency";
import { formatDateOnly } from "@/utils/format";
import { PaymentChart } from "../components/charts/payment-chart";
import { RevenueChart } from "../components/charts/revenue-chart";
import { MetricCard } from "../components/metric-card";
import { ReportShell } from "../components/report-shell";
import { ChartCard } from "../components/report-section";
import { useFinanceReport } from "../hooks/use-reports";
import { useReportPeriod } from "../utils/period";
import { toNum } from "../utils/report-format";
import type { PendingPaymentSnapshot } from "../types/reports";

const STATUS_TONE: Record<PaymentStatus, "warning" | "gold" | "success" | "neutral"> = {
  pending: "warning",
  partially_paid: "gold",
  paid: "success",
  canceled: "neutral",
};

function isOverdue(due: string | null): boolean {
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${due}T00:00:00`) < today;
}

function PendingTable({ rows }: { rows: PendingPaymentSnapshot[] }) {
  return (
    <>
      <div className="space-y-3 sm:hidden">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/patients/${p.patient_id}`}
                className="text-sm font-medium text-gold-700 hover:underline"
              >
                Paciente #{p.patient_id}
              </Link>
              <span className="text-base font-semibold tabular-nums text-ink">
                {formatMoney(p.amount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-mute">
              <span>{PAYMENT_METHOD_LABELS[p.payment_method]}</span>
              <span className={isOverdue(p.due_date) ? "font-medium text-red-600" : ""}>
                {p.due_date ? `vence ${formatDateOnly(p.due_date)}` : "sem vencimento"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-graphite-50">
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3">Paciente</th>
              <th className="px-5 py-3 text-right">Valor</th>
              <th className="px-5 py-3">Método</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Vencimento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-canvas/60">
                <td className="px-5 py-3">
                  <Link
                    to={`/patients/${p.patient_id}`}
                    className="font-medium text-gold-700 hover:underline"
                  >
                    Paciente #{p.patient_id}
                  </Link>
                </td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-ink">
                  {formatMoney(p.amount)}
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {PAYMENT_METHOD_LABELS[p.payment_method]}
                </td>
                <td className="px-5 py-3">
                  <Badge tone={STATUS_TONE[p.status]}>{PAYMENT_STATUS_LABELS[p.status]}</Badge>
                </td>
                <td
                  className={`px-5 py-3 ${
                    isOverdue(p.due_date) ? "font-medium text-red-600" : "text-ink-soft"
                  }`}
                >
                  {p.due_date ? formatDateOnly(p.due_date) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ReportsFinancePage() {
  const period = useReportPeriod();
  const range = { start_date: period.start_date, end_date: period.end_date };
  const fin = useFinanceReport(range);

  const paid = fin.data ? toNum(fin.data.total_paid) : 0;
  const ticket =
    fin.data && fin.data.paid_payments_count > 0 ? paid / fin.data.paid_payments_count : 0;

  return (
    <ReportShell
      title="Relatórios · Financeiro"
      description="Receita, recebimentos e pendências do período."
    >
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Receita recebida"
          value={formatMoney(paid)}
          icon={Wallet}
          highlight
          hint={`${fin.data?.paid_payments_count ?? 0} recebimento(s)`}
          isLoading={fin.isLoading}
        />
        <MetricCard
          label="A receber"
          value={formatMoney(fin.data ? toNum(fin.data.total_pending) : 0)}
          icon={Receipt}
          hint={`${fin.data?.pending_payments_count ?? 0} pendência(s)`}
          isLoading={fin.isLoading}
        />
        <MetricCard
          label="Cancelado"
          value={formatMoney(fin.data ? toNum(fin.data.total_canceled) : 0)}
          icon={Ban}
          isLoading={fin.isLoading}
        />
        <MetricCard
          label="Ticket médio"
          value={formatMoney(ticket)}
          icon={Coins}
          hint="Receita ÷ recebimentos"
          isLoading={fin.isLoading}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Receita no período"
          subtitle="Valores recebidos por dia"
          isLoading={fin.isLoading}
          isError={fin.isError}
          isEmpty={!fin.data || fin.data.revenue_by_day.length === 0}
          onRetry={() => fin.refetch()}
        >
          {fin.data && <RevenueChart data={fin.data.revenue_by_day} />}
        </ChartCard>
        <ChartCard
          title="Métodos de pagamento"
          subtitle="Distribuição da receita recebida"
          isLoading={fin.isLoading}
          isError={fin.isError}
          isEmpty={!fin.data || fin.data.revenue_by_payment_method.length === 0}
          onRetry={() => fin.refetch()}
        >
          {fin.data && <PaymentChart data={fin.data.revenue_by_payment_method} />}
        </ChartCard>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-mute">
            Pagamentos pendentes
          </h2>
        </div>
        <Link to="/payments" className="text-xs font-medium text-gold-700 hover:underline">
          Ver todos os pagamentos
        </Link>
      </div>

      {fin.isLoading ? (
        <Card>
          <CardBody>
            <div className="h-40 animate-pulse rounded-xl bg-graphite-100/60" />
          </CardBody>
        </Card>
      ) : !fin.data || fin.data.pending_payments.length === 0 ? (
        <EmptyState
          title="Nenhuma pendência"
          description="Não há pagamentos pendentes no período selecionado."
        />
      ) : (
        <PendingTable rows={fin.data.pending_payments} />
      )}
    </ReportShell>
  );
}
