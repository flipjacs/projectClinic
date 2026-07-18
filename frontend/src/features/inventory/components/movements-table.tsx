import { Link } from "react-router-dom";

import { formatDateTime } from "@/utils/format";
import { formatQuantity } from "../utils/inventory-status";
import type { InventoryMovement } from "../types/inventory";
import { MovementTypeBadge } from "./movement-type-badge";

interface MovementsTableProps {
  movements: InventoryMovement[];
  /** Abreviação da unidade quando a lista está filtrada por um único item. */
  unit?: string;
  /** Oculta a coluna/link de item (ex.: já dentro da página do item). */
  hideItemLink?: boolean;
}

const SIGN: Record<string, string> = { in: "+", out: "−", adjustment: "" };

function QuantityCell({ m, unit }: { m: InventoryMovement; unit?: string }) {
  if (m.movement_type === "adjustment") {
    return <span className="text-ink-mute">—</span>;
  }
  return (
    <span
      className={m.movement_type === "in" ? "text-emerald-700" : "text-red-700"}
    >
      {SIGN[m.movement_type]}
      {formatQuantity(m.quantity)}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}

export function MovementsTable({ movements, unit, hideItemLink }: MovementsTableProps) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {movements.map((m) => (
          <div key={m.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <MovementTypeBadge type={m.movement_type} />
              <time className="text-xs text-ink-mute">{formatDateTime(m.created_at)}</time>
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-lg font-semibold tabular-nums text-ink">
                  <QuantityCell m={m} unit={unit} />
                </p>
                <p className="text-xs text-ink-mute">
                  saldo {formatQuantity(m.resulting_quantity)}
                  {unit ? ` ${unit}` : ""}
                </p>
              </div>
              {!hideItemLink && (
                <Link
                  to={`/inventory/items/${m.inventory_item_id}`}
                  className="text-xs font-medium text-gold-700 hover:underline"
                >
                  ver item
                </Link>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-mute">por {m.created_by.name}</p>
            {m.reason && (
              <p className="mt-2 rounded-md bg-surface-muted px-2 py-1 text-xs text-ink-soft">
                {m.reason}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3">Data</th>
              <th className="px-5 py-3">Tipo</th>
              {!hideItemLink && <th className="px-5 py-3">Item</th>}
              <th className="px-5 py-3 text-right">Quantidade</th>
              <th className="px-5 py-3 text-right">Saldo</th>
              <th className="px-5 py-3">Responsável</th>
              <th className="px-5 py-3">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {movements.map((m) => (
              <tr key={m.id} className="transition-colors hover:bg-canvas/60">
                <td className="whitespace-nowrap px-5 py-3 text-ink-soft">
                  {formatDateTime(m.created_at)}
                </td>
                <td className="px-5 py-3">
                  <MovementTypeBadge type={m.movement_type} />
                </td>
                {!hideItemLink && (
                  <td className="px-5 py-3">
                    <Link
                      to={`/inventory/items/${m.inventory_item_id}`}
                      className="font-medium text-gold-700 hover:underline"
                    >
                      ver item
                    </Link>
                  </td>
                )}
                <td className="px-5 py-3 text-right font-medium tabular-nums">
                  <QuantityCell m={m} unit={unit} />
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-ink-soft">
                  {formatQuantity(m.resulting_quantity)}
                  {unit ? ` ${unit}` : ""}
                </td>
                <td className="px-5 py-3 text-ink-soft">{m.created_by.name}</td>
                <td className="max-w-[16rem] truncate px-5 py-3 text-ink-mute" title={m.reason ?? undefined}>
                  {m.reason || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
