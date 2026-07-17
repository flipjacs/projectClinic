import { ErrorState } from "@/components/feedback/error-state";
import { SettingsPageShell } from "../components";
import { BackupDangerZone, BackupHistory, BackupStatus } from "../components/backup";
import { SettingsFormSkeleton } from "../components/settings-form-skeleton";
import { useBackup } from "../hooks/use-backup";

/**
 * Configurações → Backup. Status honesto das cópias de segurança, histórico
 * em tabela e zona de risco com confirmação dupla para o irreversível.
 */
export function BackupSettingsPage() {
  const query = useBackup();

  return (
    <SettingsPageShell categoryKey="backup">
      {query.isLoading ? (
        <SettingsFormSkeleton cards={2} />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar as informações de backup"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="max-w-3xl space-y-6">
          <BackupStatus data={query.data ?? null} />
          <BackupHistory entries={query.data?.history ?? []} />
          <BackupDangerZone />
        </div>
      )}
    </SettingsPageShell>
  );
}
