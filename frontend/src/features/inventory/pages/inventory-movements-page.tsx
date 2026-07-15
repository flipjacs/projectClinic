import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { INVENTORY_PAGE_SIZE, UNIT_SHORT_LABELS } from "../constants";
import { ItemSelect } from "../components/item-select";
import { MovementDialog } from "../components/movement-dialog";
import { MovementsTable } from "../components/movements-table";
import { useInventoryMovements, useInventoryPermissions } from "../hooks/use-inventory";
import type { InventoryItem, MovementType } from "../types/inventory";

const typeOptions = [
  { value: "", label: "Todos os tipos" },
  { value: "in", label: "Entradas" },
  { value: "out", label: "Saídas" },
  { value: "adjustment", label: "Ajustes" },
];

/** Converte "YYYY-MM-DD" para ISO com timezone; `endExclusive` avança 1 dia. */
function toIso(date: string, endExclusive = false): string | undefined {
  if (!date) return undefined;
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  if (endExclusive) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export function InventoryMovementsPage() {
  const navigate = useNavigate();
  const { canMove } = useInventoryPermissions();

  const [type, setType] = useState<MovementType | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [material, setMaterial] = useState<InventoryItem | null>(null);
  const [page, setPage] = useState(1);
  const [moveOpen, setMoveOpen] = useState(false);

  const params = useMemo(
    () => ({
      type: type || undefined,
      itemId: material?.id,
      from: toIso(from),
      to: toIso(to, true),
      page,
      pageSize: INVENTORY_PAGE_SIZE,
    }),
    [type, material, from, to, page],
  );

  const { data, isLoading, isError, isFetching, refetch } = useInventoryMovements(params);
  const totalPages = data?.meta.total_pages ?? 0;
  const unit = material ? UNIT_SHORT_LABELS[material.unit_of_measure] : undefined;

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <>
      <PageHeader
        title="Movimentações"
        description="Histórico de entradas, saídas e ajustes do estoque."
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate("/inventory")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            {canMove && (
              <Button onClick={() => setMoveOpen(true)}>
                <Plus className="h-4 w-4" />
                Nova movimentação
              </Button>
            )}
          </>
        }
      />

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ItemSelect value={material} onChange={resetPage(setMaterial)} />
          <Select
            label="Tipo"
            options={typeOptions}
            value={type}
            onChange={(e) => resetPage(setType)(e.target.value as MovementType | "")}
          />
          <Input
            label="De"
            type="date"
            value={from}
            onChange={(e) => resetPage(setFrom)(e.target.value)}
          />
          <Input
            label="Até"
            type="date"
            value={to}
            onChange={(e) => resetPage(setTo)(e.target.value)}
          />
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar as movimentações"
          onRetry={() => refetch()}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhuma movimentação encontrada"
          description="Ajuste os filtros ou registre uma nova movimentação."
        />
      ) : (
        <>
          <MovementsTable movements={data.items} unit={unit} />
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {data.meta.total} movimentação(ões){isFetching ? " · atualizando…" : ""}
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

      <MovementDialog
        open={moveOpen}
        presetItem={material}
        onClose={() => setMoveOpen(false)}
      />
    </>
  );
}
