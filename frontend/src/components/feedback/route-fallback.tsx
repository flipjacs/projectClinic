import { Loader2 } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";

/**
 * Fallback de carregamento de rotas (code splitting). Tela cheia para o
 * primeiro acesso (antes de qualquer chrome) — marca + indicador discreto.
 */
export function RouteFallback() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas"
      role="status"
      aria-live="polite"
    >
      <LogoMark size={48} />
      <Loader2 className="h-5 w-5 animate-spin text-gold-500" aria-hidden />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
