import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient central. Defaults conservadores para reduzir chamadas duplicadas
 * e re-fetches agressivos, mantendo dados frescos o suficiente para um sistema
 * operacional de clínica.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
