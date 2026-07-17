import { useFormContext, useFormState } from "react-hook-form";

import { Button } from "@/components/ui/button";

/**
 * Ações dos formulários de Configurações: Salvar (desabilitado enquanto nada
 * mudou) e Descartar (volta aos últimos valores salvos). Vive dentro do
 * <form> do SettingsFormProvider — o submit é o submit real do formulário.
 */
export function SaveActionsBar() {
  const { control, reset } = useFormContext();
  const { isDirty, isSubmitting } = useFormState({ control });

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={() => reset()}
        disabled={!isDirty || isSubmitting}
      >
        Descartar
      </Button>
      <Button type="submit" disabled={!isDirty} isLoading={isSubmitting}>
        Salvar alterações
      </Button>
    </div>
  );
}
