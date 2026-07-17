/**
 * Normaliza texto para busca tolerante a acento e caixa: "Segurança" e
 * "seguranca" passam a comparar iguais. Base tanto da busca de Configurações
 * quanto da paleta de comandos (Cmd/Ctrl+K).
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
