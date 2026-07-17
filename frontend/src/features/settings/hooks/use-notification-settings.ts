import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/stores/toast-store";
import type { NotificationSettingsFormValues } from "../schemas/notifications-schema";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../services/settings-notifications-api";
import { notifySettingsSaveError } from "./settings-feedback";

export const notificationSettingsKeys = {
  all: ["settings", "notifications"] as const,
};

/** Preferências de notificação salvas; `null` = usa os padrões do schema. */
export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationSettingsKeys.all,
    queryFn: getNotificationSettings,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: NotificationSettingsFormValues) =>
      updateNotificationSettings(values),
    onSuccess: (saved) => {
      qc.setQueryData(notificationSettingsKeys.all, saved);
      toast.success("Preferências de notificação salvas.");
    },
    onError: notifySettingsSaveError,
  });
}
