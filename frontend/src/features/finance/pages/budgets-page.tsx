import { FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientSelect } from "@/features/appointments/components/patient-select";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_ORDER } from "../constants";
import { BudgetsTable } from "../components/budgets-table";
import { BudgetSummaryCards } from "../components/budget-summary-cards";
import { useBudgets } from "../hooks/use-finance";
import type { BudgetStatus } from "../types/finance";

const PAGE_SIZE = 20;
const statusOptions = [
  { value: "", label: "Todos" },
  ...BUDGET_STATUS_ORDER.map((s) => ({ value: s, label: BUDGET_STATUS_LABELS[s] })),
];

export function BudgetsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const [status, setStatus] = useState<BudgetStatus | "">("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [includeCanceled, setIncludeCanceled] = useState(false);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      status: status || undefined,
      patientId: patientId ?? undefined,
      includeCanceled,
      page,
      pageSize: PAGE_SIZE,
    }),
    [status, patientId, includeCanceled, page],
  );

  const { data, isLoading, isError, isFetching, refetch } = useBudgets(params);
  const totalPages = data?.meta.total_pages ?? 0;

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Orçamentos dos pacientes e seus status."
        actions={
          canCreate ? (
            <Button onClick={() => navigate("/budgets/new")}>
              <FileText className="h-4 w-4" />
              Novo orçamento
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6">
        <BudgetSummaryCards />
      </div>

      <Card className="mb-4">
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as BudgetStatus | "");
                setPage(1);
              }}
            />
            <PatientSelect
              label="Paciente"
              value={patientId}
              onChange={(p) => {
                setPatientId(p?.id ?? null);
                setPage(1);
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-mute">
            <input
              type="checkbox"
              checked={includeCanceled}
              onChange={(e) => {
                setIncludeCanceled(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 rounded border-line text-gold-500 focus-visible:ring-gold-400"
            />
            Incluir cancelados
          </label>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState title="Não foi possível carregar os orçamentos" onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhum orçamento encontrado"
          description="Ajuste os filtros ou crie um novo orçamento."
        />
      ) : (
        <>
          <BudgetsTable budgets={data.items} onOpen={(id) => navigate(`/budgets/${id}`)} />
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {data.meta.total} orçamento(s){isFetching ? " · atualizando…" : ""}
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
