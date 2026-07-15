import {
  ArrowLeftRight,
  CalendarClock,
  Package,
  PackageX,
  TrendingDown,
} from "lucide-react";

import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useInventorySummary, useLowStock } from "../hooks/use-inventory";
import { quantityToNumber } from "../utils/inventory-status";
import { InventoryCard } from "./inventory-card";

/**
 * Cartões-resumo do painel de estoque. Todos os números vêm de dados reais da
 * API: o resumo (`/summary`) e — para "zerados", que não é um total do resumo —
 * a contagem derivada da lista de estoque baixo (`current_quantity <= 0`).
 */
export function InventorySummaryCards() {
  const summary = useInventorySummary();
  // Estoque baixo já inclui os zerados; buscamos uma página ampla para derivar
  // com precisão quantos estão de fato zerados (subconjunto crítico e pequeno).
  const lowStock = useLowStock({ pageSize: 100 });

  if (summary.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar o resumo do estoque"
        onRetry={() => summary.refetch()}
      />
    );
  }

  if (summary.isLoading || !summary.data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-2xl" />
        ))}
      </div>
    );
  }

  const s = summary.data;
  const zeroed = (lowStock.data?.items ?? []).filter(
    (i) => quantityToNumber(i.current_quantity) <= 0,
  ).length;
  const zeroedCapped =
    (lowStock.data?.meta.total ?? 0) > (lowStock.data?.items.length ?? 0)
      ? `${zeroed}+`
      : String(zeroed);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <InventoryCard
        label="Total de itens"
        value={s.total_active_items}
        icon={Package}
        tone="gold"
        hint={s.total_inactive_items > 0 ? `${s.total_inactive_items} inativos` : "Itens ativos"}
        to="/inventory/items"
      />
      <InventoryCard
        label="Estoque baixo"
        value={s.low_stock_items_count}
        icon={TrendingDown}
        tone="warning"
        hint="No mínimo ou abaixo"
      />
      <InventoryCard
        label="Itens zerados"
        value={zeroedCapped}
        icon={PackageX}
        tone="danger"
        hint="Sem saldo disponível"
      />
      <InventoryCard
        label="A vencer (30 dias)"
        value={s.expiring_items_count}
        icon={CalendarClock}
        tone="orange"
        hint="Validade próxima"
      />
      <InventoryCard
        label="Movimentações no mês"
        value={s.total_movements_current_month}
        icon={ArrowLeftRight}
        tone="neutral"
        hint="Entradas, saídas e ajustes"
        to="/inventory/movements"
      />
    </div>
  );
}
