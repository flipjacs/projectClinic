export interface InventoryItemFixture {
  id: number;
  name: string;
  current_quantity: number;
  min_quantity: number;
  unit: string;
}

export function makeInventoryItem(input: Partial<InventoryItemFixture> = {}): InventoryItemFixture {
  return {
    id: input.id ?? 1,
    name: input.name ?? "Item de estoque teste",
    current_quantity: input.current_quantity ?? 10,
    min_quantity: input.min_quantity ?? 2,
    unit: input.unit ?? "un",
  };
}
