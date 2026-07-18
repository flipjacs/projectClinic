import { useEffect } from "react";

import { useAppearanceStore } from "@/stores/appearance-store";
import { useAppearance } from "./use-appearance";

/**
 * Hidrata as preferências de aparência a partir do BACKEND (fonte de verdade)
 * assim que o usuário está autenticado, aplicando-as ao documento. O
 * localStorage do appearance-store permanece apenas como cache anti-flicker
 * para o próximo carregamento (script inline no index.html).
 *
 * Montado dentro da área autenticada (AppLayout), então a query só dispara com
 * sessão válida. Não renderiza nada.
 */
export function useAppearanceSync() {
  const { data } = useAppearance();
  const hydrate = useAppearanceStore((s) => s.hydrate);

  useEffect(() => {
    if (data) hydrate(data);
  }, [data, hydrate]);
}
