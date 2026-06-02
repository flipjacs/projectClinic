import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50">
        <ShieldAlert className="h-7 w-7 text-gold-500" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold text-ink">Acesso não autorizado</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">
        Você não tem permissão para acessar esta página. Se acredita que isso é
        um engano, fale com um administrador da clínica.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <Button onClick={() => navigate("/dashboard", { replace: true })}>
          Ir para o Dashboard
        </Button>
      </div>
    </div>
  );
}
