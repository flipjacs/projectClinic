import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_TICK, COLORS, GRID_STROKE } from "../../constants";
import type { CountByDay } from "../../types/reports";
import { ChartTooltip } from "./chart-tooltip";

function shortDay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : iso;
}

/** Consultas por dia — barras. */
export function AppointmentsChart({
  data,
  height = 260,
}: {
  data: CountByDay[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickFormatter={shortDay}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: GRID_STROKE }}
          minTickGap={24}
        />
        <YAxis
          allowDecimals={false}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={28}
        />
        <Tooltip
          cursor={{ fill: COLORS.goldFaint }}
          content={
            <ChartTooltip
              formatValue={(v) => `${v} consulta(s)`}
              labelFormatter={(l) => shortDay(String(l))}
            />
          }
        />
        <Bar dataKey="count" fill={COLORS.gold} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
