import { ArrowLeftRight, ChevronRight, Pencil } from "lucide-react";

import { cn } from "@/utils/cn";
import { CATEGORY_LABELS, UNIT_SHORT_LABELS } from "../constants";
import { formatQuantity } from "../utils/inventory-status";
import type { InventoryItem } from "../types/inventory";
import { ExpirationCell } from "./expiration-badge";
import { InventoryStatusBadge } from "./inventory-status-badge";

interface Props {
  item: InventoryItem;
  onOpen: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onMove?: (item: InventoryItem) => void;
}

/** Cartão de item para telas estreitas (a tabela vira cards no mobile). */
export function InventoryItemMobileCard({ item, onOpen, onEdit, onMove }: Props) {
  const unit = UNIT_SHORT_LABELS[item.unit_of_measure];
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-ink">{item.name}</p>
          <p className="mt-0.5 truncate text-xs text-ink-mute">
            {CATEGORY_LABELS[item.category]}
            {item.supplier ? ` · ${item.supplier}` : ""}
          </p>
        </div>
        <InventoryStatusBadge item={item} />
      </button>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-ink">
            {formatQuantity(item.current_quantity)}{" "}
            <span className="text-sm font-normal text-ink-mute">{unit}</span>
          </p>
          <p className="text-xs text-ink-mute">
            mínimo {formatQuantity(item.minimum_quantity)} {unit}
          </p>
        </div>
        <ExpirationCell item={item} />
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        {onMove && (
          <button
            type="button"
            onClick={() => onMove(item)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-graphite-100"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
            Movimentar
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-graphite-100"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Editar
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(item)}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gold-700 transition-colors hover:bg-gold-50",
          )}
        >
          Detalhes
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
