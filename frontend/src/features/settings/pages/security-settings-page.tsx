import { ShieldCheck } from "lucide-react";

import {
  SettingsDangerZone,
  SettingsGroup,
  SettingsPageShell,
  SettingsPlaceholder,
} from "../components";

export function SecuritySettingsPage() {
  return (
    <SettingsPageShell categoryKey="security">
      <SettingsGroup>
        <SettingsPlaceholder
          icon={ShieldCheck}
          description="As políticas de segurança do sistema serão controladas aqui. O acesso por perfil e a proteção das rotas já estão ativos."
          planned={[
            { title: "Política de senhas", text: "Tamanho mínimo, complexidade e validade." },
            { title: "Tempo de sessão", text: "Encerramento automático por inatividade." },
            { title: "Autenticação em duas etapas", text: "Camada extra de proteção no login." },
            { title: "Trilha de auditoria", text: "Registro de ações sensíveis por usuário." },
            { title: "Privacidade", text: "Controles de dados pessoais (LGPD)." },
          ]}
        />

        <SettingsDangerZone
          actions={[
            {
              key: "end-sessions",
              label: "Encerrar todas as sessões",
              description: "Desconecta todos os usuários ativos, inclusive você.",
              buttonLabel: "Encerrar sessões",
              confirmTitle: "Encerrar todas as sessões?",
              confirmMessage:
                "Todos os usuários serão desconectados imediatamente e precisarão entrar de novo. Esta ação não apaga nenhum dado.",
            },
          ]}
        />
      </SettingsGroup>
    </SettingsPageShell>
  );
}
