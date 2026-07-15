import { ArrowLeftRight, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { SectionTitle } from "@/components/layout/section-title";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryAlerts } from "../components/inventory-alerts";
import { InventoryMovementTimeline } from "../components/inventory-movement-timeline";
import { InventorySummaryCards } from "../components/inventory-summary-cards";
import { ItemDialog } from "../components/item-dialog";
import { MovementDialog } from "../components/movement-dialog";
import { useInventoryMovements, useInventoryPermissions } from "../hooks/use-inventory";
import type { InventoryItem } from "../types/inventory";

export function InventoryPage() {
  const navigate = useNavigate();
  const { canWriteItems, canMove } = useInventoryPermissions();

  const [itemDialog, setItemDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  });
  const [moveDialog, setMoveDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  });

  const recent = useInventoryMovements({ pageSize: 6 });

  const openItem = (item: InventoryItem) => navigate(`/inventory/items/${item.id}`);
  const openMove = (item: InventoryItem) => setMoveDialog({ open: true, item });
  const openEdit = canWriteItems
    ? (item: InventoryItem) => setItemDialog({ open: true, item })
    : undefined;

  return (
    <>
      <PageHeader
        title="Estoque"
        description="Controle completo dos materiais utilizados na clínica."
        actions={
          <>
            {canMove && (
              <Button variant="secondary" onClick={() => setMoveDialog({ open: true, item: null })}>
                <ArrowLeftRight className="h-4 w-4" />
                Movimentar estoque
              </Button>
            )}
            {canWriteItems && (
              <Button onClick={() => setItemDialog({ open: true, item: null })}>
                <Plus className="h-4 w-4" />
                Novo item
              </Button>
            )}
          </>
        }
      />

      <section className="mb-8">
        <SectionTitle>Resumo</SectionTitle>
        <InventorySummaryCards />
      </section>

      <section className="mb-8">
        <SectionTitle
          action={
            <button
              type="button"
              onClick={() => navigate("/inventory/items")}
              className="text-xs font-medium text-gold-700 hover:underline"
            >
              Ver todos os itens
            </button>
          }
        >
          Precisam de atenção
        </SectionTitle>
        <InventoryAlerts
          limit={5}
          onOpen={openItem}
          onMove={canMove ? openMove : undefined}
          onEdit={openEdit}
        />
      </section>

      <section>
        <SectionTitle
          action={
            <button
              type="button"
              onClick={() => navigate("/inventory/movements")}
              className="text-xs font-medium text-gold-700 hover:underline"
            >
              Ver todas
            </button>
          }
        >
          Últimas movimentações
        </SectionTitle>
        <Card>
          <CardBody>
            {recent.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : recent.isError ? (
              <ErrorState
                title="Não foi possível carregar as movimentações"
                onRetry={() => recent.refetch()}
              />
            ) : !recent.data || recent.data.items.length === 0 ? (
              <EmptyState
                title="Nenhuma movimentação registrada"
                description="As entradas, saídas e ajustes aparecerão aqui."
              />
            ) : (
              <InventoryMovementTimeline movements={recent.data.items} showItemLink />
            )}
          </CardBody>
        </Card>
      </section>

      <ItemDialog
        open={itemDialog.open}
        item={itemDialog.item}
        onClose={() => setItemDialog({ open: false, item: null })}
      />
      <MovementDialog
        open={moveDialog.open}
        presetItem={moveDialog.item}
        onClose={() => setMoveDialog({ open: false, item: null })}
      />
    </>
  );
}
