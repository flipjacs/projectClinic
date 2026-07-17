import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Badge de estado/disponibilidade ao lado do título. */
  badge?: ReactNode;
  /** Ações no canto do cabeçalho (botões). */
  actions?: ReactNode;
  children: ReactNode;
  /** Remove o padding do corpo (para listas com divisores). */
  flush?: boolean;
}

/**
 * Card padrão das seções de Segurança e Notificações: ícone em medalhão
 * dourado, título + descrição, badge de disponibilidade e corpo livre.
 * Exportado também como SecurityCard/NotificationCard nos barrels de cada
 * área — mesmo componente, vocabulário do domínio.
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  actions,
  children,
  flush,
}: FeatureCardProps) {
  return (
    <Card>
      <CardHeader className="items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100"
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{title}</CardTitle>
              {badge}
            </div>
            <p className="mt-0.5 text-xs text-ink-mute">{description}</p>
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardHeader>
      <div className={cn(flush ? "divide-y divide-line" : "px-5 py-4")}>{children}</div>
    </Card>
  );
}
