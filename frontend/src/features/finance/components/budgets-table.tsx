import { ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";

import { formatDateOnly } from "@/utils/format";
import { formatMoney } from "@/utils/currency";
import type { Budget } from "../types/finance";
import { BudgetStatusBadge } from "./budget-status-badge";

interface BudgetsTableProps {
  budgets: Budget[];
  onOpen: (id: number) => void;
}

export function BudgetsTable({ budgets, onOpen }: BudgetsTableProps) {
  function onKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(id);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-graphite-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            <th className="px-5 py-3">Orçamento</th>
            <th className="px-5 py-3">Paciente</th>
            <th className="hidden px-5 py-3 md:table-cell">Profissional</th>
            <th className="px-5 py-3">Total</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {budgets.map((budget) => (
            <tr
              key={budget.id}
              tabIndex={0}
              onClick={() => onOpen(budget.id)}
              onKeyDown={(event) => onKeyDown(event, budget.id)}
              aria-label={`Abrir orçamento de ${budget.patient.name}`}
              className="cursor-pointer text-sm transition-colors hover:bg-gold-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400"
            >
              <td className="whitespace-nowrap px-5 py-3">
                <p className="font-semibold text-ink">#{budget.id}</p>
                <p className="text-xs text-ink-mute">{formatDateOnly(budget.created_at)}</p>
              </td>
              <td className="px-5 py-3 font-medium text-ink">{budget.patient.name}</td>
              <td className="hidden px-5 py-3 text-ink-soft md:table-cell">
                Dr(a). {budget.dentist.name}
              </td>
              <td className="whitespace-nowrap px-5 py-3 font-semibold text-ink">
                {formatMoney(budget.total_amount)}
              </td>
              <td className="px-5 py-3">
                <BudgetStatusBadge status={budget.status} />
              </td>
              <td className="px-5 py-3 text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-ink-mute" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
