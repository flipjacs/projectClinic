import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import {
  createItem,
  getInventorySummary,
  getItem,
  listExpiring,
  listItemMovements,
  listItems,
  listLowStock,
  listMovements,
  registerAdjustment,
  registerMovement,
  setItemActive,
  type ListItemsParams,
  type ListMovementsParams,
} from "../api/inventory-api";
import type {
  AdjustmentCreateInput,
  InventoryItemCreateInput,
  InventoryItemUpdateInput,
  MovementCreateInput,
} from "../types/inventory";
import { updateItem } from "../api/inventory-api";

export const inventoryKeys = {
  all: ["inventory"] as const,
  summary: ["inventory", "summary"] as const,
  items: (params: ListItemsParams) => ["inventory", "items", params] as const,
  item: (id: number) => ["inventory", "item", id] as const,
  itemMovements: (id: number, page: number) =>
    ["inventory", "item", id, "movements", page] as const,
  movements: (params: ListMovementsParams) =>
    ["inventory", "movements", params] as const,
  lowStock: (params: { page?: number; pageSize?: number }) =>
    ["inventory", "low-stock", params] as const,
  expiring: (params: { days?: number; page?: number; pageSize?: number }) =>
    ["inventory", "expiring", params] as const,
};

/** Invalida todo o domínio de estoque — qualquer escrita afeta saldo/alertas/resumo. */
function invalidateInventory(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: inventoryKeys.all });
}

// ===== Permissões (espelham o RBAC do backend; UI é só conveniência) =====

/**
 * Escrita de itens e movimentações de entrada/saída: ADMIN e RECEPCIONISTA.
 * Ajuste de saldo e (des)ativação: apenas ADMIN. Leitura: todo o staff.
 */
export function useInventoryPermissions() {
  const { user } = useAuth();
  const role = user?.role;
  const isAdmin = role === ROLES.ADMIN;
  const canWriteItems = isAdmin || role === ROLES.RECEPTIONIST;
  return {
    canWriteItems,
    canMove: canWriteItems,
    canAdjust: isAdmin,
    canToggleActive: isAdmin,
  };
}

// ===== Queries =====

export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryKeys.summary,
    queryFn: getInventorySummary,
    staleTime: 60_000,
  });
}

export function useInventoryItems(params: ListItemsParams) {
  return useQuery({
    queryKey: inventoryKeys.items(params),
    queryFn: () => listItems(params),
    placeholderData: keepPreviousData,
  });
}

export function useInventoryItem(id: number | null) {
  return useQuery({
    queryKey: inventoryKeys.item(id ?? 0),
    queryFn: () => getItem(id as number),
    enabled: id != null,
  });
}

export function useItemMovements(id: number | null, page: number) {
  return useQuery({
    queryKey: inventoryKeys.itemMovements(id ?? 0, page),
    queryFn: () => listItemMovements(id as number, { page }),
    enabled: id != null,
    placeholderData: keepPreviousData,
  });
}

export function useInventoryMovements(params: ListMovementsParams) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => listMovements(params),
    placeholderData: keepPreviousData,
  });
}

export function useLowStock(params: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(params),
    queryFn: () => listLowStock(params),
    placeholderData: keepPreviousData,
  });
}

export function useExpiring(
  params: { days?: number; page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: inventoryKeys.expiring(params),
    queryFn: () => listExpiring(params),
    placeholderData: keepPreviousData,
  });
}

// ===== Mutations =====

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryItemCreateInput) => createItem(payload),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useUpdateItem(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryItemUpdateInput) => updateItem(id, payload),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useSetItemActive(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => setItemActive(id, active),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useRegisterMovement(itemId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { direction: "in" | "out"; payload: MovementCreateInput }) =>
      registerMovement(itemId, input.direction, input.payload),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useRegisterAdjustment(itemId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdjustmentCreateInput) => registerAdjustment(itemId, payload),
    onSuccess: () => invalidateInventory(qc),
  });
}
