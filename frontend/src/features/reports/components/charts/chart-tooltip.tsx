interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatValue?: (value: number) => string;
  labelFormatter?: (label: string | number) => string;
}

/** Tooltip enxuto e consistente para todos os gráficos (cartão branco leve). */
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue = (v) => String(v),
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-elevated">
      {label !== undefined && (
        <p className="mb-1 text-xs font-medium text-ink-mute">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-ink">
          {entry.color && (
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden
            />
          )}
          <span className="tabular-nums font-medium">
            {typeof entry.value === "number" ? formatValue(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
