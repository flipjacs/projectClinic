import { CalendarClock, RefreshCw } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/utils/format";
import { useGoogleCalendarActions } from "../../hooks/use-integrations";
import type { IntegrationsOverview } from "../../services/settings-integrations-api";
import { FeatureCard } from "../feature-card";
import { FeatureUnavailable } from "../feature-unavailable";
import { SettingsItem } from "../settings-item";
import { IntegrationStatus } from "./integration-status";

type GoogleCalendarState = IntegrationsOverview["googleCalendar"] | null;

/** Sincronização da agenda da clínica com o Google Agenda. */
export function GoogleCalendarCard({ data }: { data: GoogleCalendarState }) {
  const { connect, disconnect, syncNow } = useGoogleCalendarActions();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const connected = data?.status === "connected";

  return (
    <FeatureCard
      icon={CalendarClock}
      title="Google Agenda"
      description="Espelha as consultas da clínica no calendário do Google."
      badge={<IntegrationStatus status={data?.status ?? "disconnected"} />}
      actions={
        connected ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => syncNow.mutate()}
              isLoading={syncNow.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Sincronizar agora
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger-600 hover:bg-danger-50 active:bg-danger-100"
              onClick={() => setConfirmDisconnect(true)}
            >
              Desconectar
            </Button>
          </>
        ) : (
          <Button size="sm" onClick={() => connect.mutate()} isLoading={connect.isPending}>
            {data?.status === "error" ? "Reconectar conta" : "Conectar conta"}
          </Button>
        )
      }
      flush
    >
      <SettingsItem
        label="Conta conectada"
        control={
          <span className="text-sm text-ink-soft">{data?.account ?? "Nenhuma conta"}</span>
        }
      />
      <SettingsItem
        label="Última sincronização"
        control={
          <span className="text-sm tabular-nums text-ink-soft">
            {formatDateTime(data?.lastSyncAt)}
          </span>
        }
      />
      <SettingsItem
        label="Próxima sincronização"
        control={
          <span className="text-sm tabular-nums text-ink-soft">
            {formatDateTime(data?.nextSyncAt)}
          </span>
        }
      />
      {!connected && (
        <div className="px-5 py-4">
          <FeatureUnavailable description="A conexão por conta Google (OAuth) chega junto com o suporte do servidor. A interface e o contrato já estão prontos." />
        </div>
      )}

      <ConfirmDialog
        open={confirmDisconnect}
        tone="danger"
        title="Desconectar o Google Agenda?"
        message="As consultas deixarão de ser espelhadas no calendário do Google. Nenhum dado da clínica é apagado."
        confirmLabel="Desconectar"
        isLoading={disconnect.isPending}
        onConfirm={() =>
          disconnect.mutate(undefined, { onSettled: () => setConfirmDisconnect(false) })
        }
        onClose={() => setConfirmDisconnect(false)}
      />
    </FeatureCard>
  );
}
