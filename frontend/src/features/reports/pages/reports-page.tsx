import {
  CalendarCheck,
  CalendarX,
  Coins,
  CreditCard,
  MessageSquareText,
  Package,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

import { formatMoney } from "@/utils/currency";
import { AppointmentsChart } from "../components/charts/appointments-chart";
import { BarList } from "../components/charts/bar-list";
import { PaymentChart } from "../components/charts/payment-chart";
import { RevenueChart } from "../components/charts/revenue-chart";
import { InsightCard, type InsightCardProps } from "../components/insight-card";
import { MetricCard } from "../components/metric-card";
import { ReportShell } from "../components/report-shell";
import { ChartCard } from "../components/report-section";
import {
  useAppointmentsReport,
  useFinanceReport,
  useInventoryReport,
  usePatientsReport,
  useReportsPermissions,
} from "../hooks/use-reports";
import { previousRange, useReportPeriod } from "../utils/period";
import {
  computeDelta,
  formatPercent,
  paymentMethodLabel,
  rate,
  toNum,
} from "../utils/report-format";

export function ReportsPage() {
  const period = useReportPeriod();
  const range = { start_date: period.start_date, end_date: period.end_date };
  const prev = useMemo(() => previousRange(range), [range.start_date, range.end_date]);
  const { canFinance, canPatients } = useReportsPermissions();

  const fin = useFinanceReport(range, { enabled: canFinance });
  const finPrev = useFinanceReport(prev, { enabled: canFinance });
  const appt = useAppointmentsReport(range);
  const apptPrev = useAppointmentsReport(prev);
  const pat = usePatientsReport(range, { enabled: canPatients });
  const patPrev = usePatientsReport(prev, { enabled: canPatients });
  const inv = useInventoryReport(range);

  // ----- Métricas derivadas (apresentação, não regra de negócio) -----
  const revenue = fin.data ? toNum(fin.data.total_paid) : 0;
  const revenueDelta =
    fin.data && finPrev.data
      ? computeDelta(revenue, toNum(finPrev.data.total_paid))
      : undefined;
  const revenueSpark = fin.data?.revenue_by_day.map((d) => toNum(d.total));

  const completed = appt.data?.completed_appointments ?? 0;
  const completedDelta =
    appt.data && apptPrev.data
      ? computeDelta(completed, apptPrev.data.completed_appointments)
      : undefined;

  const totalAppts = appt.data?.total_appointments ?? 0;
  const noShow = appt.data?.no_show_appointments ?? 0;
  const noShowRate = totalAppts ? (noShow / totalAppts) * 100 : 0;
  const noShowRatePrev =
    apptPrev.data && apptPrev.data.total_appointments
      ? (apptPrev.data.no_show_appointments / apptPrev.data.total_appointments) * 100
      : 0;
  const faltasDelta =
    appt.data && apptPrev.data ? computeDelta(noShowRate, noShowRatePrev) : undefined;

  const newPatients = pat.data?.total_patients_created_in_period ?? 0;
  const newPatientsDelta =
    pat.data && patPrev.data
      ? computeDelta(newPatients, patPrev.data.total_patients_created_in_period)
      : undefined;

  const ticket = completed > 0 ? revenue / completed : 0;

  // ----- Insights automáticos (a partir de dados reais) -----
  const insights = useMemo<InsightCardProps[]>(() => {
    const list: InsightCardProps[] = [];
    if (canFinance && revenueDelta && revenueDelta.pct !== null) {
      const down = revenueDelta.direction === "down";
      list.push({
        icon: down ? TrendingDown : TrendingUp,
        tone: down ? "warning" : "success",
        title: `Receita ${down ? "caiu" : "subiu"} ${formatPercent(revenueDelta.pct)}`,
        description: "em relação ao período anterior.",
      });
    }
    const topMethod = fin.data?.revenue_by_payment_method[0];
    if (canFinance && topMethod) {
      list.push({
        icon: CreditCard,
        tone: "gold",
        title: `Maior faturamento: ${paymentMethodLabel(topMethod.label)}`,
        description: `${formatMoney(topMethod.total)} recebidos por essa forma.`,
      });
    }
    const topReason = appt.data?.most_common_reasons[0];
    if (topReason) {
      list.push({
        icon: MessageSquareText,
        tone: "info",
        title: `Motivo mais comum: ${topReason.label || "não informado"}`,
        description: `${topReason.count} consulta(s) no período.`,
      });
    }
    if (appt.data && totalAppts > 0) {
      const high = noShowRate >= 15;
      list.push({
        icon: CalendarX,
        tone: high ? "danger" : "neutral",
        title: `Taxa de faltas em ${rate(noShow, totalAppts)}`,
        description: high ? "Acima do ideal — vale reforçar lembretes." : "Dentro de um patamar saudável.",
      });
    }
    if (inv.data) {
      const alerts = inv.data.low_stock_items_count + inv.data.expiring_items_count;
      list.push({
        icon: Package,
        tone: alerts === 0 ? "success" : "warning",
        title: alerts === 0 ? "Estoque saudável" : `${alerts} item(ns) precisam de atenção`,
        description:
          alerts === 0
            ? "Nenhum item baixo ou vencendo."
            : `${inv.data.low_stock_items_count} baixo(s) · ${inv.data.expiring_items_count} vencendo.`,
      });
    }
    return list;
  }, [
    canFinance,
    revenueDelta,
    fin.data,
    appt.data,
    inv.data,
    totalAppts,
    noShow,
    noShowRate,
  ]);

  return (
    <ReportShell
      title="Relatórios"
      description="Indicadores estratégicos da clínica em tempo real."
    >
      {/* Métricas principais */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canFinance && (
          <MetricCard
            label="Receita recebida"
            value={formatMoney(revenue)}
            icon={Wallet}
            highlight
            delta={revenueDelta}
            spark={revenueSpark}
            isLoading={fin.isLoading}
          />
        )}
        <MetricCard
          label="Consultas realizadas"
          value={String(completed)}
          icon={CalendarCheck}
          delta={completedDelta}
          isLoading={appt.isLoading}
        />
        <MetricCard
          label="Taxa de faltas"
          value={rate(noShow, totalAppts)}
          icon={CalendarX}
          delta={faltasDelta}
          goodWhenDown
          isLoading={appt.isLoading}
        />
        {canPatients && (
          <MetricCard
            label="Pacientes novos"
            value={String(newPatients)}
            icon={UserPlus}
            delta={newPatientsDelta}
            isLoading={pat.isLoading}
          />
        )}
        {canFinance && (
          <MetricCard
            label="Ticket médio"
            value={formatMoney(ticket)}
            icon={Coins}
            hint="Receita ÷ consultas realizadas"
            isLoading={fin.isLoading || appt.isLoading}
          />
        )}
        {canFinance && (
          <MetricCard
            label="A receber"
            value={formatMoney(fin.data ? toNum(fin.data.total_pending) : 0)}
            icon={Wallet}
            hint={`${fin.data?.pending_payments_count ?? 0} pagamento(s) pendente(s)`}
            isLoading={fin.isLoading}
          />
        )}
      </div>

      {/* Gráficos */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {canFinance && (
          <ChartCard
            title="Receita ao longo do tempo"
            subtitle="Valores recebidos por dia"
            isLoading={fin.isLoading}
            isError={fin.isError}
            isEmpty={!fin.data || fin.data.revenue_by_day.length === 0}
            onRetry={() => fin.refetch()}
          >
            {fin.data && <RevenueChart data={fin.data.revenue_by_day} />}
          </ChartCard>
        )}
        <ChartCard
          title="Consultas por dia"
          subtitle="Volume de atendimentos"
          isLoading={appt.isLoading}
          isError={appt.isError}
          isEmpty={!appt.data || appt.data.appointments_by_day.length === 0}
          onRetry={() => appt.refetch()}
        >
          {appt.data && <AppointmentsChart data={appt.data.appointments_by_day} />}
        </ChartCard>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {canFinance && (
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
        )}
        <ChartCard
          title="Motivos de consulta mais comuns"
          subtitle="Principais razões de agendamento"
          isLoading={appt.isLoading}
          isError={appt.isError}
          isEmpty={!appt.data || appt.data.most_common_reasons.length === 0}
          onRetry={() => appt.refetch()}
          height={220}
        >
          {appt.data && (
            <BarList
              items={appt.data.most_common_reasons
                .slice(0, 6)
                .map((r) => ({ label: r.label || "Sem motivo", value: r.count }))}
            />
          )}
        </ChartCard>
      </div>

      {/* Insights automáticos */}
      {insights.length > 0 && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-600" aria-hidden />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-mute">
              Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} {...insight} />
            ))}
          </div>
        </>
      )}
    </ReportShell>
  );
}
