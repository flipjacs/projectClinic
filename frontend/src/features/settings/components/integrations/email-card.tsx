import { Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/format";
import { useSendTestEmail } from "../../hooks/use-integrations";
import type { IntegrationsOverview } from "../../services/settings-integrations-api";
import { FeatureCard } from "../feature-card";
import { FeatureUnavailable } from "../feature-unavailable";
import { SettingsItem } from "../settings-item";
import { IntegrationStatus } from "./integration-status";

type EmailState = IntegrationsOverview["email"] | null;

/** Envio de e-mails do sistema (lembretes, recibos, avisos). */
export function EmailCard({ data }: { data: EmailState }) {
  const testEmail = useSendTestEmail();
  const configured = data?.status === "connected";

  return (
    <FeatureCard
      icon={Mail}
      title="E-mail"
      description="Servidor de envio dos avisos e documentos do sistema."
      badge={<IntegrationStatus status={data?.status ?? "disconnected"} />}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => testEmail.mutate()}
          isLoading={testEmail.isPending}
          disabled={!configured}
          title={configured ? undefined : "Disponível após configurar o servidor"}
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Testar envio
        </Button>
      }
      flush
    >
      <SettingsItem
        label="Servidor"
        description="Endereço de envio configurado pelo suporte."
        control={
          <span className="text-sm text-ink-soft">{data?.server ?? "Não configurado"}</span>
        }
      />
      <SettingsItem
        label="Último envio"
        control={
          <span className="text-sm tabular-nums text-ink-soft">
            {formatDateTime(data?.lastSentAt)}
          </span>
        }
      />
      <SettingsItem
        label="Último erro"
        control={
          <span className="text-sm tabular-nums text-ink-soft">
            {formatDateTime(data?.lastErrorAt)}
          </span>
        }
      />
      {!configured && (
        <div className="px-5 py-4">
          <FeatureUnavailable description="A configuração do servidor de e-mail chega junto com o suporte do backend — primeiro canal do roadmap de notificações." />
        </div>
      )}
    </FeatureCard>
  );
}
