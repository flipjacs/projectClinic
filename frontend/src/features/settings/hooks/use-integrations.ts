import { useMutation, useQuery } from "@tanstack/react-query";

import { toast } from "@/stores/toast-store";
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getIntegrations,
  sendTestEmail,
  syncGoogleCalendarNow,
} from "../services/settings-integrations-api";
import { notifySettingsActionError } from "./settings-feedback";

export const integrationsKeys = {
  all: ["settings", "integrations"] as const,
};

/** Estado das integrações; `null` = nada configurado (cards desconectados). */
export function useIntegrations() {
  return useQuery({
    queryKey: integrationsKeys.all,
    queryFn: getIntegrations,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Ações do Google Agenda — conexão gerida pelo backend (OAuth futuro). */
export function useGoogleCalendarActions() {
  const connect = useMutation({
    mutationFn: connectGoogleCalendar,
    onSuccess: () => toast.success("Conexão iniciada. Siga as instruções do Google."),
    onError: notifySettingsActionError,
  });
  const disconnect = useMutation({
    mutationFn: disconnectGoogleCalendar,
    onSuccess: () => toast.success("Google Agenda desconectado."),
    onError: notifySettingsActionError,
  });
  const syncNow = useMutation({
    mutationFn: syncGoogleCalendarNow,
    onSuccess: () => toast.success("Sincronização iniciada."),
    onError: notifySettingsActionError,
  });
  return { connect, disconnect, syncNow };
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: sendTestEmail,
    onSuccess: () => toast.success("E-mail de teste enviado. Verifique sua caixa de entrada."),
    onError: notifySettingsActionError,
  });
}
