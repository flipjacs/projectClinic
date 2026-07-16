import { Badge } from "@/components/ui/badge";
import type { SettingsStatus } from "../types/settings";

/**
 * Badge de estado das categorias de Configurações. O rótulo textual sempre
 * acompanha a cor — o significado nunca depende só do tom.
 */
const STATUS_BADGE: Record<SettingsStatus, { tone: "success" | "warning" | "neutral"; label: string }> = {
  configured: { tone: "success", label: "Configurado" },
  attention: { tone: "warning", label: "Requer atenção" },
  soon: { tone: "neutral", label: "Em breve" },
};

export function SettingsBadge({ status }: { status: SettingsStatus }) {
  const { tone, label } = STATUS_BADGE[status];
  return <Badge tone={tone}>{label}</Badge>;
}
