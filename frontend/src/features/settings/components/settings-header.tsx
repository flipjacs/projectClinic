import type { ReactNode } from "react";

/**
 * Cabeçalho do hub de Configurações. Mesma hierarquia do PageHeader do app,
 * com espaço à direita para meta-informação (atalho de busca, status de
 * sincronização futuro).
 */
export function SettingsHeader({
  title,
  description,
  meta,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-mute">{description}</p>
        )}
      </div>
      {meta && <div className="flex shrink-0 items-center gap-2">{meta}</div>}
    </div>
  );
}
