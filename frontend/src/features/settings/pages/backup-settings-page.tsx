import { DatabaseBackup } from "lucide-react";

import {
  SettingsDangerZone,
  SettingsGroup,
  SettingsItem,
  SettingsPageShell,
  SettingsPlaceholder,
  SettingsSection,
} from "../components";
import { SettingsBadge } from "../components/settings-badge";

export function BackupSettingsPage() {
  return (
    <SettingsPageShell categoryKey="backup">
      <SettingsGroup>
        <SettingsSection
          title="Status"
          description="Situação atual das cópias de segurança da clínica."
        >
          <SettingsItem
            label="Backup automático"
            description="Nenhuma rotina de backup foi configurada até o momento."
            control={<SettingsBadge status="attention" />}
          />
        </SettingsSection>

        <SettingsPlaceholder
          icon={DatabaseBackup}
          description="A proteção dos dados da clínica será gerenciada aqui, com rotinas automáticas e restauração assistida."
          planned={[
            { title: "Backup agendado", text: "Cópias diárias automáticas do banco de dados." },
            { title: "Histórico de cópias", text: "Lista das últimas execuções com status." },
            { title: "Exportação de dados", text: "Baixe seus dados em formatos abertos." },
          ]}
        />

        <SettingsDangerZone
          description="Restaurações substituem os dados atuais. Cada ação exige confirmação."
          actions={[
            {
              key: "restore",
              label: "Restaurar backup",
              description: "Substitui todos os dados atuais pela última cópia de segurança.",
              buttonLabel: "Restaurar dados",
              confirmTitle: "Restaurar o último backup?",
              confirmMessage:
                "Os dados atuais serão substituídos pela última cópia de segurança. Alterações feitas depois dela serão perdidas. Esta ação não pode ser desfeita.",
            },
          ]}
        />
      </SettingsGroup>
    </SettingsPageShell>
  );
}
