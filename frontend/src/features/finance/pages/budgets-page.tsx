import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toApiError } from "@/lib/api";
import { BudgetsTable } from "../components/budgets-table";
import { BUDGET_STATUS_LABELS } from "../components/budget-status-badge";
import { useBudgets } from "../hooks/use-finance";
import type { BudgetStatus } from "../types/finance";

const PAGE_SIZE = 20;

export function BudgetsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<BudgetStatus | "">("");
  const [includeCanceled, setIncludeCanceled] = useState(false);
  const [page, setPage] = useState(1);
  const query = useBudgets({ status, includeCanceled, page, pageSize: PAGE_SIZE });
  const totalPages = query.data?.meta.total_pages ?? 0;

  return (
    <>
      <PageHeader
        title="Orçamentos"
        description="Propostas clínicas com total definitivo calculado pelo sistema."
        actions={
          <Button onClick={() => navigate("/budgets/new")}>
            <Plus className="h-4 w-4" />
            Novo orçamento
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[260px_auto]">
        <Select
          label="Status"
          options={[
            { value: "", label: "Todos" },
            ...(Object.keys(BUDGET_STATUS_LABELS) as BudgetStatus[]).map((s) => ({
              value: s,
              label: BUDGET_STATUS_LABELS[s],
            })),
          ]}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as BudgetStatus | "");
            setPage(1);
          }}
        />
        <label className="flex items-end gap-2 pb-2 text-sm text-ink-mute">
          <input
            type="checkbox"
            checked={includeCanceled}
            onChange={(event) => {
              setIncludeCanceled(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-line text-gold-500 focus-visible:ring-gold-400"
          />
          Incluir cancelados
        </label>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.items.length === 0 ? (
        <EmptyState
          title="Nenhum orçamento encontrado"
          description="Crie um orçamento para registrar os procedimentos combinados com o paciente."
          action={
            <Button onClick={() => navigate("/budgets/new")}>
              <Plus className="h-4 w-4" />
              Novo orçamento
            </Button>
          }
        />
      ) : (
        <>
          <BudgetsTable budgets={query.data.items} onOpen={(id) => navigate(`/budgets/${id}`)} />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2 text-sm text-ink-mute">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span>{page} / {totalPages}</span>
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
        </>
      )}
    </>
  );
}
