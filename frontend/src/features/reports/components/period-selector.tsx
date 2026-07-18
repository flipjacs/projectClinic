import { useEffect, useState } from "react";

import { fieldBase } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { PERIOD_OPTIONS, useReportPeriod } from "../utils/period";

/**
 * Seletor de período global (sincronizado na URL). Presets rápidos + intervalo
 * personalizado. Todas as telas de relatório leem o mesmo período.
 */
export function PeriodSelector() {
  const period = useReportPeriod();
  const [from, setFrom] = useState(period.from || period.start_date);
  const [to, setTo] = useState(period.to || period.end_date);

  // Mantém os inputs em sincronia quando o período muda por outra via.
  useEffect(() => {
    setFrom(period.from || period.start_date);
    setTo(period.to || period.end_date);
  }, [period.from, period.to, period.start_date, period.end_date]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div
        role="group"
        aria-label="Período do relatório"
        className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-card"
      >
        {PERIOD_OPTIONS.map((opt) => {
          const active = period.preset === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => period.setPreset(opt.value)}
              aria-pressed={active}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
                active
                  ? "bg-gold-50 text-gold-800"
                  : "text-ink-soft hover:bg-surface-muted",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {period.preset === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            aria-label="Data inicial"
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value);
              period.setCustom(e.target.value, to);
            }}
            className={cn(fieldBase, "h-9 px-2.5 text-sm border-line hover:border-graphite-200")}
          />
          <span className="text-ink-mute">–</span>
          <input
            type="date"
            aria-label="Data final"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              period.setCustom(from, e.target.value);
            }}
            className={cn(fieldBase, "h-9 px-2.5 text-sm border-line hover:border-graphite-200")}
          />
        </div>
      )}
    </div>
  );
}
