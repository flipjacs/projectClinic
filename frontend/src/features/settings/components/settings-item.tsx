import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/**
 * Linha de configuração dentro de uma <SettingsSection>: rótulo + descrição à
 * esquerda, controle (switch, botão, valor) à direita. Em telas estreitas o
 * controle desce para baixo do texto.
 */
export function SettingsItem({
  label,
  description,
  control,
  className,
}: {
  label: string;
  description?: string;
  /** Controle ou valor exibido à direita (Switch, Button, Badge, texto…). */
  control?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="mt-0.5 text-sm text-ink-mute">{description}</p>}
      </div>
      {control && <div className="flex shrink-0 items-center gap-2">{control}</div>}
    </div>
  );
}
