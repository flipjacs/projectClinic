import { z } from "zod";

import { CATEGORY_ORDER, UNIT_ORDER } from "../constants";
import type { InventoryCategory, UnitOfMeasure } from "../types/inventory";

const categoryValues = CATEGORY_ORDER as [InventoryCategory, ...InventoryCategory[]];
const unitValues = UNIT_ORDER as [UnitOfMeasure, ...UnitOfMeasure[]];

/** Converte "12,5" ou "12.5" em número; null quando vazio ou inválido. */
export function parseDecimal(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Serializa um campo numérico do formulário para o Decimal-string do backend. */
export function toDecimalPayload(raw: string, fractionDigits = 3): string {
  const n = parseDecimal(raw);
  if (n === null) return (0).toFixed(fractionDigits);
  return n.toFixed(fractionDigits);
}

const hasMax3Decimals = (raw: string) => {
  const s = raw.trim().replace(",", ".");
  const dot = s.indexOf(".");
  return dot === -1 || s.length - dot - 1 <= 3;
};

/** Campo de quantidade obrigatório (>= 0), até 3 casas decimais. */
const requiredQuantity = z
  .string()
  .trim()
  .min(1, "Informe uma quantidade.")
  .refine((v) => parseDecimal(v) !== null, "Quantidade inválida.")
  .refine((v) => (parseDecimal(v) ?? -1) >= 0, "A quantidade não pode ser negativa.")
  .refine(hasMax3Decimals, "Use no máximo 3 casas decimais.");

/** Preço unitário opcional (>= 0, 2 casas). Vazio = sem preço. */
const optionalPrice = z
  .string()
  .trim()
  .refine((v) => v === "" || parseDecimal(v) !== null, "Preço inválido.")
  .refine((v) => v === "" || (parseDecimal(v) ?? -1) >= 0, "O preço não pode ser negativo.");

const optionalDate = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
    "Data de validade inválida.",
  )
  .refine((v) => {
    if (v === "") return true;
    const year = Number(v.slice(0, 4));
    return year >= 1900;
  }, "Data de validade inválida.");

/** Schema do formulário de item (criar/editar compartilham a mesma forma). */
export const itemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(150, "Nome muito longo (máx. 150)."),
  category: z.enum(categoryValues),
  unit_of_measure: z.enum(unitValues),
  current_quantity: requiredQuantity,
  minimum_quantity: requiredQuantity,
  supplier: z.string().trim().max(200, "Máx. 200 caracteres."),
  unit_price: optionalPrice,
  expiration_date: optionalDate,
  notes: z.string().trim().max(4000, "Máx. 4000 caracteres."),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const emptyItemForm: ItemFormValues = {
  name: "",
  category: "disposable",
  unit_of_measure: "unit",
  current_quantity: "0",
  minimum_quantity: "0",
  supplier: "",
  unit_price: "",
  expiration_date: "",
  notes: "",
};

/**
 * Schema da movimentação. Para SAÍDA, o saldo disponível limita a quantidade
 * (bloqueio no cliente, além da validação do backend). Para AJUSTE, o motivo é
 * obrigatório e a quantidade é o saldo final desejado (>= 0).
 */
export function buildMovementSchema(
  kind: "in" | "out" | "adjustment",
  available?: number,
) {
  const base = {
    quantity: z
      .string()
      .trim()
      .min(1, "Informe uma quantidade.")
      .refine((v) => parseDecimal(v) !== null, "Quantidade inválida.")
      .refine(hasMax3Decimals, "Use no máximo 3 casas decimais."),
    reason: z.string().trim().max(500, "Máx. 500 caracteres."),
  };

  if (kind === "adjustment") {
    return z.object({
      ...base,
      quantity: base.quantity.refine(
        (v) => (parseDecimal(v) ?? -1) >= 0,
        "O saldo final não pode ser negativo.",
      ),
      reason: z
        .string()
        .trim()
        .min(3, "Justifique o ajuste (mín. 3 caracteres).")
        .max(500, "Máx. 500 caracteres."),
    });
  }

  return z.object({
    ...base,
    quantity: base.quantity
      .refine((v) => (parseDecimal(v) ?? 0) > 0, "A quantidade deve ser maior que zero.")
      .refine(
        (v) =>
          kind !== "out" ||
          available === undefined ||
          (parseDecimal(v) ?? 0) <= available,
        "Quantidade acima do saldo disponível.",
      ),
  });
}

export type MovementFormValues = { quantity: string; reason: string };
