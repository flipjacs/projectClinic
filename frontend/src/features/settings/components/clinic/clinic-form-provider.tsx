import type { ReactNode } from "react";

import {
  clinicSettingsSchema,
  defaultClinicSettings,
  type ClinicSettingsFormValues,
} from "../../schemas/clinic-schema";
import { SettingsFormProvider, useSettingsFormActions } from "../form";

interface ClinicFormProviderProps {
  /** Valores vindos do servidor; `null` = nunca salvos (usa os padrões). */
  initialValues: ClinicSettingsFormValues | null;
  /**
   * Persiste e retorna os valores salvos (fonte para o reset do formulário).
   * Deve rejeitar em caso de falha — o formulário permanece "sujo".
   */
  onSave: (values: ClinicSettingsFormValues) => Promise<ClinicSettingsFormValues>;
  children: ReactNode;
}

/**
 * Formulário da Clínica sobre a fundação genérica de Configurações
 * (SettingsFormProvider): schema + padrões próprios, mesmo comportamento de
 * dirty tracking, banner e guarda de navegação das demais páginas.
 */
export function ClinicFormProvider({
  initialValues,
  onSave,
  children,
}: ClinicFormProviderProps) {
  return (
    <SettingsFormProvider
      schema={clinicSettingsSchema}
      defaultValues={initialValues ?? defaultClinicSettings()}
      onSave={onSave}
    >
      {children}
    </SettingsFormProvider>
  );
}

/** Alias histórico da Fase 2 — mesma ação, nome específico da Clínica. */
export const useClinicFormActions = useSettingsFormActions;
