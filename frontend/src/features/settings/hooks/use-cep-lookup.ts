import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

import { onlyDigits } from "@/utils/masks";
import { lookupCep, type CepAddress } from "../services/cep-api";

type CepStatus = "idle" | "loading" | "found" | "not-found" | "error";

/**
 * Consulta de CEP sob demanda com cache (o mesmo CEP nunca é buscado duas
 * vezes na sessão). Falha de rede nunca bloqueia o formulário — o usuário
 * segue preenchendo o endereço à mão.
 */
export function useCepLookup() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<CepStatus>("idle");
  // Ignora respostas fora de ordem quando o usuário corrige o CEP rápido.
  const requestSeq = useRef(0);

  const lookup = useCallback(
    async (cep: string): Promise<CepAddress | null> => {
      const digits = onlyDigits(cep);
      if (digits.length !== 8) {
        setStatus("idle");
        return null;
      }
      const seq = ++requestSeq.current;
      setStatus("loading");
      try {
        const address = await qc.fetchQuery({
          queryKey: ["cep", digits],
          queryFn: () => lookupCep(digits),
          staleTime: Infinity,
        });
        if (seq !== requestSeq.current) return null;
        setStatus(address ? "found" : "not-found");
        return address;
      } catch {
        if (seq === requestSeq.current) setStatus("error");
        return null;
      }
    },
    [qc],
  );

  const reset = useCallback(() => setStatus("idle"), []);

  return { lookup, status, reset };
}
