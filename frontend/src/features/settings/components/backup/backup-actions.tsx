import { CloudDownload, DatabaseBackup, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { useCreateBackup } from "../../hooks/use-backup";

/**
 * Ações principais de backup. Criar sempre pede confirmação; baixar,
 * restaurar e excluir agem sobre uma cópia específica — ficam disponíveis
 * quando houver backups no histórico.
 */
export function BackupActions({ hasBackup }: { hasBackup: boolean }) {
  const createBackup = useCreateBackup();
  const [confirmCreate, setConfirmCreate] = useState(false);
  const unavailableHint = "Disponível quando houver um backup no histórico";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        onClick={() => setConfirmCreate(true)}
        isLoading={createBackup.isPending}
      >
        <DatabaseBackup className="h-3.5 w-3.5" aria-hidden />
        Criar backup
      </Button>
      <Button variant="secondary" size="sm" disabled={!hasBackup} title={hasBackup ? undefined : unavailableHint}>
        <CloudDownload className="h-3.5 w-3.5" aria-hidden />
        Baixar
      </Button>
      <Button variant="secondary" size="sm" disabled={!hasBackup} title={hasBackup ? undefined : unavailableHint}>
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Restaurar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-danger-600 hover:bg-danger-50 active:bg-danger-100"
        disabled={!hasBackup}
        title={hasBackup ? undefined : unavailableHint}
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Excluir
      </Button>

      <ConfirmDialog
        open={confirmCreate}
        title="Criar backup agora?"
        message="Uma cópia completa dos dados da clínica será gerada. A operação roda em segundo plano e não interrompe o uso do sistema."
        confirmLabel="Criar backup"
        isLoading={createBackup.isPending}
        onConfirm={() =>
          createBackup.mutate(undefined, { onSettled: () => setConfirmCreate(false) })
        }
        onClose={() => setConfirmCreate(false)}
      />
    </div>
  );
}
