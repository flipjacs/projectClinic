import { Banknote, CalendarDays, Clock3, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/ui/stat-card";
import { formatMoney } from "@/utils/currency";
import type { FinanceSummary, RevenueReport } from "../types/finance";

interface FinanceSummaryCardsProps {
  summary?: FinanceSummary;
  weekly?: RevenueReport;
  monthly?: RevenueReport;
}

export function FinanceSummaryCards({
  summary,
  weekly,
  monthly,
}: FinanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Valor recebido no mês"
        value={formatMoney(summary?.total_paid_current_month ?? monthly?.total_paid)}
        hint={`${summary?.number_of_paid_payments ?? monthly?.number_of_payments ?? 0} pagamento(s)`}
        icon={TrendingUp}
        highlight
      />
      <StatCard
        label="Valor recebido na semana"
        value={formatMoney(summary?.total_paid_current_week ?? weekly?.total_paid)}
        hint="Receita confirmada"
        icon={CalendarDays}
      />
      <StatCard
        label="Valor pendente"
        value={formatMoney(summary?.total_pending)}
        hint={`${summary?.number_of_pending_payments ?? 0} pendência(s)`}
        icon={Clock3}
      />
      <StatCard
        label="Cancelado"
        value={formatMoney(summary?.total_canceled)}
        hint="Pagamentos cancelados"
        icon={Banknote}
      />
    </div>
  );
}
