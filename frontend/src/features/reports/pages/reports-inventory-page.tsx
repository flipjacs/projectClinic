import {
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  CalendarX2,
  TrendingDown,
} from "lucide-react";

import { CATEGORY_LABELS, UNIT_SHORT_LABELS } from "@/features/inventory/constants";
import type { InventoryCategory, UnitOfMeasure } from "@/features/inventory/types/inventory";
import type { ReactNode } from "react";

import { daysUntil, formatQuantity } from "@/features/inventory/utils/inventory-status";
import { formatDateOnly } from "@/utils/format";
import { BarList } from "../components/charts/bar-list";
import { MetricCard } from "../components/metric-card";
import { ReportShell } from "../components/report-shell";
import { ChartCard } from "../components/report-section";
import { useInventoryReport } from "../hooks/use-reports";
import { useReportPeriod } from "../utils/period";
import { movementLabel, toNum } from "../utils/report-format";
import type { InventoryItemSnapshot } from "../types/reports";

function catLabel(value: string): string {
  return CATEGORY_LABELS[value as InventoryCategory] ?? value;
}
function unitLabel(value: string): string {
  return UNIT_SHORT_LABELS[value as UnitOfMeasure] ?? value;
}

function ItemLine({ item, right }: { item: InventoryItemSnapshot; right: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
        <p className="truncate text-xs text-ink-mute">{catLabel(item.category)}</p>
      </div>
      <div className="shrink-0 text-right text-sm">{right}</div>
    </div>
  );
}

export function ReportsInventoryPage() {
  const period = useReportPeriod();
  const range = { start_date: period.start_date, end_date: period.end_date };
  const inv = useInventoryReport(range);

  const byType = Object.fromEntries(
    (inv.data?.movements_by_type ?? []).map((m) => [m.label, m.count]),
  );
  const entradas = byType["in"] ?? 0;
  const saidas = byType["out"] ?? 0;
  const expired = (inv.data?.expiring_items ?? []).filter((i) => {
    const d = daysUntil(i.expiration_date);
    return d !== null && d < 0;
  }).length;

  return (
    <ReportShell
      title="Relatórios · Estoque"
      description="Itens, alertas e movimentações do período."
    >
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Itens ativos"
          value={String(inv.data?.total_active_items ?? 0)}
          icon={Boxes}
          highlight
          isLoading={inv.isLoading}
        />
        <MetricCard
          label="Estoque baixo"
          value={String(inv.data?.low_stock_items_count ?? 0)}
          icon={TrendingDown}
          isLoading={inv.isLoading}
        />
        <MetricCard
          label="Vencendo"
          value={String(inv.data?.expiring_items_count ?? 0)}
          icon={CalendarClock}
          isLoading={inv.isLoading}
        />
        <MetricCard
          label="Vencidos"
          value={String(expired)}
          icon={CalendarX2}
          isLoading={inv.isLoading}
        />
        <MetricCard
          label="Entradas"
          value={String(entradas)}
          icon={ArrowDownLeft}
          isLoading={inv.isLoading}
        />
        <MetricCard
          label="Saídas"
          value={String(saidas)}
          icon={ArrowUpRight}
          isLoading={inv.isLoading}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Movimentações por tipo"
          subtitle="Entradas, saídas e ajustes"
          isLoading={inv.isLoading}
          isError={inv.isError}
          isEmpty={!inv.data || inv.data.movements_by_type.length === 0}
          onRetry={() => inv.refetch()}
          height={200}
        >
          {inv.data && (
            <BarList
              items={inv.data.movements_by_type.map((m) => ({
                label: movementLabel(m.label),
                value: m.count,
              }))}
            />
          )}
        </ChartCard>
        <ChartCard
          title="Itens mais movimentados"
          subtitle="Maior atividade no período"
          isLoading={inv.isLoading}
          isError={inv.isError}
          isEmpty={!inv.data || inv.data.most_moved_items.length === 0}
          onRetry={() => inv.refetch()}
          height={200}
        >
          {inv.data && (
            <BarList
              items={inv.data.most_moved_items
                .slice(0, 6)
                .map((m) => ({ label: m.name, value: m.movement_count }))}
            />
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title="Estoque baixo"
          subtitle="Itens no mínimo ou abaixo"
          isLoading={inv.isLoading}
          isError={inv.isError}
          isEmpty={!inv.data || inv.data.low_stock_items.length === 0}
          emptyMessage="Nenhum item com estoque baixo."
          onRetry={() => inv.refetch()}
          height={200}
        >
          {inv.data && inv.data.low_stock_items.length > 0 && (
            <div>
              {inv.data.low_stock_items.slice(0, 8).map((item) => (
                <ItemLine
                  key={item.id}
                  item={item}
                  right={
                    <span
                      className={
                        toNum(item.current_quantity) <= 0
                          ? "font-medium text-red-700"
                          : "font-medium text-amber-700"
                      }
                    >
                      {formatQuantity(item.current_quantity)} {unitLabel(item.unit_of_measure)}
                      <span className="ml-1 text-xs font-normal text-ink-mute">
                        / mín {formatQuantity(item.minimum_quantity)}
                      </span>
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Próximos do vencimento"
          subtitle="Validade dentro da janela"
          isLoading={inv.isLoading}
          isError={inv.isError}
          isEmpty={!inv.data || inv.data.expiring_items.length === 0}
          emptyMessage="Nenhum item vencendo."
          onRetry={() => inv.refetch()}
          height={200}
        >
          {inv.data && inv.data.expiring_items.length > 0 && (
            <div>
              {inv.data.expiring_items.slice(0, 8).map((item) => {
                const d = daysUntil(item.expiration_date);
                const expiredItem = d !== null && d < 0;
                return (
                  <ItemLine
                    key={item.id}
                    item={item}
                    right={
                      <span className={expiredItem ? "font-medium text-red-700" : "text-orange-700"}>
                        {item.expiration_date ? formatDateOnly(item.expiration_date) : "—"}
                      </span>
                    }
                  />
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>
    </ReportShell>
  );
}
