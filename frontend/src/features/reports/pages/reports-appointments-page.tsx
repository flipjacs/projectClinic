import { CalendarCheck, CalendarDays, CalendarX, Ban } from "lucide-react";
import { useState } from "react";

import { Select } from "@/components/ui/select";
import { AppointmentsChart } from "../components/charts/appointments-chart";
import { BarList } from "../components/charts/bar-list";
import { MetricCard } from "../components/metric-card";
import { ReportShell } from "../components/report-shell";
import { ChartCard } from "../components/report-section";
import { useAppointmentsReport } from "../hooks/use-reports";
import { useReportPeriod } from "../utils/period";
import { appointmentStatusLabel } from "../utils/report-format";

export function ReportsAppointmentsPage() {
  const period = useReportPeriod();
  const range = { start_date: period.start_date, end_date: period.end_date };
  const [dentistId, setDentistId] = useState<number | null>(null);

  // Consulta base (sem filtro) alimenta as opções de dentista; a filtrada só
  // dispara quando um dentista é escolhido.
  const base = useAppointmentsReport(range);
  const filtered = useAppointmentsReport(range, dentistId ?? undefined, {
    enabled: dentistId != null,
  });
  const report = dentistId != null ? filtered : base;

  const dentistOptions = [
    { value: "", label: "Todos os dentistas" },
    ...(base.data?.appointments_by_dentist ?? []).map((d) => ({
      value: String(d.dentist_id),
      label: d.dentist_name,
    })),
  ];

  return (
    <ReportShell
      title="Relatórios · Agenda"
      description="Volume de atendimentos, status e motivos."
    >
      {dentistOptions.length > 1 && (
        <div className="mb-4 max-w-xs">
          <Select
            aria-label="Filtrar por dentista"
            options={dentistOptions}
            value={dentistId != null ? String(dentistId) : ""}
            onChange={(e) => setDentistId(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Consultas"
          value={String(report.data?.total_appointments ?? 0)}
          icon={CalendarDays}
          highlight
          isLoading={report.isLoading}
        />
        <MetricCard
          label="Concluídas"
          value={String(report.data?.completed_appointments ?? 0)}
          icon={CalendarCheck}
          isLoading={report.isLoading}
        />
        <MetricCard
          label="Canceladas"
          value={String(report.data?.canceled_appointments ?? 0)}
          icon={Ban}
          isLoading={report.isLoading}
        />
        <MetricCard
          label="Faltas"
          value={String(report.data?.no_show_appointments ?? 0)}
          icon={CalendarX}
          isLoading={report.isLoading}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4">
        <ChartCard
          title="Consultas por dia"
          subtitle="Volume de atendimentos no período"
          isLoading={report.isLoading}
          isError={report.isError}
          isEmpty={!report.data || report.data.appointments_by_day.length === 0}
          onRetry={() => report.refetch()}
        >
          {report.data && <AppointmentsChart data={report.data.appointments_by_day} />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Por status"
          isLoading={report.isLoading}
          isError={report.isError}
          isEmpty={!report.data || report.data.appointments_by_status.length === 0}
          onRetry={() => report.refetch()}
          height={200}
        >
          {report.data && (
            <BarList
              items={report.data.appointments_by_status.map((s) => ({
                label: appointmentStatusLabel(s.label),
                value: s.count,
              }))}
            />
          )}
        </ChartCard>
        <ChartCard
          title="Por dentista"
          isLoading={report.isLoading}
          isError={report.isError}
          isEmpty={!report.data || report.data.appointments_by_dentist.length === 0}
          onRetry={() => report.refetch()}
          height={200}
        >
          {report.data && (
            <BarList
              items={report.data.appointments_by_dentist
                .slice(0, 6)
                .map((d) => ({ label: d.dentist_name, value: d.count }))}
            />
          )}
        </ChartCard>
        <ChartCard
          title="Motivos mais comuns"
          isLoading={report.isLoading}
          isError={report.isError}
          isEmpty={!report.data || report.data.most_common_reasons.length === 0}
          onRetry={() => report.refetch()}
          height={200}
        >
          {report.data && (
            <BarList
              items={report.data.most_common_reasons
                .slice(0, 6)
                .map((r) => ({ label: r.label || "Sem motivo", value: r.count }))}
            />
          )}
        </ChartCard>
      </div>
    </ReportShell>
  );
}
