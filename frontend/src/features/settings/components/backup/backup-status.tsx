import { DatabaseBackup } from "lucide-react";

import { formatDateTime } from "@/utils/format";
import type { BackupOverview } from "../../services/settings-backup-api";
import { FeatureCard } from "../feature-card";
import { SettingsBadge } from "../settings-badge";
import { SettingsItem } from "../settings-item";
import { BackupActions } from "./backup-actions";

/** Situação atual das cópias de segurança + ações principais. */
export function BackupStatus({ data }: { data: BackupOverview | null }) {
  const hasBackup = Boolean(data?.lastBackupAt);

  return (
    <FeatureCard
      icon={DatabaseBackup}
      title="Status do backup"
      description="Proteção atual dos dados da clínica."
      badge={<SettingsBadge status={hasBackup ? "configured" : "attention"} />}
      flush
    >
      <SettingsItem
        label="Último backup"
        control={
          <span className="text-sm tabular-nums text-ink-soft">
            {hasBackup ? formatDateTime(data?.lastBackupAt) : "Nenhum backup realizado"}
          </span>
        }
      />
      <SettingsItem
        label="Próximo backup"
        description="Agendamento automático definido pelo servidor."
        control={
          <span className="text-sm tabular-nums text-ink-soft">
            {data?.nextBackupAt ? formatDateTime(data.nextBackupAt) : "Não agendado"}
          </span>
        }
      />
      <SettingsItem
        label="Tamanho total"
        control={<span className="text-sm tabular-nums text-ink-soft">{data?.totalSize ?? "—"}</span>}
      />
      <SettingsItem
        label="Retenção"
        description="Por quanto tempo cada cópia é mantida."
        control={
          <span className="text-sm tabular-nums text-ink-soft">
            {data?.retentionDays != null ? `${data.retentionDays} dias` : "—"}
          </span>
        }
      />
      <div className="px-5 py-4">
        <BackupActions hasBackup={hasBackup} />
      </div>
    </FeatureCard>
  );
}
