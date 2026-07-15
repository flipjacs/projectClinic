import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import {
  InventoryFilters,
  type InventoryFiltersValue,
} from "../components/inventory-filters";
import { InventoryTable } from "../components/inventory-table";
import { ItemDialog } from "../components/item-dialog";
import { MovementDialog } from "../components/movement-dialog";
import { INVENTORY_PAGE_SIZE } from "../constants";
import { useInventoryItems, useInventoryPermissions } from "../hooks/use-inventory";
import type { InventoryItem } from "../types/inventory";

const INITIAL_FILTERS: InventoryFiltersValue = { search: "", category: "", status: "" };

export function InventoryItemsPage() {
  const navigate = useNavigate();
  const { canWriteItems, canMove } = useInventoryPermissions();

  const [filters, setFilters] = useState<InventoryFiltersValue>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  });
  const [moveItem, setMoveItem] = useState<InventoryItem | null>(null);

  const debouncedSearch = useDebounce(filters.search.trim(), 300);

  function updateFilters(next: Partial<InventoryFiltersValue>) {
    setFilters((f) => ({ ...f, ...next }));
    setPage(1);
  }

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      category: filters.category || undefined,
      lowStock: filters.status === "low" || undefined,
      onlyInactive: filters.status === "inactive" || undefined,
      page,
      pageSize: INVENTORY_PAGE_SIZE,
    }),
    [debouncedSearch, filters.category, filters.status, page],
  );

  const { data, isLoading, isError, isFetching, refetch } = useInventoryItems(params);
  const totalPages = data?.meta.total_pages ?? 0;

  return (
    <>
      <PageHeader
        title="Itens do estoque"
        description="Todos os materiais cadastrados, com busca e filtros."
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate("/inventory")}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            {canWriteItems && (
              <Button onClick={() => setItemDialog({ open: true, item: null })}>
                <Plus className="h-4 w-4" />
                Novo item
              </Button>
            )}
          </>
        }
      />

      <InventoryFilters value={filters} onChange={updateFilters} />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar os itens"
          onRetry={() => refetch()}
        />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhum item encontrado"
          description="Ajuste a busca e os filtros ou cadastre um novo material."
        />
      ) : (
        <>
          <InventoryTable
            items={data.items}
            onOpen={(item) => navigate(`/inventory/items/${item.id}`)}
            onEdit={canWriteItems ? (item) => setItemDialog({ open: true, item }) : undefined}
            onMove={canMove ? (item) => setMoveItem(item) : undefined}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {data.meta.total} item(ns){isFetching ? " · atualizando…" : ""}
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

      <ItemDialog
        open={itemDialog.open}
        item={itemDialog.item}
        onClose={() => setItemDialog({ open: false, item: null })}
      />
      <MovementDialog
        open={Boolean(moveItem)}
        presetItem={moveItem}
        onClose={() => setMoveItem(null)}
      />
    </>
  );
}
