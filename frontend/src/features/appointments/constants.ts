import { toApiError } from "@/lib/api";
import type { AppointmentStatus } from "./types/appointment";

/**
 * Mensagem amigável para erros de agendamento. O conflito (409) recebe copy
 * específica; validações (422) recebem orientação sem expor detalhes técnicos.
 */
export function appointmentErrorMessage(error: unknown, fallback?: string): string {
  const apiError = toApiError(error);
  switch (apiError.status) {
    case 409:
      return "Este horário já está ocupado para o dentista selecionado.";
    case 422:
      return fallback ?? "Não foi possível concluir. Revise os horários e tente novamente.";
    case 403:
      return "Você não tem permissão para esta ação.";
    default:
      return apiError.message;
  }
}

/** Tradução visual dos status (centralizada). */
export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  in_progress: "Em andamento",
  completed: "Finalizada",
  canceled: "Cancelada",
  no_show: "Faltou",
};

/** Tom do Badge por status — discreto, dentro da identidade. */
export const STATUS_TONES: Record<
  AppointmentStatus,
  "gold" | "neutral" | "success" | "warning" | "danger" | "info"
> = {
  scheduled: "gold",
  confirmed: "info",
  in_progress: "warning",
  completed: "success",
  canceled: "neutral",
  no_show: "danger",
};

/** Ordem usada nos filtros de status. */
export const STATUS_ORDER: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
  "no_show",
  "canceled",
];

/**
 * Transições de status permitidas (espelham o backend). O cancelamento tem fluxo
 * próprio (com motivo), então é omitido aqui — usa-se o diálogo de cancelar.
 */
export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled: ["confirmed", "in_progress", "no_show"],
  confirmed: ["scheduled", "in_progress", "no_show"],
  in_progress: ["completed", "no_show"],
  completed: [],
  canceled: [],
  no_show: [],
};

/** Status terminais — não permitem editar/remarcar/cancelar. */
export const TERMINAL_STATUSES: AppointmentStatus[] = ["completed", "canceled", "no_show"];

export function isTerminal(status: AppointmentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/** Durações oferecidas no formulário (minutos) — dentro do limite 5min–6h. */
export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
export const DEFAULT_DURATION = 30;

// ===========================================================================
// Helpers de data/hora — formulário usa data + hora local; API usa ISO/UTC.
// ===========================================================================

/** Combina "YYYY-MM-DD" + "HH:mm" (hora local) em ISO 8601 com timezone. */
export function combineDateTimeToIso(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d, hh ?? 0, mm ?? 0, 0, 0).toISOString();
}

/** "YYYY-MM-DD" local a partir de um ISO. */
export function isoToLocalDate(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** "HH:mm" local a partir de um ISO. */
export function isoToLocalTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Duração em minutos entre dois ISO. */
export function durationMinutes(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(ms / 60_000));
}

/** Janela (início/fim em ISO) a partir de data + hora local + duração. */
export function buildWindow(
  date: string,
  time: string,
  durationMin: number,
): { scheduled_start: string; scheduled_end: string } {
  const startIso = combineDateTimeToIso(date, time);
  const endIso = new Date(new Date(startIso).getTime() + durationMin * 60_000).toISOString();
  return { scheduled_start: startIso, scheduled_end: endIso };
}

/** Intervalo [from, to) cobrindo o dia local informado, em ISO. */
export function dayRangeIso(date: string): { from: string; to: string } {
  const [y, m, d] = date.split("-").map(Number);
  const from = new Date(y, (m ?? 1) - 1, d, 0, 0, 0, 0);
  const to = new Date(y, (m ?? 1) - 1, (d ?? 1) + 1, 0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** "YYYY-MM-DD" de hoje, no fuso local (para defaults/min de inputs date). */
export function todayInput(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}
