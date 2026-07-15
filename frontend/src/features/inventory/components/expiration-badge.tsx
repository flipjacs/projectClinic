import { AlertTriangle, CalendarClock, CalendarX2 } from "lucide-react";

import { cn } from "@/utils/cn";
import { formatDateOnly } from "@/utils/format";
import { deriveExpiration } from "../utils/inventory-status";
import type { InventoryItem } from "../types/inventory";

/** Frase curta sobre o prazo ("Vence hoje", "Vence em 5 dias", "Vencido há 3 dias"). */
export function expirationPhrase(days: number): string {
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  if (days > 1) return `Vence em ${days} dias`;
  if (days === -1) return "Venceu ontem";
  return `Vencido há ${Math.abs(days)} dias`;
}

/** Pílula compacta de validade — apenas quando há atenção (a vencer/vencido). */
export function ExpirationBadge({
  item,
  className,
}: {
  item: Pick<InventoryItem, "expiration_date">;
  className?: string;
}) {
  const { status, days } = deriveExpiration(item);
  if (status === "none" || status === "ok" || days === null) return null;

  const expired = status === "expired";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        expired
          ? "bg-red-50 text-red-700 ring-red-200"
          : "bg-orange-50 text-orange-700 ring-orange-200",
        className,
      )}
    >
      {expired ? (
        <CalendarX2 className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <CalendarClock className="h-3.5 w-3.5" aria-hidden />
      )}
      {expirationPhrase(days)}
    </span>
  );
}

/**
 * Célula de validade para tabelas: data legível + pílula de alerta quando o
 * item está a vencer ou vencido. Sem validade → traço discreto.
 */
export function ExpirationCell({ item }: { item: Pick<InventoryItem, "expiration_date"> }) {
  const { status, days } = deriveExpiration(item);
  if (!item.expiration_date) return <span className="text-ink-mute">—</span>;

  const attention = status === "expiring" || status === "expired";
  const expired = status === "expired";
  return (
    <div className="flex flex-col gap-1">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-sm",
          expired ? "font-medium text-red-700" : "text-ink-soft",
        )}
      >
        {attention && (
          <AlertTriangle
            className={cn("h-3.5 w-3.5", expired ? "text-red-500" : "text-orange-500")}
            aria-hidden
          />
        )}
        {formatDateOnly(item.expiration_date)}
      </span>
      {attention && days !== null && (
        <span className={cn("text-xs", expired ? "text-red-600" : "text-orange-600")}>
          {expirationPhrase(days)}
        </span>
      )}
    </div>
  );
}
