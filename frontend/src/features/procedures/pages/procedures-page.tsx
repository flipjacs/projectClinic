import { Plus } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { ProcedureForm } from "../components/procedure-form";
import { ProceduresTable } from "../components/procedures-table";
import {
  useCreateProcedure,
  useProcedures,
  useSetProcedureActive,
  useUpdateProcedure,
} from "../hooks/use-procedures";
import type { ProcedureFormValues } from "../schemas/procedure-schema";
import type { Procedure } from "../types/procedure";

const PAGE_SIZE = 20;

export function ProceduresPage() {
  const { user } = useAuth();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [creating, setCreating] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Procedure | null>(null);

  const debouncedSearch = useDebounce(search.trim(), 350);
  const query = useProcedures({
    search: debouncedSearch,
    includeInactive,
    page,
    pageSize: PAGE_SIZE,
  });
  const createMutation = useCreateProcedure();
  const updateMutation = useUpdateProcedure(editing?.id ?? 0);
  const toggleMutation = useSetProcedureActive();

  async function create(values: ProcedureFormValues) {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description || null,
        base_price: values.base_price,
        estimated_duration_minutes: values.estimated_duration_minutes || null,
      });
      toast.success("Procedimento cadastrado.");
      setCreating(false);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function update(values: ProcedureFormValues) {
    if (!editing) return;
    try {
      await updateMutation.mutateAsync({
        name: values.name,
        description: values.description || null,
        base_price: values.base_price,
        estimated_duration_minutes: values.estimated_duration_minutes || null,
      });
      toast.success("Procedimento atualizado.");
      setEditing(null);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function toggleActive() {
    if (!toggleTarget) return;
    try {
      await toggleMutation.mutateAsync({
        id: toggleTarget.id,
        active: !toggleTarget.is_active,
      });
      toast.success(toggleTarget.is_active ? "Procedimento inativado." : "Procedimento ativado.");
      setToggleTarget(null);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  const totalPages = query.data?.meta.total_pages ?? 0;

  return (
    <>
      <PageHeader
        title="Procedimentos"
        description="Catálogo clínico usado em orçamentos e atendimentos."
        actions={
          canManage && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Novo procedimento
            </Button>
          )
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
        <Input
          label="Buscar"
          placeholder="Buscar procedimento"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <label className="flex items-end gap-2 pb-2 text-sm text-ink-mute">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => {
              setIncludeInactive(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-line text-gold-500 focus-visible:ring-gold-400"
          />
          Incluir inativos
        </label>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.items.length === 0 ? (
        <EmptyState
          title="Nenhum procedimento encontrado"
          description="Cadastre procedimentos para montar orçamentos com rapidez."
          action={
            canManage && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Novo procedimento
              </Button>
            )
          }
        />
      ) : (
        <>
          <ProceduresTable
            procedures={query.data.items}
            canManage={canManage}
            onEdit={setEditing}
            onToggleActive={setToggleTarget}
          />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2 text-sm text-ink-mute">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span>{page} / {totalPages}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Novo procedimento" size="lg">
        <ProcedureForm
          onSubmit={create}
          onCancel={() => setCreating(false)}
          isSubmitting={createMutation.isPending}
        />
      </Modal>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Editar procedimento"
        size="lg"
      >
        {editing && (
          <ProcedureForm
            defaultValues={{
              name: editing.name,
              description: editing.description ?? "",
              base_price: String(editing.base_price ?? "0.00"),
              estimated_duration_minutes: editing.estimated_duration_minutes,
            }}
            onSubmit={update}
            onCancel={() => setEditing(null)}
            isSubmitting={updateMutation.isPending}
            submitLabel="Salvar alterações"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleTarget?.is_active ? "Inativar procedimento" : "Ativar procedimento"}
        message={
          toggleTarget?.is_active
            ? "Procedimentos inativos deixam de aparecer por padrão na montagem de novos orçamentos."
            : "O procedimento voltará a aparecer na montagem de novos orçamentos."
        }
        confirmLabel={toggleTarget?.is_active ? "Inativar" : "Ativar"}
        tone={toggleTarget?.is_active ? "danger" : "primary"}
        isLoading={toggleMutation.isPending}
        onConfirm={toggleActive}
        onClose={() => setToggleTarget(null)}
      />
    </>
  );
}
