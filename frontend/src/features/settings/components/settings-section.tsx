import { useId, type ReactNode } from "react";

import { cn } from "@/utils/cn";

/**
 * Bloco de configurações de uma página interna: título + descrição fora do
 * cartão, itens dentro de um cartão branco com divisores. Os filhos típicos
 * são <SettingsItem> / <SettingsSwitch>.
 */
export function SettingsSection({
  title,
  description,
  badge,
  children,
  className,
}: {
  title: string;
  description?: string;
  /** Badge opcional ao lado do título (ex.: "Em breve"). */
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={headingId} className="text-sm font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {badge}
      </div>
      {description && <p className="mt-1 text-sm text-ink-mute">{description}</p>}
      <div
        className={cn(
          "mt-3 divide-y divide-line rounded-2xl border border-line bg-white shadow-card",
        )}
      >
        {children}
      </div>
    </section>
  );
}
