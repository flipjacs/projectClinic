import { Cpu, Info } from "lucide-react";
import { useMemo } from "react";

import { formatDateTime } from "@/utils/format";
import { SettingsPageShell } from "../components";
import {
  collectClientInfo,
  HealthStatusCard,
  SystemInfoCard,
  VersionBadge,
} from "../components/system";
import { useSystemInfo } from "../hooks/use-system-info";

/** Rótulo amigável do ambiente de execução (sem expor URLs ou segredos). */
const ENVIRONMENT_LABEL = import.meta.env.PROD ? "Produção" : "Desenvolvimento";

/**
 * Configurações → Sistema. Painel de saúde com dados reais dos endpoints
 * /health e /ready do backend, informações de versão/build e o retrato
 * técnico do ambiente do usuário para suporte.
 */
export function SystemSettingsPage() {
  const status = useSystemInfo();
  const client = useMemo(collectClientInfo, []);

  return (
    <SettingsPageShell categoryKey="system">
      <div className="max-w-3xl space-y-6">
        <SystemInfoCard
          icon={Info}
          title="Sobre o sistema"
          description="Instalação atual do OdontoPrime."
          badge={<VersionBadge />}
          rows={[
            { label: "Versão do sistema", value: `v${__APP_VERSION__}` },
            {
              label: "Data da build",
              description: "Quando esta versão do frontend foi gerada.",
              value: formatDateTime(__BUILD_DATE__),
            },
            { label: "Ambiente", value: ENVIRONMENT_LABEL },
            {
              label: "Versão do servidor",
              value: status.data?.backendVersion ? `v${status.data.backendVersion}` : "—",
            },
            {
              label: "Banco de dados",
              value:
                status.data?.database.state === "up"
                  ? "Conectado"
                  : status.data?.database.state === "down"
                    ? "Indisponível"
                    : "—",
            },
          ]}
        />

        <HealthStatusCard
          status={status.data}
          isLoading={status.isLoading}
          isFetching={status.isFetching}
          onRefresh={() => void status.refetch()}
        />

        <SystemInfoCard
          icon={Cpu}
          title="Informações técnicas"
          description="Dados do seu ambiente — úteis ao falar com o suporte."
          rows={[
            { label: "Versão do React", value: client.reactVersion },
            { label: "Navegador", value: client.browser },
            { label: "Sistema operacional", value: client.os },
            { label: "Fuso horário", value: client.timezone },
            { label: "Idioma do navegador", value: client.locale },
          ]}
        />
      </div>
    </SettingsPageShell>
  );
}
