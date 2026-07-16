import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { cn } from "@/utils/cn";

export type InventoryCardTone =
  | "neutral"
  | "gold"
  | "success"
  | "warning"
  | "danger"
  | "orange";

interface InventoryCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: InventoryCardTone;
  hint?: string;
  /** Torna o card um atalho navegável (mantém aparência, ganha hover/foco). */
  to?: string;
}

const CHIP: Record<InventoryCardTone, string> = {
  neutral: "bg-graphite-100 text-graphite-500",
  gold: "bg-gold-100 text-gold-700",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
};

const RULE: Record<InventoryCardTone, string> = {
  neutral: "bg-transparent",
  gold: "bg-gold-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  orange: "bg-orange-400",
};

const VALUE_TONE: Record<InventoryCardTone, string> = {
  neutral: "text-ink",
  gold: "text-ink",
  success: "text-ink",
  warning: "text-amber-700",
  danger: "text-red-700",
  orange: "text-orange-700",
};

const BORDER: Record<InventoryCardTone, string> = {
  neutral: "border-line",
  gold: "border-gold-200",
  success: "border-line",
  warning: "border-amber-200/70",
  danger: "border-red-200/70",
  orange: "border-orange-200/70",
};

/**
 * Cartão de métrica do estoque. Fundo branco calmo; o tom entra apenas no chip
 * do ícone, na régua superior e, quando há atenção (contagem > 0), no número.
 * Sem cores chapadas fortes — coerente com a identidade OdontoPrime.
 */
export function InventoryCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
  to,
}: InventoryCardProps) {
  const numeric = typeof value === "number" ? value : Number(value);
  const emphasize = Number.isFinite(numeric) ? numeric > 0 : false;

  const body = (
    <>
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", RULE[tone])}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink-mute">{label}</p>
          <p
            className={cn(
              "mt-1.5 truncate text-3xl font-semibold tracking-tight",
              emphasize ? VALUE_TONE[tone] : "text-ink",
            )}
          >
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>}
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            CHIP[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </>
  );

  const base = cn(
    "group relative block overflow-hidden rounded-2xl border bg-white p-5 shadow-card",
    "transition-shadow duration-150 ease-out-quint",
    BORDER[tone],
  );

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          base,
          "hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2",
        )}
      >
        {body}
      </Link>
    );
  }

  return <div className={base}>{body}</div>;
}
