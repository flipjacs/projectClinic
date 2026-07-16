import { Plus, Search, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionTitle } from "@/components/layout/section-title";
import { Button } from "@/components/ui/button";
import { fieldBase } from "@/components/ui/input";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { cn } from "@/utils/cn";
import { ROLE_META, ROLE_ORDER } from "../constants";
import { useToggleUserActive, useUsersList, userErrorMessage } from "../hooks/use-users";
import type {
  User,
  UserRoleFilter,
  UserSortKey,
  UserStatusFilter,
} from "../types/user";
import { DeactivateDialog } from "../components/deactivate-dialog";
import { UserDialog } from "../components/user-dialog";
import { UserFilters } from "../components/user-filters";
import { UserSummaryCards, type UserCounts } from "../components/user-summary-cards";
import { UsersTable } from "../components/users-table";
import { UsersTableSkeleton } from "../components/users-table-skeleton";

const PAGE_SIZE = 10;

function matchesSearch(user: User, term: string): boolean {
  if (!term) return true;
  const haystack = [user.name, user.email, ROLE_META[user.role].label]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

export function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { data, isLoading, isError, isFetching, refetch } = useUsersList();
  const toggleActive = useToggleUserActive();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("all");
  const [sortKey, setSortKey] = useState<UserSortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  // Diálogos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);

  const users = useMemo(() => data ?? [], [data]);

  const counts = useMemo<UserCounts>(
    () => ({
      total: users.length,
      admins: users.filter((u) => u.role === ROLES.ADMIN).length,
      dentists: users.filter((u) => u.role === ROLES.DENTIST).length,
      receptionists: users.filter((u) => u.role === ROLES.RECEPTIONIST).length,
      inactive: users.filter((u) => !u.is_active).length,
    }),
    [users],
  );

  const activeAdminCount = useMemo(
    () => users.filter((u) => u.role === ROLES.ADMIN && u.is_active).length,
    [users],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = users.filter((u) => {
      if (!matchesSearch(u, term)) return false;
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name, "pt-BR");
      else if (sortKey === "role")
        cmp = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
      else cmp = a.created_at.localeCompare(b.created_at);
      // Desempate estável por nome.
      if (cmp === 0) cmp = a.name.localeCompare(b.name, "pt-BR");
      return cmp * dir;
    });
  }, [users, search, roleFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  // Sempre que o recorte muda, volta para a primeira página.
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, sortKey, sortDir]);

  // Se a página atual ficar vazia após uma ação (ex.: filtro), recua.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function handleSort(key: UserSortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function applyCardFilter(role: UserRoleFilter, status: UserStatusFilter) {
    setRoleFilter(role);
    setStatusFilter(status);
    setSearch("");
  }

  function openCreate() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  async function handleActivate(user: User) {
    try {
      await toggleActive.mutateAsync({ id: user.id, active: true });
      toast.success(`${user.name} reativado com sucesso.`);
    } catch (error) {
      toast.error(userErrorMessage(error));
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    try {
      await toggleActive.mutateAsync({ id: deactivateTarget.id, active: false });
      toast.success(`${deactivateTarget.name} foi inativado.`);
      setDeactivateTarget(null);
    } catch (error) {
      toast.error(userErrorMessage(error));
    }
  }

  const hasFilters = search.trim() !== "" || roleFilter !== "all" || statusFilter !== "all";

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie administradores, dentistas e recepcionistas."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo usuário
          </Button>
        }
      />

      <div className="mb-6">
        <UserSummaryCards
          counts={counts}
          isLoading={isLoading}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSelect={applyCardFilter}
        />
      </div>

      <SectionTitle>Todos os usuários</SectionTitle>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou cargo…"
            aria-label="Buscar usuário"
            className={cn(fieldBase, "h-10 border-line pl-9 pr-9 hover:border-graphite-200")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-fade-in rounded-md p-1 text-ink-mute transition-colors hover:bg-graphite-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <UserFilters
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onRoleChange={setRoleFilter}
          onStatusChange={setStatusFilter}
        />
      </div>

      {isLoading ? (
        <UsersTableSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={hasFilters ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
          description={
            hasFilters
              ? "Ajuste a busca ou os filtros para ver outros resultados."
              : "Cadastre o primeiro membro da equipe para começar."
          }
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => applyCardFilter("all", "all")}
              >
                Limpar filtros
              </Button>
            ) : (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Novo usuário
              </Button>
            )
          }
        />
      ) : (
        <>
          <UsersTable
            users={pageItems}
            currentUserId={currentUser?.id}
            activeAdminCount={activeAdminCount}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onOpen={(u) => navigate(`/users/${u.id}`)}
            onEdit={openEdit}
            onDeactivate={setDeactivateTarget}
            onActivate={handleActivate}
          />

          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {filtered.length} usuário(s){isFetching ? " · atualizando…" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="px-1">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        user={editingUser}
        currentUserId={currentUser?.id}
        activeAdminCount={activeAdminCount}
      />

      <DeactivateDialog
        open={Boolean(deactivateTarget)}
        user={deactivateTarget}
        isLoading={toggleActive.isPending}
        onConfirm={confirmDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </>
  );
}
