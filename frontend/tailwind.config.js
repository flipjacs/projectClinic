/** @type {import('tailwindcss').Config} */

/**
 * Design system "OdontoPrime".
 *
 * Identidade: grafite + dourado sobre papel quente (branco). O dourado é a cor
 * de ação/destaque; o grafite carrega a navegação; o papel é a base calma das
 * telas de trabalho. Cores semânticas (success/warning/danger/info) entram de
 * forma discreta apenas em status e alertas.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dourado — cor principal de destaque e ação.
        gold: {
          50: "#faf7ef",
          100: "#f4e9cf",
          200: "#e8d49d",
          300: "#dabd69",
          400: "#cda63f",
          500: "#bb8f2c", // ação principal (contraste AA sobre branco)
          600: "#9c7624",
          700: "#7c5d1f",
          800: "#5d461b",
          900: "#3f3013",
        },
        // Grafite — superfícies escuras (sidebar) e contraste.
        graphite: {
          50: "#f5f6f7",
          100: "#e7e8ea",
          200: "#c9ccd1",
          300: "#a3a8b0",
          400: "#71777f",
          500: "#4b505a",
          600: "#363b44",
          700: "#262a31",
          800: "#1b1e24", // superfície da sidebar
          900: "#14161b", // fundo profundo / base da sidebar
          950: "#0e0f13",
        },
        // Tokens semânticos de superfície e texto — resolvidos por CSS
        // variables (ver index.css) para suportar tema claro/escuro sem tocar
        // os componentes. O valor light preserva exatamente a identidade atual.
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          mute: "rgb(var(--ink-mute) / <alpha-value>)",
        },
        // Fundo das telas (papel quente no claro; grafite profundo no escuro).
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        // Superfície de cartões/inputs/tabelas (branco no claro).
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          muted: "rgb(var(--surface-muted) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)", // borda discreta

        // ------------------------------------------------------------------
        // Tokens semânticos de estado. Mesmos hexes das paletas Tailwind já
        // usadas nas telas (emerald/amber/red/sky) — agora com NOME de
        // intenção: novos componentes falam "success", não "emerald".
        // ------------------------------------------------------------------
        success: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
        },
        info: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
        },
      },
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        // Sombras leves e quentes — nada de "drop shadow" pesado de template.
        card: "0 1px 2px 0 rgba(20,22,27,0.04), 0 1px 3px 0 rgba(20,22,27,0.06)",
        soft: "0 1px 2px rgba(20,22,27,0.04), 0 4px 12px -2px rgba(20,22,27,0.06)",
        elevated:
          "0 4px 6px -2px rgba(20,22,27,0.05), 0 12px 28px -6px rgba(20,22,27,0.12)",
        ring: "0 0 0 1px rgba(20,22,27,0.06)",
        "gold-glow": "0 6px 20px -6px rgba(187,143,44,0.45)",
        // Elevação de hover para cartões interativos (lift discreto).
        lift: "0 6px 16px -4px rgba(20,22,27,0.08), 0 16px 32px -8px rgba(20,22,27,0.14)",
      },
      zIndex: {
        dropdown: "1000",
        sticky: "1100",
        drawer: "1200",
        "modal-backdrop": "1300",
        modal: "1400",
        toast: "1500",
        tooltip: "1600",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // Toasts e elementos que "chegam" de baixo.
        "slide-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Micro-bounce de entrada (overshoot de 1% — perceptível, não teatral).
        pop: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "60%": { opacity: "1", transform: "scale(1.01)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out both",
        "fade-in-up": "fade-in-up 280ms cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 180ms cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-left": "slide-in-left 240ms cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-up": "slide-in-up 240ms cubic-bezier(0.22,1,0.36,1) both",
        pop: "pop 220ms cubic-bezier(0.22,1,0.36,1) both",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.22,1,0.36,1)",
        "out-expo": "cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};
