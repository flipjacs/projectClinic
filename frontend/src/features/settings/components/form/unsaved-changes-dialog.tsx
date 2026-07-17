import { useFormContext, useFormState } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useUnsavedChangesGuard } from "../../hooks/use-unsaved-changes-guard";
import { useSettingsFormActions } from "./settings-form-provider";

/**
 * Diálogo exibido ao tentar sair da página com alterações pendentes.
 * Três saídas, todas explícitas: salvar e sair, descartar e sair, ou ficar.
 */
export function UnsavedChangesDialog() {
  const { control, reset } = useFormContext();
  const { isDirty, isSubmitting } = useFormState({ control });
  const { submitForm } = useSettingsFormActions();
  const blocker = useUnsavedChangesGuard(isDirty);

  if (blocker.state !== "blocked") return null;

  function stay() {
    blocker.reset?.();
  }

  function discardAndLeave() {
    reset();
    blocker.proceed?.();
  }

  async function saveAndLeave() {
    const ok = await submitForm();
    if (ok) blocker.proceed?.();
    // Validação ou persistência falhou: permanece na página; o formulário já
    // destacou os campos ou o toast já explicou o motivo.
    else blocker.reset?.();
  }

  return (
    <Modal
      open
      onClose={stay}
      title="Alterações não salvas"
      footer={
        <>
          <Button variant="ghost" onClick={stay} disabled={isSubmitting}>
            Continuar editando
          </Button>
          <Button variant="secondary" onClick={discardAndLeave} disabled={isSubmitting}>
            Descartar e sair
          </Button>
          <Button onClick={() => void saveAndLeave()} isLoading={isSubmitting}>
            Salvar e sair
          </Button>
        </>
      }
    >
      Você fez alterações que ainda não foram salvas. Se sair agora sem salvar,
      elas serão perdidas.
    </Modal>
  );
}
