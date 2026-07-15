import { BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Estado "sem dados" elegante para gráficos, no lugar de um gráfico vazio. */
export function EmptyChart({
  message = "Sem dados para o período selecionado.",
  icon: Icon = BarChart3,
  height = 240,
}: {
  message?: string;
  icon?: LucideIcon;
  height?: number;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center"
      style={{ height }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-graphite-100 text-graphite-400">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="max-w-xs text-sm text-ink-mute">{message}</p>
    </div>
  );
}
