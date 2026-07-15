import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export type PeriodPreset = "today" | "7d" | "30d" | "90d" | "custom";

export interface ResolvedRange {
  start_date: string; // YYYY-MM-DD
  end_date: string;
}

export interface ReportPeriod extends ResolvedRange {
  preset: PeriodPreset;
  from: string;
  to: string;
}

export const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "custom", label: "Personalizado" },
];

const PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  custom: "Período personalizado",
};

export function periodLabel(preset: PeriodPreset): string {
  return PRESET_LABELS[preset];
}

/** Converte uma Date local em "YYYY-MM-DD" sem deslocamento de fuso. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Resolve um preset (ou intervalo custom) em datas concretas start/end. */
export function resolveRange(preset: PeriodPreset, from?: string, to?: string): ResolvedRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = toISODate(today);
  switch (preset) {
    case "today":
      return { start_date: end, end_date: end };
    case "7d":
      return { start_date: toISODate(addDays(today, -6)), end_date: end };
    case "90d":
      return { start_date: toISODate(addDays(today, -89)), end_date: end };
    case "custom": {
      const start = from && parseISODate(from) ? from : toISODate(addDays(today, -29));
      const endC = to && parseISODate(to) ? to : end;
      // Garante ordem cronológica.
      return start <= endC
        ? { start_date: start, end_date: endC }
        : { start_date: endC, end_date: start };
    }
    case "30d":
    default:
      return { start_date: toISODate(addDays(today, -29)), end_date: end };
  }
}

/** Janela imediatamente anterior, de mesma duração (para comparações). */
export function previousRange(range: ResolvedRange): ResolvedRange {
  const start = parseISODate(range.start_date);
  const end = parseISODate(range.end_date);
  if (!start || !end) return range;
  const lengthDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(lengthDays - 1));
  return { start_date: toISODate(prevStart), end_date: toISODate(prevEnd) };
}

/**
 * Período dos relatórios sincronizado na URL (?period=30d ou
 * ?period=custom&from=&to=). Compartilhável e navegável entre todas as telas.
 */
export function useReportPeriod(): ReportPeriod & {
  setPreset: (preset: PeriodPreset) => void;
  setCustom: (from: string, to: string) => void;
} {
  const [params, setParams] = useSearchParams();

  const preset = (params.get("period") as PeriodPreset) || "30d";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const range = useMemo(() => resolveRange(preset, from, to), [preset, from, to]);

  const setPreset = useCallback(
    (next: PeriodPreset) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set("period", next);
          if (next !== "custom") {
            p.delete("from");
            p.delete("to");
          }
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const setCustom = useCallback(
    (nextFrom: string, nextTo: string) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set("period", "custom");
          p.set("from", nextFrom);
          p.set("to", nextTo);
          return p;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { preset, from, to, ...range, setPreset, setCustom };
}
