import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/stores/toast-store";
import type { AppearanceSettingsFormValues } from "../schemas/appearance-schema";
import {
  getAppearanceSettings,
  updateAppearanceSettings,
} from "../services/settings-appearance-api";
import { notifySettingsSaveError } from "./settings-feedback";

export const appearanceSettingsKeys = {
  all: ["settings", "appearance"] as const,
};

/** Preferências de aparência salvas; `null` = usa os padrões do schema. */
export function useAppearance() {
  return useQuery({
    queryKey: appearanceSettingsKeys.all,
    queryFn: getAppearanceSettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useUpdateAppearance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: AppearanceSettingsFormValues) =>
      updateAppearanceSettings(values),
    onSuccess: (saved) => {
      qc.setQueryData(appearanceSettingsKeys.all, saved);
      toast.success("Preferências de aparência salvas.");
    },
    onError: notifySettingsSaveError,
  });
}
