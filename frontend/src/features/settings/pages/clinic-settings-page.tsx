import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  useClinicSettings,
  useUpdateClinicSettings,
} from "../hooks/use-clinic-settings";

/** Esqueleto com a forma real da página — sem salto visual ao carregar. */
function ClinicFormSkeleton() {
  return (
    <div className="max-w-3xl space-y-6" aria-busy="true" aria-label="Carregando configurações">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <Skeleton className="h-4 w-44" />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
        <ClinicFormSkeleton />
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
