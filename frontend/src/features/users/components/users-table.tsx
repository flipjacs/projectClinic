import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { User, UserSortKey } from "../types/user";
import { RoleBadge } from "./role-badge";
import { StatusBadge } from "./status-badge";
import { UserAvatar } from "./user-avatar";
import { UserRowActions } from "./user-row-actions";

interface UsersTableProps {
  users: User[];
  currentUserId: number | undefined;
  activeAdminCount: number;
  sortKey: UserSortKey;
  sortDir: "asc" | "desc";
  onSort: (key: UserSortKey) => void;
  /** Abre o perfil completo (clique na linha/nome). */
  onOpen: (user: User) => void;
  /** Edição rápida via ícone (sem sair da lista). */
  onEdit: (user: User) => void;
  onDeactivate: (user: User) => void;
  onActivate: (user: User) => void;
}

function SortHeader({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  column: UserSortKey;
  sortKey: UserSortKey;
  sortDir: "asc" | "desc";
  onSort: (key: UserSortKey) => void;
  className?: string;
}) {
  const active = sortKey === column;
  const Icon = !active ? ChevronsUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      className={cn("px-5 py-3", className)}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          // `uppercase` explícito: o Preflight do Tailwind zera text-transform
          // em <button>, então sem isto o rótulo ordenável fugiria do caixa-alta
          // herdado do cabeçalho (ficaria em caixa mista com as demais colunas).
          "-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase tracking-wide transition-colors hover:text-ink",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
          active ? "text-ink" : "text-ink-mute",
        )}
        aria-label={`Ordenar por ${label}`}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", active ? "text-gold-600" : "text-graphite-300")} aria-hidden />
      </button>
    </th>
  );
}

export function UsersTable({
  users,
  currentUserId,
  activeAdminCount,
  sortKey,
  sortDir,
  onSort,
  onOpen,
  onEdit,
  onDeactivate,
  onActivate,
}: UsersTableProps) {
  const actionsFor = (user: User) => (
    <UserRowActions
      user={user}
      currentUserId={currentUserId}
      activeAdminCount={activeAdminCount}
      onEdit={onEdit}
      onDeactivate={onDeactivate}
      onActivate={onActivate}
    />
  );

  return (
    <>
      {/* Mobile: cartões */}
      <div className="space-y-3 sm:hidden">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <UserAvatar name={u.name} role={u.role} inactive={!u.is_active} />
              <button
                type="button"
                onClick={() => onOpen(u)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate font-medium text-ink">{u.name}</span>
                <span className="block truncate text-xs text-ink-mute">{u.email}</span>
              </button>
              <StatusBadge active={u.is_active} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
              <RoleBadge role={u.role} />
              {actionsFor(u)}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted">
              <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide">
                <SortHeader label="Usuário" column="name" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <SortHeader label="Cargo" column="role" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th scope="col" className="px-5 py-3 text-ink-mute">E-mail</th>
                <th scope="col" className="px-5 py-3 text-ink-mute">Status</th>
                <SortHeader label="Criado em" column="created_at" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
                <th scope="col" className="px-5 py-3 text-right text-ink-mute">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => onOpen(u)}
                  className="group cursor-pointer transition-colors hover:bg-canvas/60"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={u.name} role={u.role} size="sm" inactive={!u.is_active} />
                      <span className="font-medium text-ink group-hover:text-gold-700">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{u.email}</td>
                  <td className="px-5 py-3">
                    <StatusBadge active={u.is_active} />
                  </td>
                  <td className="px-5 py-3 text-ink-mute">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                    {actionsFor(u)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
