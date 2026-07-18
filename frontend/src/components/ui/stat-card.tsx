import type { LucideIcon } from "lucide-react";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { cn } from "@/utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  /** Destaque dourado para indicadores prioritários do dia. */
  highlight?: boolean;
}

/**
 * Cartão de métrica do painel. Hierarquia clara: rótulo discreto, número grande
 * e legível, dica de apoio. O ícone vive num chip à direita; o destaque dourado
 * é reservado às métricas prioritárias (consultas/faturamento), sem gradientes.
 */
export function StatCard({ label, value, icon: Icon, hint, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-surface p-5 shadow-card",
        "transition-shadow duration-150 ease-out-quint hover:shadow-soft",
        highlight ? "border-gold-200" : "border-line",
      )}
    >
      {/* Régua superior dourada apenas no destaque (não é borda lateral). */}
      {highlight && (
        <span className="absolute inset-x-0 top-0 h-0.5 bg-gold-400" aria-hidden />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-mute">{label}</p>
          <p className="mt-1.5 truncate text-3xl font-semibold tracking-tight text-ink">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>}
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            highlight
              ? "bg-gold-100 text-gold-700"
              : "bg-graphite-100 text-graphite-500",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}
