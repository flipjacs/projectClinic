import { QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

import { Toaster } from "@/components/feedback/toaster";
import { queryClient } from "@/lib/query-client";
import { useAppearanceStore } from "@/stores/appearance-store";
import { ThemeManager } from "./theme-manager";

/** Carrega as features do Framer sob demanda (fora do bundle inicial). */
const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((mod) => mod.default);

/** Provedores globais da aplicação (cache de dados, motion, toasts). */
export function AppProviders({ children }: { children: ReactNode }) {
  // Preferência explícita de reduzir movimento força "always"; senão respeita o
  // sistema ("user"). Cobre tanto o toggle de acessibilidade quanto o SO.
  const reducedMotion = useAppearanceStore((s) => s.preferences.reducedMotion);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeManager />
      {/* `strict` garante que só usamos o componente leve `m` (não `motion`). */}
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion={reducedMotion ? "always" : "user"}>
          {children}
          <Toaster />
        </MotionConfig>
      </LazyMotion>
    </QueryClientProvider>
  );
}
