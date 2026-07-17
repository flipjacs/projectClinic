import { CloudDownload, History, RotateCcw } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { formatDateTime } from "@/utils/format";
import { useRestoreBackup } from "../../hooks/use-backup";
import type { BackupEntry, BackupEntryStatus } from "../../services/settings-backup-api";
import { FeatureCard } from "../feature-card";

const STATUS_BADGE: Record<BackupEntryStatus, { tone: "success" | "danger" | "gold"; label: string }> = {
  completed: { tone: "success", label: "Concluído" },
  failed: { tone: "danger", label: "Falhou" },
  running: { tone: "gold", label: "Em andamento" },
};

const TYPE_LABEL: Record<BackupEntry["type"], string> = {
  auto: "Automático",
  manual: "Manual",
};

/**
 * Histórico de cópias em tabela. Sem registros, mostra um estado vazio que
 * explica o que aparecerá aqui — nunca uma tabela em branco.
 */
export function BackupHistory({ entries }: { entries: BackupEntry[] }) {
  const restore = useRestoreBackup();
  const [restoring, setRestoring] = useState<BackupEntry | null>(null);

  return (
    <FeatureCard
      icon={History}
      title="Histórico"
      description="Cópias de segurança geradas pelo sistema."
      flush
    >
      {entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-ink">Nenhum backup no histórico</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-mute">
            Assim que o primeiro backup for criado, cada cópia aparecerá aqui com
            data, tamanho e as opções de baixar ou restaurar.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-ink-mute">
                <th scope="col" className="px-5 py-2.5">Data</th>
                <th scope="col" className="px-5 py-2.5">Tipo</th>
                <th scope="col" className="px-5 py-2.5">Status</th>
                <th scope="col" className="px-5 py-2.5">Tamanho</th>
                <th scope="col" className="px-5 py-2.5">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {entries.map((entry) => {
                const badge = STATUS_BADGE[entry.status];
                const usable = entry.status === "completed";
                return (
                  <tr key={entry.id}>
                    <td className="px-5 py-3 tabular-nums text-ink-soft">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{TYPE_LABEL[entry.type]}</td>
                    <td className="px-5 py-3">
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-ink-soft">{entry.size ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className="flex justify-end gap-1">
                        <IconButton
                          label={`Baixar backup de ${formatDateTime(entry.createdAt)}`}
                          icon={CloudDownload}
                          disabled={!usable}
                        />
                        <IconButton
                          label={`Restaurar backup de ${formatDateTime(entry.createdAt)}`}
                          icon={RotateCcw}
                          disabled={!usable}
                          onClick={() => setRestoring(entry)}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={restoring !== null}
        tone="danger"
        title="Restaurar esta cópia?"
        message={`Os dados atuais serão substituídos pela cópia de ${
          restoring ? formatDateTime(restoring.createdAt) : ""
        }. Alterações feitas depois dela serão perdidas.`}
        confirmLabel="Restaurar dados"
        isLoading={restore.isPending}
        onConfirm={() => {
          if (!restoring) return;
          restore.mutate(restoring.id, { onSettled: () => setRestoring(null) });
        }}
        onClose={() => setRestoring(null)}
      />
    </FeatureCard>
  );
}
