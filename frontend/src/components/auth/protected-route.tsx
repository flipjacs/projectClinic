import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Loading } from "@/components/feedback/loading";
import { useAuth } from "@/features/auth/hooks/use-auth";

/**
 * Garante uma sessão válida:
 *   - sem token → /login;
 *   - com token mas /auth/me falhando → o interceptor já limpou a sessão;
 *     aqui caímos no caso "sem token" e redirecionamos para /login;
 *   - carregando o usuário → loading.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoadingUser, isUserError } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoadingUser) {
    return <Loading fullPage label="Verificando sessão…" />;
  }

  if (isUserError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
