import type { ReactNode } from "react";

/**
 * Agrupa as seções de uma página de Configurações com ritmo vertical
 * consistente. Toda página interna envolve seu conteúdo neste componente.
 */
export function SettingsGroup({ children }: { children: ReactNode }) {
  return <div className="flex max-w-3xl flex-col gap-8">{children}</div>;
}
