import axios from "axios";

import { api } from "@/lib/api";

/**
 * Client HTTP do Backup.
 *
 * O backend AINDA NÃO expõe estes endpoints — contrato definido aqui para a
 * UI operar desacoplada. GET 404 = "nenhum backup ainda"; ações falham com
 * mensagem honesta até o backend chegar.
 */

const BACKUP_PATH = "/settings/backup";

export type BackupEntryStatus = "completed" | "failed" | "running";

export interface BackupEntry {
  id: string;
  createdAt: string;
  type: "auto" | "manual";
  status: BackupEntryStatus;
  /** Tamanho legível formatado pelo backend (ex.: "128 MB"). */
  size: string | null;
}

export interface BackupOverview {
  lastBackupAt: string | null;
  nextBackupAt: string | null;
  totalSize: string | null;
  retentionDays: number | null;
  history: BackupEntry[];
}

/** DTO no formato do backend (snake_case, padrão dos outros módulos). */
interface BackupOverviewDto {
  last_backup_at: string | null;
  next_backup_at: string | null;
  total_size: string | null;
  retention_days: number | null;
  history: {
    id: string;
    created_at: string;
    type: "auto" | "manual";
    status: BackupEntryStatus;
    size: string | null;
  }[];
}

function toOverview(dto: BackupOverviewDto): BackupOverview {
  return {
    lastBackupAt: dto.last_backup_at,
    nextBackupAt: dto.next_backup_at,
    totalSize: dto.total_size,
    retentionDays: dto.retention_days,
    history: dto.history.map((entry) => ({
      id: entry.id,
      createdAt: entry.created_at,
      type: entry.type,
      status: entry.status,
      size: entry.size,
    })),
  };
}

/** `null` = nenhum backup registrado (ou endpoint ainda não implantado). */
export async function getBackupOverview(): Promise<BackupOverview | null> {
  try {
    const { data } = await api.get<BackupOverviewDto>(BACKUP_PATH);
    return toOverview(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function createBackup(): Promise<void> {
  await api.post(BACKUP_PATH);
}

export async function restoreBackup(id: string): Promise<void> {
  await api.post(`${BACKUP_PATH}/${id}/restore`);
}

export async function deleteBackup(id: string): Promise<void> {
  await api.delete(`${BACKUP_PATH}/${id}`);
}

export async function clearBackupHistory(): Promise<void> {
  await api.delete(`${BACKUP_PATH}/history`);
}

/** Restaura TODAS as configurações do sistema aos padrões de fábrica. */
export async function resetAllSettings(): Promise<void> {
  await api.post("/settings/reset");
}
