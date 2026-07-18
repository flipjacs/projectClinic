import { KeySquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IntegrationsOverview } from "../../services/settings-integrations-api";
import { FeatureCard } from "../feature-card";
import { FeatureUnavailable } from "../feature-unavailable";
import { SettingsItem } from "../settings-item";

type ApiState = IntegrationsOverview["api"] | null;

/**
 * Acesso programático (API + webhooks). A chave NUNCA aparece completa:
 * o backend só envia a versão mascarada — aqui não existe segredo algum.
 */
export function ApiIntegrationCard({ data }: { data: ApiState }) {
  return (
    <FeatureCard
      icon={KeySquare}
      title="API e webhooks"
      description="Conecte o OdontoPrime a outros sistemas da clínica."
      badge={<Badge tone="gold">Em breve</Badge>}
      flush
    >
      <SettingsItem
        label="Chave de API"
        description="Sempre exibida mascarada. A chave completa aparece uma única vez, ao ser gerada."
        control={
          data?.hasKey && data.maskedKey ? (
            <code className="rounded-md bg-surface-muted px-2 py-1 font-mono text-xs text-ink-soft">
              {data.maskedKey}
            </code>
          ) : (
            <span className="text-sm text-ink-mute">Nenhuma chave gerada</span>
          )
        }
      />
      <SettingsItem
        label="Webhook"
        description="URL que recebe eventos do sistema (consultas, pagamentos)."
        control={
          <span className="max-w-[16rem] truncate text-sm text-ink-soft">
            {data?.webhookUrl ?? "Não configurado"}
          </span>
        }
      />
      <SettingsItem
        label="Rotação de chave"
        description="Gere uma nova chave e invalide a anterior sem interromper integrações."
        control={
          <Button variant="secondary" size="sm" disabled title="Disponível em breve">
            Gerar nova chave
          </Button>
        }
      />
      <div className="px-5 py-4">
        <FeatureUnavailable description="A API pública entra em fase beta junto com o suporte do servidor. Chaves, webhooks e documentação serão gerados aqui." />
      </div>
    </FeatureCard>
  );
}
