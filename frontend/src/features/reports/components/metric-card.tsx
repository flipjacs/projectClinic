import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { MiniChart } from "./charts/mini-chart";
import { formatPercent, type Delta } from "../utils/report-format";

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  delta?: Delta;
  /** Série para o sparkline (opcional). */
  spark?: number[];
  /** Destaque dourado para a métrica principal. */
  highlight?: boolean;
  /** Métrica em que cair é bom (ex.: taxa de faltas) → inverte a cor. */
  goodWhenDown?: boolean;
  isLoading?: boolean;
}

/**
 * Cartão de métrica executivo: rótulo, valor, variação vs. período anterior e
 * sparkline opcional. A cor da variação segue a direção (verde sobe / vermelho
 * cai), com inversão para métricas onde cair é positivo.
 */
export function MetricCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  spark,
  highlight,
  goodWhenDown,
  isLoading,
}: MetricCardProps) {
  if (isLoading) {
    return <Skeleton className="h-[132px] rounded-2xl" />;
  }

  const showDelta = delta && delta.pct !== null && delta.direction !== "flat";
  const isGood = delta
    ? goodWhenDown
      ? delta.direction === "down"
      : delta.direction === "up"
    : false;
  const DeltaIcon =
    delta?.direction === "up" ? TrendingUp : delta?.direction === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-surface p-5 shadow-card",
        "transition-shadow duration-150 ease-out-quint hover:shadow-soft",
        highlight ? "border-gold-200" : "border-line",
      )}
    >
      {highlight && <span className="absolute inset-x-0 top-0 h-0.5 bg-gold-400" aria-hidden />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-mute">{label}</p>
          <p className="mt-1.5 truncate text-3xl font-semibold tracking-tight text-ink">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            highlight ? "bg-gold-100 text-gold-700" : "bg-graphite-100 text-graphite-500",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {showDelta ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
              {formatPercent(delta!.pct as number)}
            </span>
          ) : null}
          <span className="truncate text-xs text-ink-mute">
            {hint ?? (delta ? "vs. período anterior" : "")}
          </span>
        </div>
        {spark && spark.length > 1 && (
          <MiniChart data={spark} className="h-8 w-24 shrink-0" />
        )}
      </div>
    </div>
  );
}
