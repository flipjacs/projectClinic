import { useId } from "react";

import { COLORS } from "../../constants";

interface MiniChartProps {
  data: number[];
  stroke?: string;
  className?: string;
}

/**
 * Sparkline leve em SVG puro (sem dependência de gráfico) para os cards de
 * métrica. Escala automática; degrada para uma linha reta com poucos pontos.
 */
export function MiniChart({ data, stroke = COLORS.gold, className }: MiniChartProps) {
  const gradientId = useId();
  const W = 100;
  const H = 32;

  const points = data.length >= 2 ? data : [0, 0];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const n = points.length;

  const coords = points.map((v, i) => {
    const x = (i / (n - 1)) * W;
    const y = H - 2 - ((v - min) / span) * (H - 4);
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.2} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
