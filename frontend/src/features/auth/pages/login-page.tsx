import { Navigate } from "react-router-dom";

import { useAuthStore } from "@/stores/auth-store";
import { LoginForm } from "../components/login-form";

export function LoginPage() {
  const token = useAuthStore((s) => s.token);

  // Já autenticado: não faz sentido ver o login.
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ink">
            <span className="text-lg font-semibold text-gold-400">C</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Gestão da Clínica
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Entre com suas credenciais para continuar.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-card">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Acesso restrito à equipe autorizada.
        </p>
      </div>
    </div>
  );
}
