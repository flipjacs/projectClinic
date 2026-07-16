import { onlyDigits } from "@/utils/masks";

/**
 * Consulta de CEP. Hoje usa o ViaCEP (API pública, sem chave) direto do
 * navegador; quando o backend ganhar um proxy de CEP, basta trocar a
 * implementação desta função — quem consome (`useCepLookup`) não muda.
 */

export interface CepAddress {
  street: string;
  district: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

/** `null` = CEP não encontrado. Erros de rede propagam para o chamador. */
export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`CEP lookup failed: ${response.status}`);

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro) return null;

  return {
    street: data.logradouro ?? "",
    district: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
  };
}
