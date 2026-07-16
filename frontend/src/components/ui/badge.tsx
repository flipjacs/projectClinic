import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

type Tone = "gold" | "neutral" | "success" | "warning" | "danger" | "info";

/**
 * Badges discretos para status. Cada tom traz cor de fundo + texto + um anel
 * sutil — o rótulo textual sempre acompanha, então o significado nunca depende
 * só da cor (acessibilidade).
 */
const tones: Record<Tone, string> = {
  gold: "bg-gold-100 text-gold-800 ring-gold-200",
  neutral: "bg-graphite-100 text-graphite-700 ring-graphite-200",
  success: "bg-success-50 text-success-700 ring-success-200",
  warning: "bg-warning-50 text-warning-700 ring-warning-200",
  danger: "bg-danger-50 text-danger-700 ring-danger-200",
  info: "bg-info-50 text-info-700 ring-info-200",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
