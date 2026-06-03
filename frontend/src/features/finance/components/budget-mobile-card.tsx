import type { KeyboardEvent } from "react";

import { formatMoney } from "@/utils/currency";
import { formatDate } from "@/utils/format";
import type { Budget } from "../types/finance";
import { BudgetStatusBadge } from "./budget-status-badge";

interface BudgetMobileCardProps {
  budget: Budget;
  onOpen: (id: number) => void;
}

/** Card de orçamento para telas pequenas (substitui a tabela no mobile). */
export function BudgetMobileCard({ budget, onOpen }: BudgetMobileCardProps) {
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(budget.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(budget.id)}
      onKeyDown={onKeyDown}
      aria-label={`Abrir orçamento de ${budget.patient.name}`}
      className="cursor-pointer rounded-2xl border border-line bg-white p-4 shadow-card transition-colors hover:border-graphite-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{budget.patient.name}</p>
          <p className="mt-0.5 text-xs text-ink-mute">
            Dr(a). {budget.dentist.name} · {formatDate(budget.created_at)}
          </p>
        </div>
        <BudgetStatusBadge status={budget.status} />
      </div>
      <div className="mt-3">
        <span className="text-lg font-semibold tracking-tight text-ink">
          {formatMoney(budget.total_amount)}
        </span>
      </div>
    </div>
  );
}
