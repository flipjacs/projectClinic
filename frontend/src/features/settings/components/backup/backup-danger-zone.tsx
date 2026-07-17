import { toast } from "@/stores/toast-store";
import { useBackup, useBackupMaintenance, useRestoreBackup } from "../../hooks/use-backup";
import { SettingsDangerZone } from "../settings-danger-zone";

/**
 * Zona de risco do Backup. As três operações são irreversíveis — todas com
 * confirmação dupla (diálogo + reconhecimento explícito das consequências).
 */
export function BackupDangerZone() {
  const backup = useBackup();
  const restore = useRestoreBackup();
  const { clearHistory, resetSettings } = useBackupMaintenance();
  const lastBackupId = backup.data?.history.find((e) => e.status === "completed")?.id;

  return (
    <SettingsDangerZone
      description="Operações irreversíveis. Cada uma exige confirmação dupla antes de executar."
      actions={[
        {
          key: "restore",
          label: "Restaurar último backup",
          description: "Substitui todos os dados atuais pela última cópia concluída.",
          buttonLabel: "Restaurar dados",
          confirmTitle: "Restaurar o último backup?",
          confirmMessage:
            "Os dados atuais serão substituídos pela última cópia de segurança concluída. Alterações feitas depois dela serão perdidas.",
          doubleConfirm: true,
          isLoading: restore.isPending,
          onConfirm: () => {
            if (lastBackupId) restore.mutate(lastBackupId);
            else toast.info("Não há backup concluído para restaurar.");
          },
        },
        {
          key: "clear-history",
          label: "Excluir histórico",
          description: "Remove todas as cópias de segurança armazenadas.",
          buttonLabel: "Excluir histórico",
          confirmTitle: "Excluir todo o histórico de backups?",
          confirmMessage:
            "Todas as cópias de segurança serão removidas permanentemente. Sem elas, não será possível restaurar dados anteriores.",
          doubleConfirm: true,
          isLoading: clearHistory.isPending,
          onConfirm: () => clearHistory.mutate(),
        },
        {
          key: "reset-settings",
          label: "Resetar configurações",
          description: "Restaura todas as Configurações do sistema aos padrões.",
          buttonLabel: "Resetar configurações",
          confirmTitle: "Resetar todas as configurações?",
          confirmMessage:
            "Clínica, segurança, notificações e aparência voltarão aos valores padrão. Dados de pacientes, agenda e financeiro NÃO são afetados.",
          doubleConfirm: true,
          isLoading: resetSettings.isPending,
          onConfirm: () => resetSettings.mutate(),
        },
      ]}
    />
  );
}
