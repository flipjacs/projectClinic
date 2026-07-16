import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

import { Toaster } from "@/components/feedback/toaster";
import { queryClient } from "@/lib/query-client";

/** Provedores globais da aplicação (cache de dados, motion, toasts). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Respeita "reduzir movimento" do sistema em toda animação do Framer. */}
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}
