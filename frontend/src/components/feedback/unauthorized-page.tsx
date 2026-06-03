import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 ring-1 ring-inset ring-gold-100">
        <ShieldAlert className="h-7 w-7 text-gold-600" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Acesso restrito</h1>
      <p className="mt-2 max-w-md text-sm text-ink-mute">
        Você não tem permissão para acessar esta área. Se acredita que isso é um
        engano, fale com um administrador da clínica.
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
