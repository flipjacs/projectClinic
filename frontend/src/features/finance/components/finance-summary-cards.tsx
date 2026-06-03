import { CircleDollarSign, Clock, TrendingUp, Wallet } from "lucide-react";

import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { formatMoney } from "@/utils/currency";
import { useFinanceSummary } from "../hooks/use-finance";

/** Cards de resumo financeiro (apenas perfis clínicos — o hook é gated por role). */
export function FinanceSummaryCards() {
  const { data, isLoading, isError, refetch } = useFinanceSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[116px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Recebido no mês"
        value={formatMoney(data.total_paid_current_month)}
        icon={TrendingUp}
        highlight
        hint={`${data.number_of_paid_payments} pagamento(s) no total`}
      />
      <StatCard
        label="Recebido na semana"
        value={formatMoney(data.total_paid_current_week)}
        icon={CircleDollarSign}
      />
      <StatCard
        label="Pendente"
        value={formatMoney(data.total_pending)}
        icon={Clock}
        highlight
        hint={`${data.number_of_pending_payments} pendência(s)`}
      />
      <StatCard
        label="Cancelado"
        value={formatMoney(data.total_canceled)}
        icon={Wallet}
      />
    </div>
  );
}
