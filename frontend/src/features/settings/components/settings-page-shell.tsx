import type { ReactNode } from "react";

import { SETTINGS_CATEGORIES } from "../constants";
import { SettingsBadge } from "./settings-badge";
import { SettingsBreadcrumb } from "./settings-breadcrumb";

/**
 * Esqueleto comum das páginas internas de Configurações: breadcrumb, cabeçalho
 * com o estado da categoria e o conteúdo. Os dados (rótulo, descrição, badge)
 * vêm do registro central de categorias — uma fonte só.
 */
export function SettingsPageShell({
  categoryKey,
  actions,
  children,
}: {
  categoryKey: string;
  /** Ações do cabeçalho (botões, links) — opcional. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  const category = SETTINGS_CATEGORIES.find((c) => c.key === categoryKey);

  // Guarda de desenvolvimento: chave errada é bug de programação, não estado de UI.
  if (!category) {
    throw new Error(`Categoria de configurações desconhecida: "${categoryKey}"`);
  }

  return (
    <>
      <SettingsBreadcrumb current={category.label} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {category.label}
            </h1>
            <SettingsBadge status={category.status} />
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink-mute">{category.description}</p>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </>
  );
}
