import { Trash2 } from "lucide-react";

import { fieldBase } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { formatMoney } from "@/utils/currency";

export interface BudgetItemDraft {
  procedure_id: number;
  name: string;
  quantity: number;
  unit_price: string; // string decimal (aceita vírgula ou ponto)
}

/** Valor numérico de um campo de moeda digitado (aceita "150,00" ou "150.00"). */
function toNumber(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function lineTotal(item: BudgetItemDraft): number {
  return toNumber(item.unit_price) * item.quantity;
}

interface BudgetItemsTableProps {
  items: BudgetItemDraft[];
  onQuantity: (index: number, quantity: number) => void;
  onUnitPrice: (index: number, unitPrice: string) => void;
  onRemove: (index: number) => void;
}

export function BudgetItemsTable({
  items,
  onQuantity,
  onUnitPrice,
  onRemove,
}: BudgetItemsTableProps) {
  const estimated = items.reduce((acc, it) => acc + lineTotal(it), 0);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-mute">
        Nenhum procedimento adicionado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-surface-muted">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            <th className="px-4 py-2.5">Procedimento</th>
            <th className="px-4 py-2.5 w-24">Qtd</th>
            <th className="px-4 py-2.5 w-36">Valor unit.</th>
            <th className="px-4 py-2.5 w-28 text-right">Subtotal</th>
            <th className="px-4 py-2.5 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item, i) => (
            <tr key={item.procedure_id}>
              <td className="px-4 py-2.5 font-medium text-ink">{item.name}</td>
              <td className="px-4 py-2.5">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={item.quantity}
                  onChange={(e) => onQuantity(i, Math.max(1, Number(e.target.value) || 1))}
                  aria-label={`Quantidade de ${item.name}`}
                  className={cn(fieldBase, "h-9 border-line px-2")}
                />
              </td>
              <td className="px-4 py-2.5">
                <input
                  inputMode="decimal"
                  value={item.unit_price}
                  onChange={(e) => onUnitPrice(i, e.target.value)}
                  aria-label={`Valor unitário de ${item.name}`}
                  className={cn(fieldBase, "h-9 border-line px-2")}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-right font-medium text-ink">
                {formatMoney(lineTotal(item))}
              </td>
              <td className="px-4 py-2.5 text-right">
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label={`Remover ${item.name}`}
                  className="rounded-md p-1.5 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line bg-surface-muted/60">
            <td colSpan={3} className="px-4 py-3 text-sm text-ink-mute">
              Total estimado · o total final é calculado pelo sistema
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-right text-base font-semibold text-ink">
              {formatMoney(estimated)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
