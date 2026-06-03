import { Ban, CheckCircle2, FileEdit, XCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useBudgetCounts } from "../hooks/use-finance";

/** Cards de resumo dos orçamentos por status. */
export function BudgetSummaryCards() {
  const { draft, approved, rejected, canceled } = useBudgetCounts();

  const queries = [draft, approved, rejected, canceled];
  if (queries.some((q) => q.isLoading)) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-2xl" />
        ))}
      </div>
    );
  }

  // Resumo é secundário — em erro, some sem ruído (a listagem trata o próprio erro).
  if (queries.some((q) => q.isError || q.data == null)) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Rascunhos" value={draft.data ?? 0} icon={FileEdit} highlight />
      <StatCard label="Aprovados" value={approved.data ?? 0} icon={CheckCircle2} />
      <StatCard label="Rejeitados" value={rejected.data ?? 0} icon={XCircle} />
      <StatCard label="Cancelados" value={canceled.data ?? 0} icon={Ban} />
    </div>
  );
}
