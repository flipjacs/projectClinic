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
        // Preto/grafite para textos.
        ink: {
          DEFAULT: "#191b1f",
          soft: "#3a3e45",
          mute: "#6b7079",
        },
        // Papel — fundo quente e calmo das telas (não é creme saturado).
        canvas: "#f7f7f5",
        line: "#e9e8e4", // borda quente discreta sobre papel
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
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out both",
        "fade-in-up": "fade-in-up 280ms cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 180ms cubic-bezier(0.22,1,0.36,1) both",
        "slide-in-left": "slide-in-left 240ms cubic-bezier(0.22,1,0.36,1) both",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};
