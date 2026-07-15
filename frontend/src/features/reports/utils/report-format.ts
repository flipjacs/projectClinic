/**
 * Formatação e mapeamento de rótulos dos relatórios. Os agregados do backend
 * chegam com `label` = valor cru do enum (ex.: "completed", "pix", "in"); aqui
 * traduzimos reusando os mapas já existentes de cada módulo. Nenhuma regra de
 * negócio é reimplementada — apenas apresentação.
 */
import { STATUS_LABELS } from "@/features/appointments/constants";
import type { AppointmentStatus } from "@/features/appointments/types/appointment";
import { PAYMENT_METHOD_LABELS } from "@/features/finance/constants";
import type { PaymentMethod } from "@/features/finance/types/finance";
import { MOVEMENT_LABELS } from "@/features/inventory/constants";
import type { MovementType } from "@/features/inventory/types/inventory";

export function appointmentStatusLabel(value: string): string {
  return STATUS_LABELS[value as AppointmentStatus] ?? value;
}

export function paymentMethodLabel(value: string): string {
  return PAYMENT_METHOD_LABELS[value as PaymentMethod] ?? value;
}

export function movementLabel(value: string): string {
  return MOVEMENT_LABELS[value as MovementType] ?? value;
}

/** Decimal-string → número (apenas para cálculo/exibição). */
export function toNum(value: string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export type DeltaDirection = "up" | "down" | "flat";

export interface Delta {
  /** Variação percentual; null quando não há base comparável (período anterior 0). */
  pct: number | null;
  direction: DeltaDirection;
}

export function computeDelta(current: number, previous: number): Delta {
  if (!Number.isFinite(previous) || previous === 0) {
    return { pct: null, direction: current > 0 ? "up" : "flat" };
  }
  const pct = ((current - previous) / previous) * 100;
  const direction = pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat";
  return { pct, direction };
}

export function formatPercent(n: number, digits = 1): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

/** Percentual de uma parte sobre o total (ex.: taxa de faltas). */
export function rate(part: number, total: number, digits = 1): string {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(digits)}%`;
}
