import { Link } from "react-router-dom";

import { formatDateTime } from "@/utils/format";
import { MOVEMENT_LABELS } from "../constants";
import { formatQuantity } from "../utils/inventory-status";
import type { InventoryMovement } from "../types/inventory";
import { MovementTypeIcon } from "./movement-type-badge";

interface TimelineProps {
  movements: InventoryMovement[];
  /** Abreviação da unidade, quando todas as linhas são de um item conhecido. */
  unit?: string;
  /** Contexto global: cada linha ganha um link para o item movimentado. */
  showItemLink?: boolean;
}

const SIGN: Record<string, string> = { in: "+", out: "−", adjustment: "" };

/** Linha do tempo vertical das movimentações (dashboard e detalhes do item). */
export function InventoryMovementTimeline({ movements, unit, showItemLink }: TimelineProps) {
  return (
    <ol className="space-y-1">
      {movements.map((m, index) => {
        const last = index === movements.length - 1;
        const unitSuffix = unit ? ` ${unit}` : "";
        return (
          <li key={m.id} className="relative flex gap-3">
            {/* Conector vertical */}
            {!last && (
              <span
                className="absolute left-4 top-9 h-[calc(100%-1rem)] w-px -translate-x-1/2 bg-line"
                aria-hidden
              />
            )}
            <MovementTypeIcon type={m.movement_type} />
            <div className="min-w-0 flex-1 pb-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm text-ink">
                  <span className="font-medium">{MOVEMENT_LABELS[m.movement_type]}</span>
                  {m.movement_type !== "adjustment" && (
                    <span className="tabular-nums text-ink-soft">
                      {" "}
                      {SIGN[m.movement_type]}
                      {formatQuantity(m.quantity)}
                      {unitSuffix}
                    </span>
                  )}
                  <span className="text-ink-mute">
                    {" "}
                    · saldo {formatQuantity(m.resulting_quantity)}
                    {unitSuffix}
                  </span>
                </p>
                <time className="shrink-0 text-xs text-ink-mute">
                  {formatDateTime(m.created_at)}
                </time>
              </div>
              <p className="mt-0.5 text-xs text-ink-mute">
                por {m.created_by.name}
                {showItemLink && (
                  <>
                    {" · "}
                    <Link
                      to={`/inventory/items/${m.inventory_item_id}`}
                      className="font-medium text-gold-700 hover:underline"
                    >
                      ver item
                    </Link>
                  </>
                )}
              </p>
              {m.reason && (
                <p className="mt-1 rounded-md bg-graphite-50 px-2 py-1 text-xs text-ink-soft">
                  {m.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
