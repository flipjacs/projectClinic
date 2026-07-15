import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatMoney } from "@/utils/currency";
import { CATEGORICAL } from "../../constants";
import type { TotalByLabel } from "../../types/reports";
import { paymentMethodLabel, toNum } from "../../utils/report-format";
import { ChartTooltip } from "./chart-tooltip";

/** Métodos de pagamento — donut minimalista com legenda à direita. */
export function PaymentChart({ data, height = 220 }: { data: TotalByLabel[]; height?: number }) {
  const series = data.map((d, i) => ({
    name: paymentMethodLabel(d.label),
    value: toNum(d.total),
    color: CATEGORICAL[i % CATEGORICAL.length],
  }));
  const total = series.reduce((acc, s) => acc + s.value, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="w-full max-w-[200px]" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={series}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={series.length > 1 ? 2 : 0}
              stroke="none"
            >
              {series.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip formatValue={(v) => formatMoney(v)} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full flex-1 space-y-2">
        {series.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              <span className="truncate text-ink-soft">{s.name}</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="font-medium tabular-nums text-ink">{formatMoney(s.value)}</span>
              <span className="ml-2 text-xs text-ink-mute">
                {total > 0 ? `${Math.round((s.value / total) * 100)}%` : "—"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
