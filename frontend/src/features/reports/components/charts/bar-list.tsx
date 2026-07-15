import { cn } from "@/utils/cn";

export interface BarListItem {
  label: string;
  value: number;
  /** Rótulo alternativo à direita (ex.: valor monetário). */
  valueLabel?: string;
}

interface BarListProps {
  items: BarListItem[];
  /** Cor de fundo da barra (padrão dourado suave). */
  barClassName?: string;
  className?: string;
}

/**
 * Ranking horizontal legível (estilo Tremor). Cada linha tem uma barra
 * proporcional ao valor, com rótulo à esquerda e total à direita.
 */
export function BarList({ items, barClassName = "bg-gold-100", className }: BarListProps) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={cn("space-y-1.5", className)}>
      {items.map((item, i) => {
        const pct = Math.max((item.value / max) * 100, 2);
        return (
          <div key={`${item.label}-${i}`} className="relative">
            <div
              className={cn("absolute inset-y-0 left-0 rounded-md", barClassName)}
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm">
              <span className="truncate text-ink">{item.label}</span>
              <span className="shrink-0 tabular-nums font-medium text-ink-soft">
                {item.valueLabel ?? item.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
