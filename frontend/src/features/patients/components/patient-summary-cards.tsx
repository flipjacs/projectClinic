import { UserCheck, UserMinus, Users } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { usePatientCounts } from "../hooks/use-patients";

/** Resumo da base de pacientes: total, ativos e inativos (números animados). */
export function PatientSummaryCards() {
  const { total, active, inactive, isLoading } = usePatientCounts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard label="Total de pacientes" value={total} icon={Users} highlight />
      <StatCard label="Ativos" value={active} icon={UserCheck} />
      <StatCard label="Inativos" value={inactive} icon={UserMinus} />
    </div>
  );
}
