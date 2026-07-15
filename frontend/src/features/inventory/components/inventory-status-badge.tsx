import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { deriveStockStatus } from "../utils/inventory-status";
import type { InventoryItem } from "../types/inventory";

const DOT: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  neutral: "bg-graphite-400",
};

/**
 * Status de saldo do item. O ponto colorido acelera a leitura, mas o rótulo
 * textual sempre acompanha — o significado nunca depende só da cor.
 */
export function InventoryStatusBadge({ item }: { item: InventoryItem }) {
  const { label, tone } = deriveStockStatus(item);
  return (
    <Badge tone={tone} className="gap-1.5">
      <span
        className={cn("h-1.5 w-1.5 rounded-full", DOT[tone])}
        aria-hidden
      />
      {label}
    </Badge>
  );
}
