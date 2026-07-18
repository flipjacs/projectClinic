import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";

export type InsightTone = "gold" | "success" | "warning" | "danger" | "info" | "neutral";

const CHIP: Record<InsightTone, string> = {
  gold: "bg-gold-100 text-gold-700",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  info: "bg-sky-50 text-sky-600",
  neutral: "bg-graphite-100 text-graphite-500",
};

export interface InsightCardProps {
  icon: LucideIcon;
  tone?: InsightTone;
  title: string;
  description: string;
}

/** Cartão de insight automático: ícone, título curto e uma frase de apoio. */
export function InsightCard({ icon: Icon, tone = "neutral", title, description }: InsightCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          CHIP[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-mute">{description}</p>
      </div>
    </div>
  );
}
