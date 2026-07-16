import { Plug } from "lucide-react";

import { SettingsGroup, SettingsPageShell, SettingsPlaceholder } from "../components";

export function IntegrationsSettingsPage() {
  return (
    <SettingsPageShell categoryKey="integrations">
      <SettingsGroup>
        <SettingsPlaceholder
          icon={Plug}
          description="Conexões com serviços externos serão configuradas aqui, cada uma com ativação independente e chaves protegidas."
          planned={[
            { title: "Google Agenda", text: "Sincroniza as consultas com o calendário da clínica." },
            { title: "WhatsApp", text: "Confirmação de consultas direto com o paciente." },
            { title: "E-mail transacional", text: "Envio de lembretes e recibos." },
            { title: "API e webhooks", text: "Integrações personalizadas com outros sistemas." },
          ]}
        />
      </SettingsGroup>
    </SettingsPageShell>
  );
}
