/**
 * Lógica semântica do estoque: derivação de status e formatação de quantidade.
 *
 * Duas dimensões independentes de saúde de um item:
 *  - saldo (stock): zerado / baixo / saudável / inativo
 *  - validade (expiration): vencido / a vencer / ok
 *
 * A cor NUNCA carrega o significado sozinha — todo status vem sempre com rótulo
 * textual nas telas (acessibilidade).
 */
import { EXPIRING_WINDOW_DAYS } from "../constants";
import type { InventoryItem } from "../types/inventory";

export type StockStatus = "ok" | "low" | "zero" | "inactive";
export type ExpirationStatus = "none" | "ok" | "expiring" | "expired";

export interface StockStatusMeta {
  status: StockStatus;
  label: string;
  /** Tom do Badge compartilhado. */
  tone: "success" | "warning" | "danger" | "neutral";
}

const STOCK_META: Record<StockStatus, StockStatusMeta> = {
  ok: { status: "ok", label: "Saudável", tone: "success" },
  low: { status: "low", label: "Estoque baixo", tone: "warning" },
  zero: { status: "zero", label: "Zerado", tone: "danger" },
  inactive: { status: "inactive", label: "Inativo", tone: "neutral" },
};

/** Converte o Decimal-string do backend em número apenas para comparação/UI. */
export function quantityToNumber(value: string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Status de saldo do item, considerando primeiro se está ativo. */
export function deriveStockStatus(item: InventoryItem): StockStatusMeta {
  if (!item.is_active) return STOCK_META.inactive;
  const current = quantityToNumber(item.current_quantity);
  const minimum = quantityToNumber(item.minimum_quantity);
  if (current <= 0) return STOCK_META.zero;
  if (current <= minimum) return STOCK_META.low;
  return STOCK_META.ok;
}

/** Prioridade para ordenar itens críticos: zerado > baixo > demais. */
export function criticalRank(item: InventoryItem): number {
  const { status } = deriveStockStatus(item);
  if (status === "zero") return 0;
  if (status === "low") return 1;
  return 2;
}

/**
 * Dias até o vencimento a partir de uma data "YYYY-MM-DD", em fuso local e sem
 * horas (evita deslocamento por timezone). Negativo = já vencido.
 */
export function daysUntil(dateOnly: string | null | undefined): number | null {
  if (!dateOnly) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOnly);
  if (!match) return null;
  const [, y, m, d] = match;
  const target = new Date(Number(y), Number(m) - 1, Number(d));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / 86_400_000);
}

export interface ExpirationMeta {
  status: ExpirationStatus;
  /** Dias restantes (negativo se vencido); null quando não há validade. */
  days: number | null;
}

/** Status de validade dado um item (usa a janela padrão de 30 dias). */
export function deriveExpiration(
  item: Pick<InventoryItem, "expiration_date">,
  windowDays = EXPIRING_WINDOW_DAYS,
): ExpirationMeta {
  const days = daysUntil(item.expiration_date);
  if (days === null) return { status: "none", days: null };
  if (days < 0) return { status: "expired", days };
  if (days <= windowDays) return { status: "expiring", days };
  return { status: "ok", days };
}

const quantityFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

/**
 * Formata uma quantidade Decimal-string para exibição pt-BR, removendo casas
 * decimais irrelevantes ("12.000" → "12", "2.500" → "2,5").
 */
export function formatQuantity(value: string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0";
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return quantityFormatter.format(n);
}
