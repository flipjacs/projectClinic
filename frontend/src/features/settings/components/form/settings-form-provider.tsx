import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { FormProvider, useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import type { z } from "zod";

import { toast } from "@/stores/toast-store";

interface SettingsFormActions {
  /**
   * Valida + persiste + reseta o formulário. Retorna `true` só quando o
   * salvamento concluiu de fato — usado pelo submit do form e pelo diálogo
   * de saída ("Salvar e sair").
   */
  submitForm: () => Promise<boolean>;
}

const SettingsFormActionsContext = createContext<SettingsFormActions | null>(null);

export function useSettingsFormActions(): SettingsFormActions {
  const ctx = useContext(SettingsFormActionsContext);
  if (!ctx) {
    throw new Error("useSettingsFormActions deve ser usado dentro de <SettingsFormProvider>");
  }
  return ctx;
}

interface SettingsFormProviderProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  /** Valores iniciais completos (servidor ou padrões do schema). */
  defaultValues: DefaultValues<T>;
  /**
   * Persiste e retorna os valores salvos (fonte para o reset do formulário).
   * Deve rejeitar em caso de falha — o formulário permanece "sujo".
   */
  onSave: (values: T) => Promise<T>;
  children: ReactNode;
}

/**
 * Fundação dos formulários de Configurações (React Hook Form + Zod). Os cards
 * filhos usam `useFormContext` — inputs não controlados, sem re-render do
 * formulário inteiro a cada tecla. Após salvar, o form é resetado com os
 * valores persistidos e o estado "sujo" desaparece. Usado pelas páginas
 * Clínica, Segurança e Notificações.
 */
export function SettingsFormProvider<T extends FieldValues>({
  schema,
  defaultValues,
  onSave,
  children,
}: SettingsFormProviderProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onTouched",
  });

  const submitForm = useCallback(async (): Promise<boolean> => {
    let ok = false;
    try {
      await methods.handleSubmit(
        async (values) => {
          const saved = await onSave(values as T);
          methods.reset(saved);
          ok = true;
        },
        () => toast.error("Revise os campos destacados antes de salvar."),
      )();
    } catch {
      // Falha de persistência já comunicada por toast na mutation; o form
      // continua sujo para o usuário tentar de novo sem perder nada.
    }
    return ok;
  }, [methods, onSave]);

  const actions = useMemo(() => ({ submitForm }), [submitForm]);

  return (
    <FormProvider {...methods}>
      <SettingsFormActionsContext.Provider value={actions}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitForm();
          }}
          noValidate
          className="space-y-6"
        >
          {children}
        </form>
      </SettingsFormActionsContext.Provider>
    </FormProvider>
  );
}
