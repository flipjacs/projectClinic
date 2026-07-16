import { MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  SettingsGroup,
  SettingsPageShell,
  SettingsPlaceholder,
  SettingsSection,
  SettingsSwitch,
} from "../components";

export function NotificationsSettingsPage() {
  return (
    <SettingsPageShell categoryKey="notifications">
      <SettingsGroup>
        <SettingsSection
          title="Avisos automáticos"
          description="Pré-visualização das preferências que estarão disponíveis. Os controles serão liberados junto com o envio de e-mails."
          badge={<Badge tone="gold">Em breve</Badge>}
        >
          <SettingsSwitch
            label="Lembrete de consulta"
            description="Avisa o paciente por e-mail um dia antes do horário marcado."
            disabled
          />
          <SettingsSwitch
            label="Cobranças pendentes"
            description="Notifica a administração sobre pagamentos em atraso."
            disabled
          />
          <SettingsSwitch
            label="Estoque baixo"
            description="Alerta quando um item atinge o estoque mínimo definido."
            disabled
          />
        </SettingsSection>

        <SettingsPlaceholder
          icon={MessageSquareText}
          title="Novos canais de aviso"
          description="Além do e-mail, outros canais chegam nas próximas fases."
          planned={[
            { title: "SMS", text: "Lembretes por mensagem de texto." },
            { title: "Resumo diário", text: "Agenda do dia enviada à equipe pela manhã." },
          ]}
        />
      </SettingsGroup>
    </SettingsPageShell>
  );
}
