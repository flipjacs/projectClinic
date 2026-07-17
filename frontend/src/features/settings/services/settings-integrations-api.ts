import axios from "axios";

import { api } from "@/lib/api";

/**
 * Client HTTP das Integrações.
 *
 * O backend AINDA NÃO expõe estes endpoints — contrato definido aqui para a
 * UI operar desacoplada. GET 404 = "nada configurado" (cards mostram o estado
 * desconectado real); ações falham com mensagem honesta até o backend chegar.
 */

const INTEGRATIONS_PATH = "/settings/integrations";

export type IntegrationConnection = "connected" | "disconnected" | "error";

export interface IntegrationsOverview {
  googleCalendar: {
    status: IntegrationConnection;
    account: string | null;
    lastSyncAt: string | null;
    nextSyncAt: string | null;
  };
  email: {
    status: IntegrationConnection;
    /** Host de envio já mascarado pelo backend (nunca credenciais). */
    server: string | null;
    lastSentAt: string | null;
    lastErrorAt: string | null;
  };
  api: {
    hasKey: boolean;
    /** Chave SEMPRE mascarada pelo backend (ex.: "odp_••••••••3f2a"). */
    maskedKey: string | null;
    webhookUrl: string | null;
  };
}

/** DTO no formato do backend (snake_case, padrão dos outros módulos). */
interface IntegrationsOverviewDto {
  google_calendar: {
    status: IntegrationConnection;
    account: string | null;
    last_sync_at: string | null;
    next_sync_at: string | null;
  };
  email: {
    status: IntegrationConnection;
    server: string | null;
    last_sent_at: string | null;
    last_error_at: string | null;
  };
  api: {
    has_key: boolean;
    masked_key: string | null;
    webhook_url: string | null;
  };
}

function toOverview(dto: IntegrationsOverviewDto): IntegrationsOverview {
  return {
    googleCalendar: {
      status: dto.google_calendar.status,
      account: dto.google_calendar.account,
      lastSyncAt: dto.google_calendar.last_sync_at,
      nextSyncAt: dto.google_calendar.next_sync_at,
    },
    email: {
      status: dto.email.status,
      server: dto.email.server,
      lastSentAt: dto.email.last_sent_at,
      lastErrorAt: dto.email.last_error_at,
    },
    api: {
      hasKey: dto.api.has_key,
      maskedKey: dto.api.masked_key,
      webhookUrl: dto.api.webhook_url,
    },
  };
}

/** `null` = nada configurado ainda (ou endpoint ainda não implantado). */
export async function getIntegrations(): Promise<IntegrationsOverview | null> {
  try {
    const { data } = await api.get<IntegrationsOverviewDto>(INTEGRATIONS_PATH);
    return toOverview(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

/** Inicia o fluxo OAuth do Google Agenda (redirect gerido pelo backend). */
export async function connectGoogleCalendar(): Promise<void> {
  await api.post(`${INTEGRATIONS_PATH}/google-calendar/connect`);
}

export async function disconnectGoogleCalendar(): Promise<void> {
  await api.delete(`${INTEGRATIONS_PATH}/google-calendar`);
}

export async function syncGoogleCalendarNow(): Promise<void> {
  await api.post(`${INTEGRATIONS_PATH}/google-calendar/sync`);
}

/** Dispara um e-mail de teste para o endereço do usuário logado. */
export async function sendTestEmail(): Promise<void> {
  await api.post(`${INTEGRATIONS_PATH}/email/test`);
}
