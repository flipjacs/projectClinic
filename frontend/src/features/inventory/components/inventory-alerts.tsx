import {
  ArrowLeftRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  PackageX,
  Pencil,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { UNIT_SHORT_LABELS } from "../constants";
import { useExpiring, useLowStock } from "../hooks/use-inventory";
import {
  deriveStockStatus,
  formatQuantity,
  quantityToNumber,
} from "../utils/inventory-status";
import { expirationPhrase } from "./expiration-badge";
import type { ExpiringItem, InventoryItem } from "../types/inventory";

type Severity = "danger" | "warning" | "orange";

const SEV: Record<Severity, { chip: string; ring: string }> = {
  danger: { chip: "bg-red-50 text-red-600", ring: "hover:border-red-200" },
  warning: { chip: "bg-amber-50 text-amber-600", ring: "hover:border-amber-200" },
  orange: { chip: "bg-orange-50 text-orange-600", ring: "hover:border-orange-200" },
};

interface AlertHandlers {
  onOpen: (item: InventoryItem) => void;
  onMove?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
}

function AlertCard({
  item,
  icon: Icon,
  severity,
  detail,
  onOpen,
  onMove,
  onEdit,
}: AlertHandlers & {
  item: InventoryItem;
  icon: LucideIcon;
  severity: Severity;
  detail: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-white p-3 shadow-card transition-colors",
        SEV[severity].ring,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            SEV[severity].chip,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <button
          type="button"
          onClick={() => onOpen(item)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-ink">{item.name}</p>
          <p className="truncate text-xs text-ink-mute">{detail}</p>
        </button>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
      </div>
      {(onMove || onEdit) && (
        <div className="mt-2.5 flex items-center gap-1.5 pl-12">
          {onMove && (
            <button
              type="button"
              onClick={() => onMove(item)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-graphite-100"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
              Movimentar
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-graphite-100"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Editar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AlertGroup({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="rounded-full bg-graphite-100 px-2 py-0.5 text-xs font-medium text-graphite-600">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface InventoryAlertsProps extends AlertHandlers {
  /** Máximo de cartões por grupo (dashboard). */
  limit?: number;
}

/**
 * Central de alertas: estoque crítico (zerado/baixo) e validade próxima, em
 * cartões acionáveis. Dados reais de `/alerts/low-stock` e `/alerts/expiring`.
 */
export function InventoryAlerts({ limit = 5, onOpen, onMove, onEdit }: InventoryAlertsProps) {
  const lowStock = useLowStock({ pageSize: limit });
  const expiring = useExpiring({ days: 30, pageSize: limit });

  const isLoading = lowStock.isLoading || expiring.isLoading;
  const lowItems = lowStock.data?.items ?? [];
  const expItems = expiring.data?.items ?? [];
  const lowTotal = lowStock.data?.meta.total ?? 0;
  const expTotal = expiring.data?.meta.total ?? 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (lowItems.length === 0 && expItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-10 text-center shadow-card">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-medium text-ink">Tudo sob controle</p>
        <p className="mt-1 text-sm text-ink-mute">
          Nenhum item crítico ou próximo do vencimento no momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {lowItems.length > 0 && (
        <AlertGroup title="Estoque crítico" count={lowTotal}>
          {lowItems.map((item) => {
            const zero = quantityToNumber(item.current_quantity) <= 0;
            const unit = UNIT_SHORT_LABELS[item.unit_of_measure];
            const { label } = deriveStockStatus(item);
            return (
              <AlertCard
                key={item.id}
                item={item}
                severity={zero ? "danger" : "warning"}
                icon={zero ? PackageX : TrendingDown}
                detail={`${label} · ${formatQuantity(item.current_quantity)} ${unit} (mín ${formatQuantity(
                  item.minimum_quantity,
                )} ${unit})`}
                onOpen={onOpen}
                onMove={onMove}
                onEdit={onEdit}
              />
            );
          })}
        </AlertGroup>
      )}

      {expItems.length > 0 && (
        <AlertGroup title="Validade próxima" count={expTotal}>
          {expItems.map((item: ExpiringItem) => (
            <AlertCard
              key={item.id}
              item={item}
              severity={item.days_until_expiration < 0 ? "danger" : "orange"}
              icon={CalendarClock}
              detail={expirationPhrase(item.days_until_expiration)}
              onOpen={onOpen}
              onMove={onMove}
              onEdit={onEdit}
            />
          ))}
        </AlertGroup>
      )}
    </div>
  );
}
