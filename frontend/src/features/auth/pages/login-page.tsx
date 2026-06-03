import { CalendarCheck, Lock, ShieldCheck } from "lucide-react";
import { Navigate } from "react-router-dom";

import { Logo, LogoMark } from "@/components/brand/logo";
import { useAuthStore } from "@/stores/auth-store";
import { LoginForm } from "../components/login-form";

const TRUST_POINTS = [
  { icon: CalendarCheck, text: "Agenda, pacientes e prontuário em um só lugar." },
  { icon: ShieldCheck, text: "Acesso por perfil e dados protegidos." },
  { icon: Lock, text: "Sessão segura: só a equipe autorizada entra." },
];

export function LoginPage() {
  const token = useAuthStore((s) => s.token);

  // Já autenticado: não faz sentido ver o login.
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Painel da marca — só no desktop. */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-graphite-900 p-12 text-white lg:flex">
        {/* Glifo de marca como marca d'água sutil. */}
        <svg
          className="pointer-events-none absolute -bottom-16 -right-16 h-96 w-96 text-gold-500/10"
          viewBox="0 0 32 32"
          fill="currentColor"
          aria-hidden
        >
          <path d="M16 6c-3.6 0-6 1.6-6 4.6 0 2 .8 3.6 1.5 6.2.6 2.3.8 5.6 1.8 7.4.4.7 1.4.7 1.7-.1.5-1.3.6-3.2 1-3.2s.5 1.9 1 3.2c.3.8 1.3.8 1.7.1 1-1.8 1.2-5.1 1.8-7.4.7-2.6 1.5-4.2 1.5-6.2C22 7.6 19.6 6 16 6z" />
        </svg>

        <Logo tone="light" size={40} />

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            A gestão da sua clínica, com a calma de quem confia no sistema.
          </h2>
          <ul className="mt-8 space-y-4">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-graphite-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-graphite-700 text-gold-400">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-graphite-400">
          OdontoPrime · Gestão Odontológica
        </p>
      </aside>

      {/* Formulário. */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <LogoMark size={48} />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
              Odonto<span className="text-gold-600">Prime</span>
            </h1>
          </div>

          <div className="mb-6 hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Entrar</h1>
            <p className="mt-1 text-sm text-ink-mute">
              Use suas credenciais para acessar o sistema.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-ink-mute">
            Acesso restrito à equipe autorizada da clínica.
          </p>
        </div>
      </main>
    </div>
  );
}
