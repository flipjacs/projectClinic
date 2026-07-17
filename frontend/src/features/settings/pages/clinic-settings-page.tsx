import { ErrorState } from "@/components/feedback/error-state";
import {
  ClinicAddressCard,
  ClinicBrandingCard,
  ClinicFormProvider,
  ClinicGeneralCard,
  ClinicNotesCard,
  ClinicScheduleCard,
  UnsavedChangesBanner,
  UnsavedChangesDialog,
} from "../components/clinic";
import { SettingsPageShell } from "../components";
import { SettingsFormSkeleton } from "../components/settings-form-skeleton";
import {
  useClinicSettings,
  useUpdateClinicSettings,
} from "../hooks/use-clinic-settings";

/**
 * Configurações → Clínica. Formulário completo dividido em cards, com
 * rastreio de alterações, guarda de navegação e persistência via React Query.
 */
export function ClinicSettingsPage() {
  const query = useClinicSettings();
  const mutation = useUpdateClinicSettings();

  return (
    <SettingsPageShell categoryKey="clinic">
      {query.isLoading ? (
        <SettingsFormSkeleton cards={3} />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar as configurações"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="max-w-3xl">
          <ClinicFormProvider
            initialValues={query.data ?? null}
            onSave={(values) => mutation.mutateAsync(values)}
          >
            <ClinicGeneralCard />
            <ClinicAddressCard />
            <ClinicScheduleCard />
            <ClinicBrandingCard />
            <ClinicNotesCard />
            <UnsavedChangesBanner />
            <UnsavedChangesDialog />
          </ClinicFormProvider>
        </div>
      )}
    </SettingsPageShell>
  );
}
