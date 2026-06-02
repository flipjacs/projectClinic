import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { canAccess } from "@/lib/permissions";
import type { Role } from "@/types/roles";

/**
 * Protege uma rota por perfil. Esconder o link no menu é só UX; este guard é a
 * barreira de fato no frontend (e o backend continua sendo a proteção real).
 */
export function RoleGuard({
  allowed,
  children,
}: {
  allowed: Role[];
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!canAccess(user?.role, allowed)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
