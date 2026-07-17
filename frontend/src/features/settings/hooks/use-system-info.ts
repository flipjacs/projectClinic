import { useQuery } from "@tanstack/react-query";

import { getSystemStatus } from "../services/settings-system-api";

export const systemInfoKeys = {
  status: ["settings", "system", "status"] as const,
};

/**
 * Saúde do sistema em (quase) tempo real: revalida a cada 30s enquanto a
 * página está aberta. O service nunca rejeita — falhas viram estado "down".
 */
export function useSystemInfo() {
  return useQuery({
    queryKey: systemInfoKeys.status,
    queryFn: getSystemStatus,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}
