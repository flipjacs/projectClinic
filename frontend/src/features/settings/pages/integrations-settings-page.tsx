import { ErrorState } from "@/components/feedback/error-state";
import { SettingsPageShell } from "../components";
import {
  ApiIntegrationCard,
  EmailCard,
  GoogleCalendarCard,
  WhatsAppCard,
} from "../components/integrations";
import { SettingsFormSkeleton } from "../components/settings-form-skeleton";
import { useIntegrations } from "../hooks/use-integrations";

/**
 * Configurações → Integrações. Cada serviço externo em um card independente,
 * com estado de conexão real e ações preparadas para o backend futuro.
 */
export function IntegrationsSettingsPage() {
  const query = useIntegrations();

  return (
    <SettingsPageShell categoryKey="integrations">
      {query.isLoading ? (
        <SettingsFormSkeleton cards={3} />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar as integrações"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="max-w-3xl space-y-6">
          <GoogleCalendarCard data={query.data?.googleCalendar ?? null} />
          <EmailCard data={query.data?.email ?? null} />
          <WhatsAppCard />
          <ApiIntegrationCard data={query.data?.api ?? null} />
        </div>
      )}
    </SettingsPageShell>
  );
}
