import { zodResolver } from "@hookform/resolvers/zod";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { FormProvider, useForm } from "react-hook-form";

import { toast } from "@/stores/toast-store";
import {
  clinicSettingsSchema,
  defaultClinicSettings,
  type ClinicSettingsFormValues,
} from "../../schemas/clinic-schema";

interface ClinicFormActions {
  /**
   * Valida + persiste + reseta o formulário. Retorna `true` só quando o
   * salvamento concluiu de fato — usado pelo submit do form e pelo diálogo
   * de saída ("Salvar e sair").
   */
  submitForm: () => Promise<boolean>;
}

const ClinicFormActionsContext = createContext<ClinicFormActions | null>(null);

export function useClinicFormActions(): ClinicFormActions {
  const ctx = useContext(ClinicFormActionsContext);
  if (!ctx) {
    throw new Error("useClinicFormActions deve ser usado dentro de <ClinicFormProvider>");
  }
  return ctx;
}

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
 * Contexto do formulário da Clínica (React Hook Form + Zod). Os cards filhos
 * usam `useFormContext` — inputs não controlados, sem re-render do formulário
 * inteiro a cada tecla. Após salvar, o form é resetado com os valores
 * persistidos e o estado "sujo" desaparece.
 */
export function ClinicFormProvider({
  initialValues,
  onSave,
  children,
}: ClinicFormProviderProps) {
  const methods = useForm<ClinicSettingsFormValues>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues: initialValues ?? defaultClinicSettings(),
    mode: "onTouched",
  });

  const submitForm = useCallback(async (): Promise<boolean> => {
    let ok = false;
    try {
      await methods.handleSubmit(
        async (values) => {
          const saved = await onSave(values);
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
      <ClinicFormActionsContext.Provider value={actions}>
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
      </ClinicFormActionsContext.Provider>
    </FormProvider>
  );
}
