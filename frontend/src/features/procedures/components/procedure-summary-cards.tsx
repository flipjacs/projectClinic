import { CheckCircle2, CircleSlash, ListChecks } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useProcedureCounts } from "../hooks/use-procedures";

/** Cards de resumo do catálogo: total, ativos e inativos. */
export function ProcedureSummaryCards() {
  const { total, active } = useProcedureCounts();

  if (total.isLoading || active.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-2xl" />
        ))}
      </div>
    );
  }

  // Resumo é informação secundária — em erro, some sem ruído (a listagem
  // mantém seu próprio tratamento de erro).
  if (total.isError || active.isError || total.data == null || active.data == null) {
    return null;
  }

  const totalCount = total.data;
  const activeCount = active.data;
  const inactiveCount = Math.max(0, totalCount - activeCount);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Total de procedimentos" value={totalCount} icon={ListChecks} />
      <StatCard
        label="Procedimentos ativos"
        value={activeCount}
        icon={CheckCircle2}
        highlight
      />
      <StatCard label="Procedimentos inativos" value={inactiveCount} icon={CircleSlash} />
    </div>
  );
}
