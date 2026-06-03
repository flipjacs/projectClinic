/**
 * Anamnese odontológica básica: lista de condições comuns e helpers para
 * serializar/parsear as seleções no campo de texto livre `disease_description`
 * do backend (que não tem estrutura própria para condições).
 *
 * Formato persistido: condições separadas por "; ", com a entrada livre
 * prefixada por "Outra: ". Ex.: "Diabetes; Hipertensão; Outra: Doença renal".
 */

/** Condições comuns úteis no contexto odontológico (linguagem simples). */
export const COMMON_CONDITIONS: readonly string[] = [
  "Diabetes",
  "Hipertensão",
  "Problemas cardíacos",
  "Asma / bronquite",
  "Epilepsia",
  "Distúrbios de coagulação",
  "Anemia",
  "Doença renal",
  "Doença hepática",
  "Doença autoimune",
  "Osteoporose",
  "Gravidez",
  "Ansiedade / síndrome do pânico",
  "Histórico de desmaios",
  "Uso de anticoagulante",
  "Imunossupressão",
] as const;

const OTHER_PREFIX = "Outra:";

export interface ParsedConditions {
  /** Condições conhecidas marcadas (chips). */
  conditions: string[];
  /** Se a opção "Outra condição" deve aparecer marcada. */
  otherEnabled: boolean;
  /** Texto livre de "Outra condição". */
  otherText: string;
}

/**
 * Converte o texto salvo em estado estruturado, sem perder informação:
 * tokens conhecidos viram chips; o resto (incluindo texto livre antigo) vai
 * para "Outra condição".
 */
export function parseDiseaseConditions(text: string | null | undefined): ParsedConditions {
  const conditions: string[] = [];
  const otherParts: string[] = [];

  if (text) {
    for (const raw of text.split(";")) {
      const token = raw.trim();
      if (!token) continue;

      const lower = token.toLowerCase();
      if (lower.startsWith(OTHER_PREFIX.toLowerCase())) {
        const rest = token.slice(token.indexOf(":") + 1).trim();
        if (rest) otherParts.push(rest);
        continue;
      }

      const match = COMMON_CONDITIONS.find((c) => c.toLowerCase() === lower);
      if (match && !conditions.includes(match)) {
        conditions.push(match);
      } else if (!match) {
        // Token desconhecido (ex.: texto livre antigo) — preservado em "Outra".
        otherParts.push(token);
      }
    }
  }

  const otherText = otherParts.join("; ");
  return { conditions, otherEnabled: otherText.length > 0, otherText };
}

/**
 * Monta a string a ser enviada em `disease_description`. Retorna `null` quando
 * não há nada selecionado (ex.: doença desmarcada).
 */
export function serializeDiseaseConditions(input: ParsedConditions): string | null {
  // Mantém a ordem canônica da lista de condições conhecidas.
  const parts: string[] = COMMON_CONDITIONS.filter((c) => input.conditions.includes(c));

  const other = input.otherText.trim();
  if (input.otherEnabled && other) {
    parts.push(`${OTHER_PREFIX} ${other}`);
  }

  return parts.length > 0 ? parts.join("; ") : null;
}
