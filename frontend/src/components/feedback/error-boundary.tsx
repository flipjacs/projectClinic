import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useRouteError } from "react-router-dom";

import { Button } from "@/components/ui/button";

/**
 * Rede de segurança para erros de renderização.
 *
 * Um erro não tratado num componente NÃO pode derrubar a aplicação inteira em
 * tela branca, nem expor stack trace/detalhe técnico ao usuário (informação
 * sensível). Aqui centralizamos uma tela de recuperação premium e consistente,
 * usada em dois pontos:
 *   • `AppErrorBoundary`  — envolve a árvore toda (provedores, shell, router).
 *   • `RouteErrorBoundary` — `errorElement` das rotas (erros dentro das páginas).
 *
 * A recuperação é um reload completo: garante estado limpo a partir de uma
 * árvore possivelmente corrompida.
 */

function CrashFallback() {
  return (
    <div
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center"
    >
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-inset ring-red-100">
        <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Algo não saiu como esperado
      </h1>
      <p className="mt-2 max-w-md text-sm text-ink-mute">
        Encontramos um problema inesperado ao exibir esta tela. Suas informações
        estão seguras — recarregue a página para continuar.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => window.location.assign("/dashboard")}>
          Ir para o início
        </Button>
        <Button onClick={() => window.location.reload()}>Recarregar a página</Button>
      </div>
    </div>
  );
}

/** `errorElement` das rotas — captura erros de renderização dentro das páginas. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  // Log só para diagnóstico do desenvolvedor; nunca chega à interface.
  if (import.meta.env.DEV) {
    console.error("Route render error:", error);
  }
  return <CrashFallback />;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

/** Boundary de classe — última linha de defesa em torno de toda a aplicação. */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    if (import.meta.env.DEV) {
      console.error("App render error:", error);
    }
  }

  render() {
    return this.state.hasError ? <CrashFallback /> : this.props.children;
  }
}
