/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dourado — cor principal de destaque.
        gold: {
          50: "#faf7ef",
          100: "#f3e8cd",
          200: "#e7d29b",
          300: "#d9bb67",
          400: "#cda63f",
          500: "#b98f2e", // ação principal
          600: "#9a7626",
          700: "#7c5f20",
          800: "#5e481a",
          900: "#3f3011",
        },
        // Preto/grafite para textos e contraste.
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#3a3a3a",
        },
      },
      fontFamily: {
        sans: [
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
      boxShadow: {
        card: "0 1px 2px 0 rgba(0,0,0,0.04), 0 1px 3px 0 rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
