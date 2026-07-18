import { ErrorState } from "@/components/feedback/error-state";
import { DEFAULT_APPEARANCE, useAppearanceStore } from "@/stores/appearance-store";
import { appearanceSettingsSchema } from "../schemas/appearance-schema";
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
 * Configurações → Aparência. Fonte de verdade: BACKEND (GET/PUT
 * /settings/appearance, por usuário). Ao salvar, persiste no servidor e aplica
 * ao documento via appearance-store (que também mantém o cache anti-flicker no
 * localStorage). A UI e o dirty-tracking são exatamente os das demais páginas.
 */
export function AppearanceSettingsPage() {
  const query = useAppearance();
  const mutation = useUpdateAppearance();
  const applyToDocument = useAppearanceStore((s) => s.setAll);

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
            defaultValues={query.data ?? DEFAULT_APPEARANCE}
            onSave={async (values) => {
              const saved = await mutation.mutateAsync(values);
              applyToDocument(saved); // aplica tema/densidade imediatamente
              return saved;
            }}
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
