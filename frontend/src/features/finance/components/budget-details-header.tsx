import { Card, CardBody } from "@/components/ui/card";
import { formatMoney } from "@/utils/currency";
import { formatDate } from "@/utils/format";
import type { Budget } from "../types/finance";
import { BudgetStatusBadge } from "./budget-status-badge";

/** Cabeçalho do orçamento: paciente, status e valor em destaque. */
export function BudgetDetailsHeader({ budget }: { budget: Budget }) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-ink">{budget.patient.name}</h2>
            <BudgetStatusBadge status={budget.status} />
          </div>
          <p className="mt-1 text-sm text-ink-mute">
            Dr(a). {budget.dentist.name} · Criado em {formatDate(budget.created_at)}
          </p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">Valor total</p>
          <p className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">
            {formatMoney(budget.total_amount)}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
