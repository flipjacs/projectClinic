/**
 * Tipos do módulo de Estoque — espelham exatamente o contrato do backend
 * (`/inventory/*`). Quantidades e preços chegam como `Decimal` serializado em
 * string; nunca convertemos para número na borda de rede (evita perda de
 * precisão), apenas na formatação.
 */

export type InventoryCategory =
  | "disposable"
  | "medication"
  | "anesthetic"
  | "cleaning"
  | "instrument"
  | "restorative_material"
  | "protective_equipment"
  | "other";

export type UnitOfMeasure =
  | "unit"
  | "box"
  | "package"
  | "ml"
  | "l"
  | "mg"
  | "g"
  | "kg"
  | "pair"
  | "roll"
  | "other";

export type MovementType = "in" | "out" | "adjustment";

/** Item de estoque (GET /inventory/items/{id}). */
export interface InventoryItem {
  id: number;
  name: string;
  category: InventoryCategory;
  unit_of_measure: UnitOfMeasure;
  current_quantity: string;
  minimum_quantity: string;
  supplier: string | null;
  unit_price: string | null;
  expiration_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Item próximo do vencimento (GET /inventory/alerts/expiring). */
export interface ExpiringItem extends InventoryItem {
  days_until_expiration: number;
}

/** Autor de uma movimentação (snapshot enxuto). */
export interface MovementAuthor {
  id: number;
  name: string;
}

/** Movimentação de estoque (entrada/saída/ajuste). */
export interface InventoryMovement {
  id: number;
  inventory_item_id: number;
  movement_type: MovementType;
  quantity: string;
  resulting_quantity: string;
  reason: string | null;
  created_by_user_id: number;
  created_at: string;
  created_by: MovementAuthor;
}

/** Resumo do estoque (GET /inventory/summary). */
export interface InventorySummary {
  total_active_items: number;
  total_inactive_items: number;
  low_stock_items_count: number;
  expiring_items_count: number;
  total_movements_current_month: number;
}

/** Payload de criação de item (POST /inventory/items). */
export interface InventoryItemCreateInput {
  name: string;
  category: InventoryCategory;
  unit_of_measure: UnitOfMeasure;
  current_quantity: string;
  minimum_quantity: string;
  supplier: string | null;
  unit_price: string | null;
  expiration_date: string | null;
  notes: string | null;
}

/**
 * Payload de atualização (PATCH /inventory/items/{id}). `current_quantity` NÃO
 * é editável aqui — o saldo muda apenas por movimentações.
 */
export interface InventoryItemUpdateInput {
  name: string;
  category: InventoryCategory;
  unit_of_measure: UnitOfMeasure;
  minimum_quantity: string;
  supplier: string | null;
  unit_price: string | null;
  expiration_date: string | null;
  notes: string | null;
}

/** Body de entrada/saída (POST /inventory/items/{id}/movements/in|out). */
export interface MovementCreateInput {
  quantity: string;
  reason: string | null;
}

/**
 * Body de ajuste (POST /inventory/items/{id}/movements/adjustment).
 * `quantity` é o SALDO FINAL desejado (não um delta); motivo é obrigatório.
 */
export interface AdjustmentCreateInput {
  quantity: string;
  reason: string;
}
