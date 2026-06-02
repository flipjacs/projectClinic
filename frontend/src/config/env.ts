/**
 * Configuração central de ambiente.
 *
 * A URL base da API SEMPRE vem de variável de ambiente (VITE_API_URL); nada de
 * URL hardcoded espalhada pelo código.
 */
const apiUrl = import.meta.env.VITE_API_URL?.trim();

if (!apiUrl) {
  // Falha cedo e de forma clara em desenvolvimento se faltar configuração.
  // eslint-disable-next-line no-console
  console.warn(
    "[env] VITE_API_URL não definida. Copie .env.example para .env e ajuste a URL da API.",
  );
}

export const env = {
  apiUrl: apiUrl || "http://localhost:8000/api/v1",
} as const;
