import { SlidersHorizontal } from "lucide-react";

import type { AppearanceSettingsFormValues } from "../../schemas/appearance-schema";
import { FeatureCard } from "../feature-card";
import { FormSwitchRow } from "../form";

/** Preferências de comportamento da interface para este usuário. */
export function PreferencesCard() {
  return (
    <FeatureCard
      icon={SlidersHorizontal}
      title="Preferências"
      description="Comportamentos da interface neste dispositivo."
      flush
    >
      <FormSwitchRow<AppearanceSettingsFormValues>
        name="preferences.reducedMotion"
        label="Animações reduzidas"
        description="Minimiza transições e movimentos na interface."
      />
      <FormSwitchRow<AppearanceSettingsFormValues>
        name="preferences.highContrast"
        label="Alto contraste"
        description="Aumenta o contraste de textos e bordas."
      />
      <FormSwitchRow<AppearanceSettingsFormValues>
        name="preferences.confirmCriticalActions"
        label="Confirmar ações críticas"
        description="Pede confirmação extra antes de operações importantes."
      />
      <FormSwitchRow<AppearanceSettingsFormValues>
        name="preferences.autoSaveFilters"
        label="Salvar filtros automaticamente"
        description="Reaplica os últimos filtros usados em listas e relatórios."
      />
      <FormSwitchRow<AppearanceSettingsFormValues>
        name="preferences.reopenLastPage"
        label="Abrir última página utilizada"
        description="Ao entrar, retorna para onde você parou."
      />
    </FeatureCard>
  );
}
