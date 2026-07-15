import { api } from "@/lib/api";
import type { Paginated } from "@/types/api";
import type {
  AdjustmentCreateInput,
  ExpiringItem,
  InventoryCategory,
  InventoryItem,
  InventoryItemCreateInput,
  InventoryItemUpdateInput,
  InventoryMovement,
  InventorySummary,
  MovementCreateInput,
  MovementType,
} from "../types/inventory";

// ============================================================================
// Items
// ============================================================================

export interface ListItemsParams {
  search?: string;
  category?: InventoryCategory;
  includeInactive?: boolean;
  onlyInactive?: boolean;
  lowStock?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listItems(
  params: ListItemsParams = {},
): Promise<Paginated<InventoryItem>> {
  const { data } = await api.get<Paginated<InventoryItem>>("/inventory/items", {
    params: {
      search: params.search || undefined,
      category: params.category || undefined,
      include_inactive: params.includeInactive || undefined,
      only_inactive: params.onlyInactive || undefined,
      low_stock: params.lowStock || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

export async function getItem(id: number): Promise<InventoryItem> {
  const { data } = await api.get<InventoryItem>(`/inventory/items/${id}`);
  return data;
}

export async function createItem(
  payload: InventoryItemCreateInput,
): Promise<InventoryItem> {
  const { data } = await api.post<InventoryItem>("/inventory/items", payload);
  return data;
}

export async function updateItem(
  id: number,
  payload: InventoryItemUpdateInput,
): Promise<InventoryItem> {
  const { data } = await api.patch<InventoryItem>(`/inventory/items/${id}`, payload);
  return data;
}

export async function setItemActive(
  id: number,
  active: boolean,
): Promise<InventoryItem> {
  const action = active ? "activate" : "deactivate";
  const { data } = await api.patch<InventoryItem>(`/inventory/items/${id}/${action}`);
  return data;
}

// ============================================================================
// Movements
// ============================================================================

export async function registerMovement(
  itemId: number,
  direction: "in" | "out",
  payload: MovementCreateInput,
): Promise<InventoryMovement> {
  const { data } = await api.post<InventoryMovement>(
    `/inventory/items/${itemId}/movements/${direction}`,
    payload,
  );
  return data;
}

export async function registerAdjustment(
  itemId: number,
  payload: AdjustmentCreateInput,
): Promise<InventoryMovement> {
  const { data } = await api.post<InventoryMovement>(
    `/inventory/items/${itemId}/movements/adjustment`,
    payload,
  );
  return data;
}

export async function listItemMovements(
  itemId: number,
  params: { page?: number; pageSize?: number } = {},
): Promise<Paginated<InventoryMovement>> {
  const { data } = await api.get<Paginated<InventoryMovement>>(
    `/inventory/items/${itemId}/movements`,
    { params: { page: params.page ?? 1, page_size: params.pageSize ?? 20 } },
  );
  return data;
}

export interface ListMovementsParams {
  itemId?: number;
  type?: MovementType;
  userId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export async function listMovements(
  params: ListMovementsParams = {},
): Promise<Paginated<InventoryMovement>> {
  const { data } = await api.get<Paginated<InventoryMovement>>("/inventory/movements", {
    params: {
      item_id: params.itemId || undefined,
      type: params.type || undefined,
      user_id: params.userId || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

// ============================================================================
// Alerts / Summary
// ============================================================================

export async function listLowStock(
  params: { page?: number; pageSize?: number } = {},
): Promise<Paginated<InventoryItem>> {
  const { data } = await api.get<Paginated<InventoryItem>>("/inventory/alerts/low-stock", {
    params: { page: params.page ?? 1, page_size: params.pageSize ?? 20 },
  });
  return data;
}

export async function listExpiring(
  params: { days?: number; page?: number; pageSize?: number } = {},
): Promise<Paginated<ExpiringItem>> {
  const { data } = await api.get<Paginated<ExpiringItem>>("/inventory/alerts/expiring", {
    params: {
      days: params.days ?? 30,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 20,
    },
  });
  return data;
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const { data } = await api.get<InventorySummary>("/inventory/summary");
  return data;
}
