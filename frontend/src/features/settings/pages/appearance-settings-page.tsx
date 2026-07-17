import { ErrorState } from "@/components/feedback/error-state";
import {
  appearanceSettingsSchema,
  defaultAppearanceSettings,
} from "../schemas/appearance-schema";
import { SettingsPageShell } from "../components";
import {
  DensitySelector,
  LanguageSelector,
  PreferencesCard,
  ThemeSelector,
} from "../components/appearance";
import { SettingsFormSkeleton } from "../components/settings-form-skeleton";
import {
  SettingsFormProvider,
  UnsavedChangesBanner,
  UnsavedChangesDialog,
} from "../components/form";
import { useAppearance, useUpdateAppearance } from "../hooks/use-appearance";

/**
 * Configurações → Aparência. Tema, densidade e idioma como seletores visuais
 * com preview; preferências de comportamento como switches — mesmo padrão de
 * dirty tracking das demais páginas.
 */
export function AppearanceSettingsPage() {
  const query = useAppearance();
  const mutation = useUpdateAppearance();

  return (
    <SettingsPageShell categoryKey="appearance">
      {query.isLoading ? (
        <SettingsFormSkeleton cards={3} />
      ) : query.isError ? (
        <ErrorState
          title="Não foi possível carregar as preferências de aparência"
          onRetry={() => void query.refetch()}
        />
      ) : (
        <div className="max-w-3xl">
          <SettingsFormProvider
            schema={appearanceSettingsSchema}
            defaultValues={query.data ?? defaultAppearanceSettings()}
            onSave={(values) => mutation.mutateAsync(values)}
          >
            <ThemeSelector />
            <DensitySelector />
            <LanguageSelector />
            <PreferencesCard />
            <UnsavedChangesBanner />
            <UnsavedChangesDialog />
          </SettingsFormProvider>
        </div>
      )}
    </SettingsPageShell>
  );
}
