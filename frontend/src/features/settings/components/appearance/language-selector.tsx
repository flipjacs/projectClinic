import { Languages } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FeatureCard } from "../feature-card";
import { OptionCardGroup } from "./option-card-group";

/** Idioma da interface — português hoje; inglês e espanhol no contrato. */
export function LanguageSelector() {
  return (
    <FeatureCard
      icon={Languages}
      title="Idioma"
      description="Idioma dos textos da interface para este usuário."
    >
      <OptionCardGroup
        name="language"
        label="Idioma da interface"
        options={[
          { value: "pt-BR", label: "Português (Brasil)", hint: "Idioma atual." },
          {
            value: "en",
            label: "English",
            hint: "Tradução em preparação.",
            badge: <Badge tone="neutral">Em breve</Badge>,
            disabled: true,
          },
          {
            value: "es",
            label: "Español",
            hint: "Tradução em preparação.",
            badge: <Badge tone="neutral">Em breve</Badge>,
            disabled: true,
          },
        ]}
      />
    </FeatureCard>
  );
}
