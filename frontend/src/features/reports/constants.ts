/**
 * Paleta e ajustes dos gráficos. Deliberadamente contida — dourado como cor de
 * destaque e grafites neutros para o restante, sem excesso de cor (coerente com
 * a identidade OdontoPrime).
 */

// Tokens do design system em hex (para uso dentro do SVG do Recharts).
export const COLORS = {
  gold: "#bb8f2c",
  goldSoft: "#dabd69",
  goldFaint: "#f4e9cf",
  ink: "#191b1f",
  inkMute: "#6b7079",
  line: "#e9e8e4",
  graphite: "#4b505a",
  graphiteSoft: "#a3a8b0",
  emerald: "#059669",
  red: "#dc2626",
  amber: "#d97706",
  orange: "#ea580c",
} as const;

/** Sequência de cores para séries categóricas (pizza/barras empilhadas). */
export const CATEGORICAL: string[] = [
  "#bb8f2c", // gold-500
  "#4b505a", // graphite-500
  "#dabd69", // gold-300
  "#a3a8b0", // graphite-300
  "#7c5d1f", // gold-700
  "#262a31", // graphite-700
];

/** Eixos e grade discretos, comuns a todos os gráficos. */
export const AXIS_TICK = { fontSize: 12, fill: COLORS.inkMute } as const;
export const GRID_STROKE = COLORS.line;
