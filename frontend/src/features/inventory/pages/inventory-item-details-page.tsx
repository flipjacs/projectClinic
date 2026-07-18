import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Boxes,
  CalendarClock,
  Pencil,
  Power,
  TrendingDown,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";
import { formatDateOnly, formatDateTime } from "@/utils/format";
import { formatMoney } from "@/utils/currency";
import { CATEGORY_LABELS, UNIT_SHORT_LABELS } from "../constants";
import { InventoryMovementTimeline } from "../components/inventory-movement-timeline";
import { InventoryStatusBadge } from "../components/inventory-status-badge";
import { ItemDialog } from "../components/item-dialog";
import { MovementDialog } from "../components/movement-dialog";
import {
  useInventoryItem,
  useInventoryPermissions,
  useItemMovements,
  useSetItemActive,
} from "../hooks/use-inventory";
import {
  deriveExpiration,
  deriveStockStatus,
  formatQuantity,
} from "../utils/inventory-status";
import { expirationPhrase } from "../components/expiration-badge";
import { inventoryErrorMessage } from "../utils/inventory-error";

function InfoTile({
  label,
  value,
  hint,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 text-ink-mute">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn("mt-2 text-lg font-semibold tracking-tight text-ink", valueClassName)}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

export function InventoryItemDetailsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const itemId = Number(params.itemId);

  const { canWriteItems, canMove, canToggleActive } = useInventoryPermissions();
  const { data: item, isLoading, isError, refetch } = useInventoryItem(
    Number.isFinite(itemId) ? itemId : null,
  );
  const [page, setPage] = useState(1);
  const movementsQuery = useItemMovements(Number.isFinite(itemId) ? itemId : null, page);

  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const setActive = useSetItemActive(itemId);

  async function toggleActive(active: boolean) {
    try {
      await setActive.mutateAsync(active);
      toast.success(active ? "Item reativado." : "Item desativado.");
      setConfirmDeactivate(false);
    } catch (error) {
      toast.error(inventoryErrorMessage(error));
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <>
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/inventory/items")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <ErrorState
          title="Não foi possível carregar o item"
          onRetry={() => refetch()}
        />
      </>
    );
  }

  const unit = UNIT_SHORT_LABELS[item.unit_of_measure];
  const stock = deriveStockStatus(item);
  const expiration = deriveExpiration(item);
  const movements = movementsQuery.data?.items ?? [];
  const lastIn = movements.find((m) => m.movement_type === "in");
  const lastOut = movements.find((m) => m.movement_type === "out");
  const totalPages = movementsQuery.data?.meta.total_pages ?? 0;

  const saldoTone =
    stock.status === "zero"
      ? "text-red-700"
      : stock.status === "low"
        ? "text-amber-700"
        : "text-ink";

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Estoque", to: "/inventory" },
          { label: "Itens", to: "/inventory/items" },
          { label: item.name },
        ]}
      />

      {/* Cabeçalho */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{item.name}</h1>
            <InventoryStatusBadge item={item} />
          </div>
          <p className="mt-1 text-sm text-ink-mute">
            {CATEGORY_LABELS[item.category]}
            {item.unit_price ? ` · ${formatMoney(item.unit_price)} / ${unit}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canMove && (
            <Button variant="secondary" onClick={() => setMoveOpen(true)}>
              <ArrowLeftRight className="h-4 w-4" />
              Movimentar
            </Button>
          )}
          {canWriteItems && (
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          )}
          {canToggleActive &&
            (item.is_active ? (
              <Button variant="ghost" onClick={() => setConfirmDeactivate(true)}>
                <Power className="h-4 w-4" />
                Desativar
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => toggleActive(true)}>
                <Power className="h-4 w-4" />
                Reativar
              </Button>
            ))}
        </div>
      </div>

      {/* Cards de informação */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoTile
          label="Saldo atual"
          icon={Boxes}
          value={`${formatQuantity(item.current_quantity)} ${unit}`}
          hint={stock.label}
          valueClassName={saldoTone}
        />
        <InfoTile
          label="Estoque mínimo"
          icon={TrendingDown}
          value={`${formatQuantity(item.minimum_quantity)} ${unit}`}
        />
        <InfoTile
          label="Fornecedor"
          icon={Truck}
          value={item.supplier || "—"}
        />
        <InfoTile
          label="Última entrada"
          icon={ArrowDownLeft}
          value={lastIn ? formatDateTime(lastIn.created_at) : "—"}
          hint={lastIn ? `+${formatQuantity(lastIn.quantity)} ${unit}` : undefined}
        />
        <InfoTile
          label="Última saída"
          icon={ArrowUpRight}
          value={lastOut ? formatDateTime(lastOut.created_at) : "—"}
          hint={lastOut ? `−${formatQuantity(lastOut.quantity)} ${unit}` : undefined}
        />
        <InfoTile
          label="Próxima validade"
          icon={CalendarClock}
          value={item.expiration_date ? formatDateOnly(item.expiration_date) : "—"}
          hint={
            item.expiration_date && expiration.days !== null
              ? expirationPhrase(expiration.days)
              : undefined
          }
          valueClassName={
            expiration.status === "expired"
              ? "text-red-700"
              : expiration.status === "expiring"
                ? "text-orange-700"
                : undefined
          }
        />
      </div>

      {item.notes && (
        <Card className="mb-8">
          <CardBody>
            <h2 className="text-sm font-semibold text-ink">Observações</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-soft">{item.notes}</p>
          </CardBody>
        </Card>
      )}

      {/* Histórico */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-mute">
        Histórico de movimentações
      </h2>
      <Card>
        <CardBody>
          {movementsQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : movementsQuery.isError ? (
            <ErrorState
              title="Não foi possível carregar o histórico"
              onRetry={() => movementsQuery.refetch()}
            />
          ) : movements.length === 0 ? (
            <EmptyState
              title="Sem movimentações"
              description="Este item ainda não teve entradas, saídas ou ajustes."
            />
          ) : (
            <>
              <InventoryMovementTimeline movements={movements} unit={unit} />
              {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-end gap-2 text-sm text-ink-mute">
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
            </>
          )}
        </CardBody>
      </Card>

      <ItemDialog open={editOpen} item={item} onClose={() => setEditOpen(false)} />
      <MovementDialog open={moveOpen} presetItem={item} onClose={() => setMoveOpen(false)} />
      <ConfirmDialog
        open={confirmDeactivate}
        title="Desativar item"
        message="O item deixará de aparecer nas listas ativas e não poderá receber movimentações. Você pode reativá-lo depois."
        confirmLabel="Desativar"
        tone="danger"
        isLoading={setActive.isPending}
        onConfirm={() => toggleActive(false)}
        onClose={() => setConfirmDeactivate(false)}
      />
    </>
  );
}
