import { Activity, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { SystemStatus } from "../../services/settings-system-api";
import { FeatureCard } from "../feature-card";
import { FeatureUnavailable } from "../feature-unavailable";

type ServiceRowState = "up" | "down" | "unknown" | "prepared";

interface ServiceRow {
  key: string;
  name: string;
  state: ServiceRowState;
  latency?: string;
}

const STATE_META: Record<ServiceRowState, { label: string; dot: string; text: string }> = {
  up: { label: "Operacional", dot: "bg-success-600", text: "text-success-700" },
  down: { label: "Indisponível", dot: "bg-danger-600", text: "text-danger-700" },
  unknown: { label: "Sem informação", dot: "bg-graphite-300", text: "text-ink-mute" },
  prepared: { label: "Monitoramento em breve", dot: "bg-gold-500", text: "text-gold-700" },
};

function buildRows(status: SystemStatus | undefined): ServiceRow[] {
  return [
    {
      key: "api",
      name: "API",
      state: status ? status.api.state : "unknown",
      latency: status?.api.latencyMs != null ? `${status.api.latencyMs} ms` : undefined,
    },
    {
      key: "database",
      name: "Banco de dados",
      state: status?.database.state ?? "unknown",
    },
    { key: "queue", name: "Fila de tarefas", state: "prepared" },
    { key: "cache", name: "Cache", state: "prepared" },
    { key: "storage", name: "Armazenamento de arquivos", state: "prepared" },
  ];
}

/**
 * Saúde dos serviços em tempo quase real: API e banco vêm dos endpoints
 * /health e /ready do backend (latência medida no cliente, revalidação a
 * cada 30s); os demais serviços aparecem com o monitoramento preparado.
 */
export function HealthStatusCard({
  status,
  isLoading,
  isFetching,
  onRefresh,
}: {
  status: SystemStatus | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const rows = buildRows(status);
  const allCoreUp = status?.api.state === "up" && status?.database.state === "up";

  return (
    <FeatureCard
      icon={Activity}
      title="Saúde do sistema"
      description="Estado dos serviços essenciais, verificado a cada 30 segundos."
      badge={
        isLoading ? undefined : allCoreUp ? (
          <Badge tone="success">Tudo operacional</Badge>
        ) : (
          <Badge tone="danger">Verificar serviços</Badge>
        )
      }
      actions={
        <Button variant="secondary" size="sm" onClick={onRefresh} isLoading={isFetching}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Verificar agora
        </Button>
      }
      flush
    >
      {rows.map((row) => {
        const meta = STATE_META[row.state];
        return (
          <div
            key={row.key}
            className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm font-medium text-ink">{row.name}</p>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="flex items-center gap-3 text-xs tabular-nums text-ink-mute">
                {row.latency && <span>{row.latency}</span>}
                <span className={cn("inline-flex items-center gap-1.5 font-medium", meta.text)}>
                  <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>
              </span>
            )}
          </div>
        );
      })}
      <div className="px-5 py-4">
        <p className="text-xs text-ink-mute" role="status">
          Última verificação: {status ? formatDateTime(status.checkedAt) : "—"}
        </p>
        <div className="mt-3">
          <FeatureUnavailable description="Fila, cache e armazenamento entram no monitoramento quando esses serviços forem implantados no servidor." />
        </div>
      </div>
    </FeatureCard>
  );
}
