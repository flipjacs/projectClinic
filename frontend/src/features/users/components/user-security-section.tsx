import { KeyRound, LogOut, ShieldAlert, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import type { User } from "../types/user";
import { ResetPasswordDialog } from "./reset-password-dialog";

function SecurityRow({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action: ReactNode;
  tone?: "default" | "muted";
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            tone === "muted"
              ? "bg-graphite-100 text-graphite-400"
              : "bg-graphite-100 text-graphite-600",
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className={cn("text-sm font-medium", tone === "muted" ? "text-ink-mute" : "text-ink")}>
            {title}
          </p>
          <p className="mt-0.5 text-xs text-ink-mute">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:pl-4">{action}</div>
    </div>
  );
}

/**
 * Ações de segurança do usuário. "Redefinir senha" é real (PATCH de usuário).
 * "Encerrar sessões" depende de revogação de token no servidor, que ainda não
 * existe (o acesso é via JWT stateless) — fica preparada e desabilitada, com o
 * motivo explícito, em vez de simular uma ação que não teria efeito.
 */
export function UserSecuritySection({ user }: { user: User }) {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <div>
        <SecurityRow
          icon={KeyRound}
          title="Redefinir senha"
          description="Defina uma nova senha de acesso para este usuário."
          action={
            <Button variant="secondary" size="sm" onClick={() => setResetOpen(true)}>
              Redefinir
            </Button>
          }
        />
        <SecurityRow
          icon={LogOut}
          title="Encerrar sessões ativas"
          description="Forçar logout exige revogação de token no servidor — recurso ainda não disponível na API."
          tone="muted"
          action={
            <Button variant="secondary" size="sm" disabled>
              Indisponível
            </Button>
          }
        />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-canvas/60 px-3 py-2 text-xs text-ink-mute">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Por segurança, senhas são armazenadas apenas como hash no servidor e nunca são
        exibidas — nem aqui, nem em qualquer tela.
      </div>

      <ResetPasswordDialog open={resetOpen} onClose={() => setResetOpen(false)} user={user} />
    </>
  );
}
