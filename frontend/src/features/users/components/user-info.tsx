import type { ReactNode } from "react";

import { formatDateTime } from "@/utils/format";
import type { User } from "../types/user";
import { RoleBadge } from "./role-badge";
import { StatusBadge } from "./status-badge";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-mute">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

/** Informações básicas do usuário em lista de definição. */
export function UserInfo({ user }: { user: User }) {
  return (
    <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label="Cargo">
        <RoleBadge role={user.role} />
      </Field>
      <Field label="Status">
        <StatusBadge active={user.is_active} />
      </Field>
      <Field label="E-mail">
        <span className="break-all">{user.email}</span>
      </Field>
      <Field label="Identificador">#{user.id}</Field>
      <Field label="Criado em">{formatDateTime(user.created_at)}</Field>
      <Field label="Última alteração">{formatDateTime(user.updated_at)}</Field>
      <Field label="Último acesso">
        <span className="text-ink-mute">Não registrado</span>
      </Field>
    </dl>
  );
}
