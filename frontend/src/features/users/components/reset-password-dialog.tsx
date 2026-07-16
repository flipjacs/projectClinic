import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/stores/toast-store";
import { useUpdateUser, userErrorMessage } from "../hooks/use-users";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas/user-schema";
import type { User } from "../types/user";
import { PasswordField } from "./password-field";
import { PasswordStrength } from "./password-strength";

interface ResetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  user: User;
}

/**
 * Redefinição de senha pelo administrador — usa o PATCH de usuário enviando
 * apenas o novo `password`. A senha vive só no formulário; nunca é registrada.
 */
export function ResetPasswordDialog({ open, onClose, user }: ResetPasswordDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const updateMutation = useUpdateUser(user.id);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ password: "", confirmPassword: "" });
      setFormError(null);
    }
  }, [open, reset]);

  async function onSubmit(values: ResetPasswordFormValues) {
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ password: values.password });
      toast.success("Senha redefinida com sucesso.");
      onClose();
    } catch (error) {
      setFormError(userErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Redefinir senha"
      description={`Defina uma nova senha de acesso para ${user.name}.`}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={updateMutation.isPending}
            type="button"
          >
            Cancelar
          </Button>
          <Button type="submit" form="reset-password-form" isLoading={updateMutation.isPending}>
            <KeyRound className="h-4 w-4" />
            Redefinir senha
          </Button>
        </>
      }
    >
      <form
        id="reset-password-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <div className="space-y-1">
          <PasswordField
            label="Nova senha"
            autoComplete="new-password"
            placeholder="Mínimo de 8 caracteres"
            autoFocus
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrength value={watch("password")} />
        </div>

        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <p className="text-xs text-ink-mute">
          O usuário passará a acessar o sistema com a nova senha imediatamente.
        </p>

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
