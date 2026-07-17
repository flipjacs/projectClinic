import { Check, MessageCircle } from "lucide-react";

import { FeatureCard } from "../feature-card";
import { FeatureUnavailable } from "../feature-unavailable";
import { IntegrationStatus } from "./integration-status";

const BENEFITS = [
  "Confirmação de consulta com um toque",
  "Lembretes direto no celular do paciente",
  "Menos faltas sem esforço da recepção",
];

/** Integração com WhatsApp — planejada; interface e contrato preparados. */
export function WhatsAppCard() {
  return (
    <FeatureCard
      icon={MessageCircle}
      title="WhatsApp"
      description="Conversas e confirmações automáticas com pacientes."
      badge={<IntegrationStatus status="planned" />}
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
        <FeatureUnavailable
          title="Planejado"
          description="Depende da API oficial do WhatsApp Business. Entrará no roadmap após o canal de e-mail."
        />
      </div>
    </FeatureCard>
  );
}
