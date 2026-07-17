import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/stores/toast-store";
import {
  clearBackupHistory,
  createBackup,
  getBackupOverview,
  resetAllSettings,
  restoreBackup,
} from "../services/settings-backup-api";
import { notifySettingsActionError } from "./settings-feedback";

export const backupKeys = {
  all: ["settings", "backup"] as const,
};

/** Visão geral de backups; `null` = nenhum backup registrado ainda. */
export function useBackup() {
  return useQuery({
    queryKey: backupKeys.all,
    queryFn: getBackupOverview,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      toast.success("Backup iniciado. Ele aparecerá no histórico ao concluir.");
      void qc.invalidateQueries({ queryKey: backupKeys.all });
    },
    onError: notifySettingsActionError,
  });
}

export function useRestoreBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreBackup(id),
    onSuccess: () => {
      toast.success("Restauração iniciada. O sistema avisará ao concluir.");
      void qc.invalidateQueries({ queryKey: backupKeys.all });
    },
    onError: notifySettingsActionError,
  });
}

/** Ações da zona de risco — sempre atrás de confirmação dupla na UI. */
export function useBackupMaintenance() {
  const qc = useQueryClient();
  const clearHistory = useMutation({
    mutationFn: clearBackupHistory,
    onSuccess: () => {
      toast.success("Histórico de backups excluído.");
      void qc.invalidateQueries({ queryKey: backupKeys.all });
    },
    onError: notifySettingsActionError,
  });
  const resetSettings = useMutation({
    mutationFn: resetAllSettings,
    onSuccess: () => {
      toast.success("Configurações restauradas aos padrões.");
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: notifySettingsActionError,
  });
  return { clearHistory, resetSettings };
}
