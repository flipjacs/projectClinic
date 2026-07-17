import { Check, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeatureCard } from "../feature-card";
import { FeatureUnavailable } from "../feature-unavailable";

const BENEFITS = [
  "Bloqueia acessos mesmo se a senha vazar",
  "Código gerado no celular a cada login",
  "Recomendado para quem acessa dados de pacientes",
];

/** Autenticação em duas etapas — interface pronta, ativação futura. */
export function TwoFactorCard() {
  return (
    <FeatureCard
      icon={ShieldCheck}
      title="Autenticação em duas etapas"
      description="Uma camada extra de proteção além da senha."
      badge={<Badge tone="neutral">Desativada</Badge>}
      actions={
        <Button size="sm" disabled title="Disponível em breve">
          Ativar verificação
        </Button>
      }
    >
      <ul className="space-y-2.5">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2.5 text-sm text-ink-soft">
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 ring-1 ring-inset ring-success-200"
            >
              <Check className="h-3 w-3 text-success-600" strokeWidth={3} />
            </span>
            {benefit}
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <FeatureUnavailable description="A ativação por aplicativo autenticador chega junto com o suporte do servidor. A interface já está pronta." />
      </div>
    </FeatureCard>
  );
}
