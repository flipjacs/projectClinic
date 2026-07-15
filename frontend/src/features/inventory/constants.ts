/**
 * Rótulos e ordenações do módulo de Estoque. Listas declaradas como constantes
 * fora de componentes (custo zero de render) e tipadas pelos enums do contrato.
 */
import type {
  InventoryCategory,
  MovementType,
  UnitOfMeasure,
} from "./types/inventory";

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  disposable: "Descartáveis",
  medication: "Medicamentos",
  anesthetic: "Anestésicos",
  cleaning: "Limpeza",
  instrument: "Instrumentais",
  restorative_material: "Materiais restauradores",
  protective_equipment: "EPIs",
  other: "Outros",
};

/** Ordem de exibição das categorias (filtros e formulários). */
export const CATEGORY_ORDER: InventoryCategory[] = [
  "disposable",
  "medication",
  "anesthetic",
  "cleaning",
  "instrument",
  "restorative_material",
  "protective_equipment",
  "other",
];

/** Rótulo completo da unidade (formulário). */
export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  unit: "Unidade",
  box: "Caixa",
  package: "Pacote",
  ml: "Mililitro (ml)",
  l: "Litro (L)",
  mg: "Miligrama (mg)",
  g: "Grama (g)",
  kg: "Quilograma (kg)",
  pair: "Par",
  roll: "Rolo",
  other: "Outra",
};

/** Abreviação da unidade (ao lado da quantidade em tabelas/cards). */
export const UNIT_SHORT_LABELS: Record<UnitOfMeasure, string> = {
  unit: "un",
  box: "cx",
  package: "pct",
  ml: "ml",
  l: "L",
  mg: "mg",
  g: "g",
  kg: "kg",
  pair: "par",
  roll: "rolo",
  other: "un",
};

export const UNIT_ORDER: UnitOfMeasure[] = [
  "unit",
  "box",
  "package",
  "ml",
  "l",
  "mg",
  "g",
  "kg",
  "pair",
  "roll",
  "other",
];

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: "Entrada",
  out: "Saída",
  adjustment: "Ajuste",
};

/** Janela padrão (dias) para "próximo do vencimento". */
export const EXPIRING_WINDOW_DAYS = 30;

/** Tamanho de página padrão das listas do estoque. */
export const INVENTORY_PAGE_SIZE = 20;
