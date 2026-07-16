import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { User } from "../types/user";
import { RoleBadge } from "./role-badge";
import { UserAvatar } from "./user-avatar";

interface DeactivateDialogProps {
  open: boolean;
  user: User | null;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmação de inativação. Nunca exclui — apenas revoga o acesso. O impacto é
 * mostrado com clareza para evitar ações acidentais; a conta e o histórico
 * permanecem, e o acesso pode ser restaurado depois.
 */
export function DeactivateDialog({
  open,
  user,
  isLoading,
  onConfirm,
  onClose,
}: DeactivateDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Inativar usuário"
      description="Revogar o acesso deste usuário ao sistema."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading} type="button">
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            Inativar acesso
          </Button>
        </>
      }
    >
      {user && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/50 p-3">
            <UserAvatar name={user.name} role={user.role} />
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-mute">{user.email}</p>
            </div>
            <span className="ml-auto shrink-0">
              <RoleBadge role={user.role} />
            </span>
          </div>

          <div className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" aria-hidden />
            <div className="space-y-1 text-sm text-danger-700">
              <p className="font-medium">O usuário perderá acesso ao sistema imediatamente.</p>
              <p className="text-danger-700/90">
                A conta e todo o histórico são preservados. Você pode reativar o acesso
                quando quiser.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
