import type { LucideIcon } from "lucide-react";

/**
 * Estado de uma categoria de configurações — vira badge no card e no header.
 * "configured": área ativa e utilizável hoje.
 * "attention": algo real pede ação do administrador (ex.: backup não configurado).
 * "soon": categoria planejada; a página mostra o que ela vai oferecer.
 */
export type SettingsStatus = "configured" | "attention" | "soon";

/** Uma categoria do hub de Configurações (um card → uma página própria). */
export interface SettingsCategory {
  key: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  status: SettingsStatus;
  /** Quantidade de ajustes que a categoria expõe (ou vai expor). */
  count: number;
  /**
   * Termos extras de busca (sem acento; a normalização cobre o resto).
   * Permite achar "Segurança" digitando "senha", "2fa", "sessão"…
   */
  keywords: string[];
}

/** Item planejado exibido nos placeholders de categorias futuras. */
export interface PlannedSetting {
  title: string;
  text: string;
}
