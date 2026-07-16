import { Activity } from "lucide-react";

import pkg from "../../../../package.json";
import {
  SettingsGroup,
  SettingsItem,
  SettingsPageShell,
  SettingsPlaceholder,
  SettingsSection,
} from "../components";

/** Rótulo amigável do ambiente de execução (sem expor URLs ou segredos). */
const ENVIRONMENT_LABEL = import.meta.env.PROD ? "Produção" : "Desenvolvimento";

export function SystemSettingsPage() {
  return (
    <SettingsPageShell categoryKey="system">
      <SettingsGroup>
        <SettingsSection
          title="Sobre o sistema"
          description="Informações da instalação atual do OdontoPrime."
        >
          <SettingsItem
            label="Versão"
            control={
              <span className="rounded-md bg-graphite-50 px-2 py-1 font-mono text-xs text-ink-soft">
                v{pkg.version}
              </span>
            }
          />
          <SettingsItem
            label="Ambiente"
            control={<span className="text-sm text-ink-soft">{ENVIRONMENT_LABEL}</span>}
          />
        </SettingsSection>

        <SettingsPlaceholder
          icon={Activity}
          title="Monitoramento e manutenção"
          description="Diagnóstico do sistema em tempo real, direto desta página."
          planned={[
            { title: "Status da API", text: "Disponibilidade do servidor em tempo real." },
            { title: "Saúde do sistema", text: "Banco de dados, fila de tarefas e serviços." },
            { title: "Logs de aplicação", text: "Eventos recentes para diagnóstico." },
            { title: "Atualizações", text: "Novidades de versão e notas de lançamento." },
          ]}
        />
      </SettingsGroup>
    </SettingsPageShell>
  );
}
