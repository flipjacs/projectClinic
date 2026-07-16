import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({
  title = "Nenhum registro encontrado",
  description = "Não há dados para exibir no momento.",
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/40 px-6 py-14 text-center">
      {/* Medalhão em camadas — halo dourado suave, sem ilustração rabiscada. */}
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-gold-50" />
        <span className="absolute inset-[6px] rounded-full bg-gold-100/70" />
        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-gold-200">
          <Icon className="h-5 w-5 text-gold-600" />
        </span>
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-mute">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
