import { UserCheck, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateOnly } from "@/utils/format";
import { BarList } from "../components/charts/bar-list";
import { MetricCard } from "../components/metric-card";
import { ReportShell } from "../components/report-shell";
import { ChartCard } from "../components/report-section";
import { usePatientsReport } from "../hooks/use-reports";
import { useReportPeriod } from "../utils/period";
import type { PatientSnapshot } from "../types/reports";

function RecentPatientsTable({ rows }: { rows: PatientSnapshot[] }) {
  return (
    <>
      <div className="space-y-3 sm:hidden">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-white p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <Link
                to={`/patients/${p.id}`}
                className="truncate text-sm font-medium text-ink hover:text-gold-700"
              >
                {p.name}
              </Link>
              <Badge tone={p.is_active ? "success" : "neutral"}>
                {p.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-mute">
              {p.phone}
              {p.city ? ` · ${p.city}${p.state ? `/${p.state}` : ""}` : ""}
            </p>
            <p className="mt-1 text-xs text-ink-mute">Cadastrado em {formatDateOnly(p.created_at)}</p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-line bg-white shadow-card sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-canvas/60">
                <td className="px-4 py-3">
                  <Link
                    to={`/patients/${p.id}`}
                    className="font-medium text-ink hover:text-gold-700"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{p.phone}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {p.city ? `${p.city}${p.state ? `/${p.state}` : ""}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={p.is_active ? "success" : "neutral"}>
                    {p.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-ink-soft">{formatDateOnly(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ReportsPatientsPage() {
  const period = useReportPeriod();
  const range = { start_date: period.start_date, end_date: period.end_date };
  const report = usePatientsReport(range);

  return (
    <ReportShell
      title="Relatórios · Pacientes"
      description="Cadastros, base ativa e distribuição por cidade."
    >
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Novos no período"
          value={String(report.data?.total_patients_created_in_period ?? 0)}
          icon={UserPlus}
          highlight
          isLoading={report.isLoading}
        />
        <MetricCard
          label="Ativos"
          value={String(report.data?.active_patients ?? 0)}
          icon={UserCheck}
          isLoading={report.isLoading}
        />
        <MetricCard
          label="Inativos"
          value={String(report.data?.inactive_patients ?? 0)}
          icon={UserMinus}
          isLoading={report.isLoading}
        />
        <MetricCard
          label="Contatos incompletos"
          value={String(report.data?.patients_with_missing_contact_data ?? 0)}
          icon={UsersRound}
          hint="Sem e-mail ou telefone"
          isLoading={report.isLoading}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Pacientes por cidade"
          subtitle="Onde está a sua base"
          isLoading={report.isLoading}
          isError={report.isError}
          isEmpty={!report.data || report.data.patients_by_city.length === 0}
          onRetry={() => report.refetch()}
          height={260}
        >
          {report.data && (
            <BarList
              items={report.data.patients_by_city
                .slice(0, 8)
                .map((c) => ({ label: c.label || "Não informada", value: c.count }))}
            />
          )}
        </ChartCard>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-mute">
        Cadastros recentes
      </h2>
      {report.isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-graphite-100/60" />
      ) : !report.data || report.data.recent_patients.length === 0 ? (
        <EmptyState
          title="Nenhum cadastro no período"
          description="Ajuste o período para ver os pacientes cadastrados."
        />
      ) : (
        <RecentPatientsTable rows={report.data.recent_patients} />
      )}
    </ReportShell>
  );
}
