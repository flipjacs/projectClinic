import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/utils/currency";
import { AXIS_TICK, COLORS, GRID_STROKE } from "../../constants";
import type { TotalByDay } from "../../types/reports";
import { toNum } from "../../utils/report-format";
import { ChartTooltip } from "./chart-tooltip";

function shortDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : iso;
}

function compactMoney(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}

/** Receita ao longo do tempo — área com linha suave. */
export function RevenueChart({ data, height = 260 }: { data: TotalByDay[]; height?: number }) {
  const series = data.map((d) => ({ day: d.day, total: toNum(d.total) }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.22} />
            <stop offset="100%" stopColor={COLORS.gold} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickFormatter={shortDay}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
          minTickGap={28}
        />
        <YAxis
          tickFormatter={compactMoney}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          cursor={{ stroke: COLORS.goldSoft, strokeWidth: 1 }}
          content={
            <ChartTooltip
              formatValue={(v) => formatMoney(v)}
              labelFormatter={(l) => shortDay(String(l))}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke={COLORS.gold}
          strokeWidth={2}
          fill="url(#revenueFill)"
          activeDot={{ r: 4, fill: COLORS.gold, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
