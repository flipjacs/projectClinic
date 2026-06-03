import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SectionTitleProps {
  children: ReactNode;
  /** Ação opcional à direita (ex.: link "Ver todos"). */
  action?: ReactNode;
  className?: string;
}

/** Rótulo de seção padronizado das telas (caixa-alta discreta). */
export function SectionTitle({ children, action, className }: SectionTitleProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-mute">{children}</h2>
      {action}
    </div>
  );
}
