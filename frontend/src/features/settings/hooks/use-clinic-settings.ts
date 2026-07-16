import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

import { apiErrorDetail, toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import type { ClinicSettingsFormValues } from "../schemas/clinic-schema";
import {
  getClinicSettings,
  updateClinicSettings,
  uploadClinicLogo,
} from "../services/settings-api";

export const clinicSettingsKeys = {
  all: ["settings", "clinic"] as const,
};

/**
 * Configurações salvas da clínica. `data === null` significa "nada salvo
 * ainda" — a tela abre com os padrões do schema, sem estado de erro.
 */
export function useClinicSettings() {
  return useQuery({
    queryKey: clinicSettingsKeys.all,
    queryFn: getClinicSettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * Salva o formulário completo: primeiro sobe os logos recém-escolhidos
 * (arquivos locais), depois persiste os dados. A UI só chama `mutate` com os
 * valores do formulário — toda a orquestração vive aqui.
 */
export function useUpdateClinicSettings() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (values: ClinicSettingsFormValues) => {
      const branding = { ...values.branding };
      if (branding.logo?.kind === "local") {
        const { url } = await uploadClinicLogo(branding.logo.file, "logo");
        branding.logo = { kind: "remote", url };
      }
      if (branding.logoSmall?.kind === "local") {
        const { url } = await uploadClinicLogo(branding.logoSmall.file, "logo_small");
        branding.logoSmall = { kind: "remote", url };
      }
      return updateClinicSettings({ ...values, branding });
    },
    onSuccess: (saved) => {
      qc.setQueryData(clinicSettingsKeys.all, saved);
      toast.success("Configurações da clínica salvas.");
    },
    onError: (error) => {
      // Endpoint ainda não implantado no backend: mensagem honesta, sem
      // parecer falha do usuário. Os dados permanecem intactos na tela.
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        toast.error(
          "O servidor ainda não oferece o salvamento destas configurações. Suas alterações permanecem nesta tela.",
        );
        return;
      }
      toast.error(apiErrorDetail(error) ?? toApiError(error).message);
    },
  });
}
