import { ErrorState } from "@/components/feedback/error-state";
import {
  defaultNotificationSettings,
  notificationSettingsSchema,
} from "../schemas/notifications-schema";
import { SettingsPageShell } from "../components";
import { SettingsFormSkeleton } from "../components/settings-form-skeleton";
import {
  SettingsFormProvider,
  UnsavedChangesBanner,
  UnsavedChangesDialog,
} from "../components/form";
import {
  NOTIFICATION_GROUPS,
  NotificationChannelsCard,
  NotificationGroupCard,
} from "../components/notifications";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "../hooks/use-notification-settings";

/**
 * Configurações → Notificações. Preferências agrupadas por área (config
 * declarativa), pré-visualização da mensagem e canais com disponibilidade
 * explícita — mesmo padrão de dirty tracking das demais páginas.
 */
export function NotificationsSettingsPage() {
  const query = useNotificationSettings();
  const mutation = useUpdateNotificationSettings();

  return (
    <SettingsPageShell categoryKey="notifications">
      {query.isLoading ? (
        <SettingsFormSkeleton cards={4} />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar as preferências de notificação"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="max-w-3xl">
          <SettingsFormProvider
            schema={notificationSettingsSchema}
            defaultValues={query.data ?? defaultNotificationSettings()}
            onSave={(values) => mutation.mutateAsync(values)}
          >
            {NOTIFICATION_GROUPS.map((group) => (
              <NotificationGroupCard key={group.key} group={group} />
            ))}
            <NotificationChannelsCard />
            <UnsavedChangesBanner />
            <UnsavedChangesDialog />
          </SettingsFormProvider>
        </div>
      )}
    </SettingsPageShell>
  );
}
