import { zodResolver } from "@hookform/resolvers/zod";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { ROLE_OPTIONS } from "../constants";
import { useCreateUser, useUpdateUser, userErrorMessage } from "../hooks/use-users";
import {
  createUserSchema,
  editUserSchema,
  emptyCreateUserForm,
  type CreateUserFormValues,
} from "../schemas/user-schema";
import type { CreateUserInput, UpdateUserInput, User } from "../types/user";
import { PasswordField } from "./password-field";
import { PasswordStrength } from "./password-strength";
import { RoleBadge } from "./role-badge";

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  /** Presente = edição; ausente = criação. */
  user?: User | null;
  currentUserId: number | undefined;
  activeAdminCount: number;
}

export function UserDialog({
  open,
  onClose,
  user,
  currentUserId,
  activeAdminCount,
}: UserDialogProps) {
  const isEdit = Boolean(user);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(user?.id ?? 0);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Regras protegidas do backend, antecipadas: o cargo não pode ser alterado
  // no próprio usuário nem quando ele é o último ADMIN ativo.
  const isSelf = isEdit && currentUserId != null && user!.id === currentUserId;
  const isLastActiveAdmin =
    isEdit && user!.is_active && user!.role === ROLES.ADMIN && activeAdminCount <= 1;
  const roleLocked = isSelf || isLastActiveAdmin;
  const roleLockReason = isSelf
    ? "Você não pode alterar o próprio cargo."
    : "Este é o último administrador ativo — o cargo não pode ser alterado.";

  const defaultValues = useMemo<CreateUserFormValues>(() => {
    if (!user) return emptyCreateUserForm;
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      confirmPassword: "",
    };
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setFormError(null);
    }
  }, [open, defaultValues, reset]);

  const passwordValue = watch("password");

  async function onSubmit(values: CreateUserFormValues) {
    setFormError(null);
    try {
      if (isEdit && user) {
        const payload: UpdateUserInput = {};
        const name = values.name.trim();
        const email = values.email.trim().toLowerCase();
        if (name !== user.name) payload.name = name;
        if (email !== user.email) payload.email = email;
        if (!roleLocked && values.role !== user.role) payload.role = values.role;
        if (values.password) payload.password = values.password;

        if (Object.keys(payload).length === 0) {
          toast.info("Nenhuma alteração para salvar.");
          onClose();
          return;
        }
        await updateMutation.mutateAsync(payload);
        toast.success("Usuário atualizado com sucesso.");
      } else {
        const payload: CreateUserInput = {
          name: values.name.trim(),
          email: values.email.trim().toLowerCase(),
          role: values.role,
          password: values.password,
        };
        await createMutation.mutateAsync(payload);
        toast.success("Usuário criado com sucesso.");
      }
      onClose();
    } catch (error) {
      setFormError(userErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Editar usuário" : "Novo usuário"}
      description={
        isEdit
          ? "Atualize os dados de acesso. O status é gerido separadamente."
          : "Cadastre um novo membro da equipe da clínica."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="user-form" isLoading={isSaving}>
            {isEdit ? "Salvar alterações" : "Criar usuário"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome completo"
          placeholder="Ex.: Maria Silva"
          autoFocus
          autoComplete="off"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label="E-mail"
          type="email"
          placeholder="nome@clinica.com.br"
          autoComplete="off"
          error={errors.email?.message}
          {...register("email")}
        />

        {roleLocked ? (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink">Cargo</span>
            <div className="flex items-center gap-2">
              <RoleBadge role={user!.role} />
            </div>
            <p className="mt-1.5 flex items-start gap-1.5 text-xs text-ink-mute">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {roleLockReason}
            </p>
          </div>
        ) : (
          <Select
            label="Cargo"
            options={ROLE_OPTIONS}
            error={errors.role?.message}
            {...register("role")}
          />
        )}

        <div className="space-y-1">
          <PasswordField
            label={isEdit ? "Nova senha" : "Senha"}
            autoComplete="new-password"
            placeholder={isEdit ? "Deixe em branco para manter" : "Mínimo de 8 caracteres"}
            hint={isEdit ? "Preencha apenas se quiser redefinir a senha." : undefined}
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrength value={passwordValue} />
        </div>

        <PasswordField
          label={isEdit ? "Confirmar nova senha" : "Confirmar senha"}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {!isEdit && (
          <p className="flex items-start gap-1.5 rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            O usuário é criado com acesso ativo. Você pode inativá-lo a qualquer momento.
          </p>
        )}

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
