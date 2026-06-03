import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  PackageX,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toApiError } from "@/lib/api";
import { formatCurrency, formatDate } from "@/utils/format";
import { getDashboard } from "../api/dashboard-api";
import { DashboardAlerts } from "../components/dashboard-alerts";
import { UpcomingAppointments } from "../components/upcoming-appointments";

function DashboardSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 30_000, // cache curto: o painel muda ao longo do dia
  });

  const firstName = user?.name?.split(" ")[0] ?? "";

  if (isLoading) {
    return (
      <>
        <PageHeader
          title={firstName ? `Olá, ${firstName}` : "Dashboard"}
          description="Resumo do dia e indicadores principais da clínica."
        />
        <DashboardSkeleton />
      </>
    );
  }

  if (isError) {
    const apiError = toApiError(error);
    return (
      <>
        <PageHeader title="Dashboard" />
        <ErrorState
          title={apiError.status === 403 ? "Acesso restrito" : "Não foi possível carregar os dados"}
          message={apiError.message}
          onRetry={apiError.status === 403 ? undefined : () => refetch()}
        />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState />
      </>
    );
  }

  // Financeiro só é exibido quando o backend o envia (depende da role).
  const showFinance = data.monthly_revenue != null || data.pending_payments_total != null;

  return (
    <>
      <PageHeader
        title={firstName ? `Olá, ${firstName}` : "Dashboard"}
        description="Resumo do dia e indicadores principais da clínica."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Consultas de hoje"
          value={data.appointments_today}
          icon={CalendarDays}
          highlight
          hint={`${data.appointments_this_week} nesta semana`}
        />
        <StatCard
          label="Pacientes ativos"
          value={data.active_patients}
          icon={UserCheck}
          hint={`${data.total_patients} no total`}
        />
        {showFinance ? (
          <>
            <StatCard
              label="Faturamento do mês"
              value={formatCurrency(data.monthly_revenue)}
              icon={TrendingUp}
              highlight
            />
            <StatCard
              label="Pagamentos pendentes"
              value={
                data.pending_payments_count != null
                  ? `${data.pending_payments_count}`
                  : formatCurrency(data.pending_payments_total)
              }
              icon={Wallet}
              hint={
                data.pending_payments_total != null
                  ? formatCurrency(data.pending_payments_total)
                  : undefined
              }
            />
          </>
        ) : (
          <StatCard
            label="Pacientes (total)"
            value={data.total_patients}
            icon={Users}
          />
        )}
        <StatCard
          label="Estoque baixo"
          value={data.low_stock_items_count}
          icon={PackageX}
          hint={`${data.expiring_items_count} a vencer`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingAppointments appointments={data.upcoming_appointments} />
        </div>
        <div className="space-y-6">
          <DashboardAlerts data={data} />
          <Card>
            <CardHeader>
              <CardTitle>Pacientes recentes</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {data.most_recent_patients.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={Users}
                    title="Nenhum paciente recente"
                    description="Novos cadastros aparecerão aqui."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {data.most_recent_patients.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="truncate text-sm font-medium text-ink">{p.name}</span>
                      <span className="shrink-0 text-xs text-ink-mute">
                        {formatDate(p.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
