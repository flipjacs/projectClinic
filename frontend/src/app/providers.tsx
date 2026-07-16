import { QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

import { Toaster } from "@/components/feedback/toaster";
import { queryClient } from "@/lib/query-client";

/** Carrega as features do Framer sob demanda (fora do bundle inicial). */
const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((mod) => mod.default);

/** Provedores globais da aplicação (cache de dados, motion, toasts). */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* `strict` garante que só usamos o componente leve `m` (não `motion`). */}
      <LazyMotion features={loadMotionFeatures} strict>
        {/* Respeita "reduzir movimento" do sistema em toda animação do Framer. */}
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}
