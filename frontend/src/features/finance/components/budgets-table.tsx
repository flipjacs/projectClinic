import { ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";

import { formatMoney } from "@/utils/currency";
import { formatDate } from "@/utils/format";
import type { Budget } from "../types/finance";
import { BudgetMobileCard } from "./budget-mobile-card";
import { BudgetStatusBadge } from "./budget-status-badge";

interface BudgetsTableProps {
  budgets: Budget[];
  onOpen: (id: number) => void;
}

export function BudgetsTable({ budgets, onOpen }: BudgetsTableProps) {
  function openFromKeyboard(e: KeyboardEvent<HTMLTableRowElement>, id: number) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(id);
    }
  }

  return (
    <>
      {/* Desktop: tabela */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-white shadow-card sm:block">
        <table className="min-w-full divide-y divide-line">
        <thead className="bg-graphite-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            <th className="px-5 py-3">Paciente</th>
            <th className="px-5 py-3">Total</th>
            <th className="hidden px-5 py-3 sm:table-cell">Profissional</th>
            <th className="px-5 py-3">Status</th>
            <th className="hidden px-5 py-3 sm:table-cell">Criado</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {budgets.map((b) => (
            <tr
              key={b.id}
              onClick={() => onOpen(b.id)}
              onKeyDown={(e) => openFromKeyboard(e, b.id)}
              tabIndex={0}
              aria-label={`Abrir orçamento de ${b.patient.name}`}
              className="cursor-pointer text-sm transition-colors hover:bg-gold-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400"
            >
              <td className="px-5 py-3 font-medium text-ink">{b.patient.name}</td>
              <td className="whitespace-nowrap px-5 py-3 font-medium text-ink">
                {formatMoney(b.total_amount)}
              </td>
              <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">
                Dr(a). {b.dentist.name}
              </td>
              <td className="px-5 py-3">
                <BudgetStatusBadge status={b.status} />
              </td>
              <td className="hidden whitespace-nowrap px-5 py-3 text-ink-mute sm:table-cell">
                {formatDate(b.created_at)}
              </td>
              <td className="px-5 py-3 text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-ink-mute" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {budgets.map((b) => (
          <BudgetMobileCard key={b.id} budget={b} onOpen={onOpen} />
        ))}
      </div>
    </>
  );
}
