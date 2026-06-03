import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dayRangeIso } from "../constants";
import {
  AppointmentFilters,
  EMPTY_FILTERS,
  type AppointmentFilterValues,
} from "../components/appointment-filters";
import { AppointmentTable } from "../components/appointment-table";
import { TodayAppointments } from "../components/today-appointments";
import { useAppointments, useDentistOptions } from "../hooks/use-appointments";
import type { ListAppointmentsParams } from "../api/appointments-api";

const PAGE_SIZE = 20;

export function AppointmentsPage() {
  const navigate = useNavigate();
  const { dentists } = useDentistOptions();

  const [filters, setFilters] = useState<AppointmentFilterValues>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  function updateFilters(next: AppointmentFilterValues) {
    setFilters(next);
    setPage(1);
  }

  const params: ListAppointmentsParams = useMemo(() => {
    const range = filters.date ? dayRangeIso(filters.date) : undefined;
    return {
      from: range?.from,
      to: range?.to,
      patientId: filters.patientId ?? undefined,
      dentistId: filters.dentistId ?? undefined,
      status: filters.status || undefined,
      includeCanceled: filters.includeCanceled,
      page,
      pageSize: PAGE_SIZE,
    };
  }, [filters, page]);

  const { data, isLoading, isError, isFetching, refetch } = useAppointments(params);

  const totalPages = data?.meta.total_pages ?? 0;
  const total = data?.meta.total ?? 0;

  const open = (id: number) => navigate(`/appointments/${id}`);

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Consultas do dia, busca e marcação de novos atendimentos."
        actions={
          <Button onClick={() => navigate("/appointments/new")}>
            <Plus className="h-4 w-4" />
            Nova consulta
          </Button>
        }
      />

      <TodayAppointments onOpen={open} />

      <h2 className="mb-3 text-sm font-semibold tracking-tight text-ink">Todas as consultas</h2>

      <AppointmentFilters value={filters} onChange={updateFilters} dentists={dentists} />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhuma consulta encontrada"
          description="Ajuste os filtros ou agende uma nova consulta."
        />
      ) : (
        <>
          <AppointmentTable appointments={data.items} onOpen={open} />
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {total} consulta(s){isFetching ? " · atualizando…" : ""}
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
    </>
  );
}
