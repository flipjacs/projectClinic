import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { fieldBase } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { cn } from "@/utils/cn";
import { moneyToNumber, toMoneyPayload } from "@/utils/currency";
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

  const [searchInput, setSearchInput] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Procedure | null>(null);
  const [creating, setCreating] = useState(false);

  const search = useDebounce(searchInput.trim(), 400);
  const params = useMemo(
    () => ({ search, includeInactive, page, pageSize: PAGE_SIZE }),
    [search, includeInactive, page],
  );

  const { data, isLoading, isError, isFetching, refetch } = useProcedures(params);
  const createMutation = useCreateProcedure();
  const updateMutation = useUpdateProcedure(editing?.id ?? 0);
  const toggleActive = useSetProcedureActive();

  const totalPages = data?.meta.total_pages ?? 0;

  function toInput(values: ProcedureFormValues) {
    return {
      name: values.name,
      description: values.description || null,
      base_price: toMoneyPayload(values.base_price),
      estimated_duration_minutes: values.estimated_duration_minutes ?? null,
    };
  }

  async function handleCreate(values: ProcedureFormValues) {
    try {
      await createMutation.mutateAsync(toInput(values));
      toast.success("Procedimento cadastrado.");
      setCreating(false);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function handleUpdate(values: ProcedureFormValues) {
    try {
      await updateMutation.mutateAsync(toInput(values));
      toast.success("Procedimento atualizado.");
      setEditing(null);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function handleToggle(procedure: Procedure) {
    try {
      await toggleActive.mutateAsync({ id: procedure.id, active: !procedure.is_active });
      toast.success(procedure.is_active ? "Procedimento inativado." : "Procedimento ativado.");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Procedimentos"
        description="Catálogo de procedimentos e valores de referência da clínica."
        actions={
          canManage ? (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Novo procedimento
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar procedimento…"
            className={cn(fieldBase, "h-10 border-line pl-9 pr-3")}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-mute">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => {
              setIncludeInactive(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-line text-gold-500 focus-visible:ring-gold-400"
          />
          Incluir inativos
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhum procedimento encontrado"
          description={
            canManage
              ? "Cadastre o primeiro procedimento para montar orçamentos."
              : "Ainda não há procedimentos cadastrados."
          }
        />
      ) : (
        <>
          <ProceduresTable
            procedures={data.items}
            canManage={canManage}
            onEdit={setEditing}
            onToggleActive={handleToggle}
            togglingId={toggleActive.isPending ? toggleActive.variables?.id : undefined}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {data.meta.total} procedimento(s){isFetching ? " · atualizando…" : ""}
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
                  {page} / {Math.max(totalPages, 1)}
                </span>
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
          </div>
        </>
      )}

      {creating && (
        <Modal open onClose={() => setCreating(false)} title="Novo procedimento">
          <ProcedureForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            isSubmitting={createMutation.isPending}
            submitLabel="Cadastrar"
          />
        </Modal>
      )}

      {editing && (
        <Modal open onClose={() => setEditing(null)} title="Editar procedimento">
          <ProcedureForm
            defaultValues={{
              name: editing.name,
              description: editing.description ?? "",
              base_price: toMoneyPayload(moneyToNumber(editing.base_price)),
              estimated_duration_minutes: editing.estimated_duration_minutes,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
            isSubmitting={updateMutation.isPending}
            submitLabel="Salvar alterações"
          />
        </Modal>
      )}
    </>
  );
}
