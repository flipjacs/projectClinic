import { ArrowLeftRight, Eye, Pencil } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/utils/cn";
import { CATEGORY_LABELS, UNIT_SHORT_LABELS } from "../constants";
import { formatQuantity, quantityToNumber } from "../utils/inventory-status";
import type { InventoryItem } from "../types/inventory";
import { ExpirationCell } from "./expiration-badge";
import { InventoryItemMobileCard } from "./inventory-item-mobile-card";
import { InventoryStatusBadge } from "./inventory-status-badge";

interface InventoryTableProps {
  items: InventoryItem[];
  onOpen: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onMove?: (item: InventoryItem) => void;
}

export function InventoryTable({ items, onOpen, onEdit, onMove }: InventoryTableProps) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {items.map((item) => (
          <InventoryItemMobileCard
            key={item.id}
            item={item}
            onOpen={onOpen}
            onEdit={onEdit}
            onMove={onMove}
          />
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Categoria</th>
              <th className="px-5 py-3 text-right">Quantidade</th>
              <th className="px-5 py-3 text-right">Mínimo</th>
              <th className="px-5 py-3">Fornecedor</th>
              <th className="px-5 py-3">Validade</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => {
              const unit = UNIT_SHORT_LABELS[item.unit_of_measure];
              const low =
                item.is_active &&
                quantityToNumber(item.current_quantity) <=
                  quantityToNumber(item.minimum_quantity);
              return (
                <tr
                  key={item.id}
                  className="group transition-colors hover:bg-canvas/60"
                >
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(item)}
                      className="text-left font-medium text-ink hover:text-gold-700 focus-visible:outline-none focus-visible:underline"
                    >
                      {item.name}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {CATEGORY_LABELS[item.category]}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    <span
                      className={cn(
                        "font-medium",
                        low ? "text-amber-700" : "text-ink",
                      )}
                    >
                      {formatQuantity(item.current_quantity)}
                    </span>{" "}
                    <span className="text-xs text-ink-mute">{unit}</span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-ink-mute">
                    {formatQuantity(item.minimum_quantity)}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">
                    {item.supplier || <span className="text-ink-mute">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <ExpirationCell item={item} />
                  </td>
                  <td className="px-5 py-3">
                    <InventoryStatusBadge item={item} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <IconButton label="Ver detalhes" icon={Eye} onClick={() => onOpen(item)} />
                      {onMove && (
                        <IconButton
                          label="Movimentar"
                          icon={ArrowLeftRight}
                          onClick={() => onMove(item)}
                        />
                      )}
                      {onEdit && (
                        <IconButton label="Editar" icon={Pencil} onClick={() => onEdit(item)} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
