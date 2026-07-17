import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/stores/toast-store";
import type { SecuritySettingsFormValues } from "../schemas/security-schema";
import {
  getSecurityAudit,
  getSecuritySettings,
  requestDataExport,
  requestDataRemoval,
  terminateSessions,
  updateSecuritySettings,
} from "../services/settings-security-api";
import { notifySettingsActionError, notifySettingsSaveError } from "./settings-feedback";

export const securitySettingsKeys = {
  all: ["settings", "security"] as const,
  audit: ["settings", "security", "audit"] as const,
};

/** Configurações de segurança salvas; `null` = usa os padrões do schema. */
export function useSecuritySettings() {
  return useQuery({
    queryKey: securitySettingsKeys.all,
    queryFn: getSecuritySettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useUpdateSecuritySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: SecuritySettingsFormValues) => updateSecuritySettings(values),
    onSuccess: (saved) => {
      qc.setQueryData(securitySettingsKeys.all, saved);
      toast.success("Configurações de segurança salvas.");
    },
    onError: notifySettingsSaveError,
  });
}

/** Resumo de auditoria; `null` = backend ainda sem o recurso (sem erro). */
export function useSecurityAudit() {
  return useQuery({
    queryKey: securitySettingsKeys.audit,
    queryFn: getSecurityAudit,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Encerramento de sessões — sempre atrás de confirmação explícita na UI. */
export function useTerminateSessions() {
  return useMutation({
    mutationFn: (scope: "others" | "all") => terminateSessions(scope),
    onSuccess: (_, scope) => {
      toast.success(
        scope === "others"
          ? "As outras sessões foram encerradas."
          : "Todas as sessões foram encerradas.",
      );
    },
    onError: notifySettingsActionError,
  });
}

/** Ações de privacidade (LGPD): exportação e solicitação de remoção. */
export function usePrivacyActions() {
  const exportData = useMutation({
    mutationFn: requestDataExport,
    onSuccess: () =>
      toast.success("Exportação solicitada. Você receberá os dados por e-mail."),
    onError: notifySettingsActionError,
  });
  const requestRemoval = useMutation({
    mutationFn: requestDataRemoval,
    onSuccess: () =>
      toast.success("Solicitação registrada. A equipe entrará em contato."),
    onError: notifySettingsActionError,
  });
  return { exportData, requestRemoval };
}
