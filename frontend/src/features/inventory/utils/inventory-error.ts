import { apiErrorDetail, toApiError } from "@/lib/api";

/**
 * Mensagem segura para falhas do estoque. Prioriza o `detail` de domínio do
 * backend (ex.: "Saldo insuficiente para a saída") — que é uma mensagem
 * amigável e revisada — e cai para a mensagem genérica por status quando não
 * houver. Nunca expõe stack trace ou erro técnico cru.
 */
export function inventoryErrorMessage(error: unknown): string {
  return apiErrorDetail(error) ?? toApiError(error).message;
}
