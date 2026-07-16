import { Ban, Pencil, Power, PowerOff } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { Tooltip } from "@/components/ui/tooltip";
import { ROLES } from "@/types/roles";
import { cn } from "@/utils/cn";
import type { User } from "../types/user";

interface UserRowActionsProps {
  user: User;
  currentUserId: number | undefined;
  /** Nº de admins ativos na base — usado para bloquear a inativação do último. */
  activeAdminCount: number;
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onActivate: (user: User) => void;
  className?: string;
}

/**
 * Ações de linha: editar e ativar/inativar. As regras do backend são
 * antecipadas na UI (autoridade continua sendo o servidor): não é possível
 * inativar o próprio usuário nem o último ADMIN ativo — nesses casos a ação
 * aparece desabilitada com o motivo no tooltip, evitando um clique que só
 * resultaria em erro.
 */
export function UserRowActions({
  user,
  currentUserId,
  activeAdminCount,
  onEdit,
  onDeactivate,
  onActivate,
  className,
}: UserRowActionsProps) {
  const isSelf = currentUserId != null && user.id === currentUserId;
  const isLastActiveAdmin =
    user.is_active && user.role === ROLES.ADMIN && activeAdminCount <= 1;

  const blockReason = isSelf
    ? "Você não pode inativar o próprio usuário"
    : isLastActiveAdmin
      ? "Não é possível inativar o último administrador ativo"
      : null;

  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>
      <IconButton
        label="Editar usuário"
        icon={Pencil}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(user);
        }}
      />

      {user.is_active ? (
        blockReason ? (
          <Tooltip label={blockReason}>
            <span
              tabIndex={0}
              role="img"
              aria-label={blockReason}
              className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-graphite-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <Ban className="h-4 w-4" aria-hidden />
            </span>
          </Tooltip>
        ) : (
          <IconButton
            label="Inativar usuário"
            icon={PowerOff}
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate(user);
            }}
          />
        )
      ) : (
        <IconButton
          label="Ativar usuário"
          icon={Power}
          onClick={(e) => {
            e.stopPropagation();
            onActivate(user);
          }}
          className="text-success-600 hover:bg-success-50 hover:text-success-700"
        />
      )}
    </div>
  );
}
