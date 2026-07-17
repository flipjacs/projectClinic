import { Rows3 } from "lucide-react";

import { cn } from "@/utils/cn";
import { FeatureCard } from "../feature-card";
import { OptionCardGroup } from "./option-card-group";

/** Mini-lista desenhada em CSS mostrando o respiro de cada densidade. */
function DensityPreview({ gap }: { gap: "compact" | "comfortable" | "spacious" }) {
  const spacing = { compact: "gap-1", comfortable: "gap-2", spacious: "gap-3" }[gap];
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-16 flex-col justify-center rounded-lg border border-line bg-white p-2",
        spacing,
      )}
    >
      <div className="h-1.5 w-4/5 rounded-full bg-graphite-200" />
      <div className="h-1.5 w-3/5 rounded-full bg-graphite-100" />
      <div className="h-1.5 w-4/6 rounded-full bg-graphite-100" />
    </div>
  );
}

/** Espaçamento das listas e tabelas — o preview mostra o efeito na hora. */
export function DensitySelector() {
  return (
    <FeatureCard
      icon={Rows3}
      title="Densidade"
      description="Quanto conteúdo aparece por tela em listas e tabelas."
    >
      <OptionCardGroup
        name="density"
        label="Densidade da interface"
        options={[
          {
            value: "compact",
            label: "Compacta",
            hint: "Mais linhas por tela.",
            preview: <DensityPreview gap="compact" />,
          },
          {
            value: "comfortable",
            label: "Confortável",
            hint: "Equilíbrio recomendado.",
            preview: <DensityPreview gap="comfortable" />,
          },
          {
            value: "spacious",
            label: "Espaçosa",
            hint: "Mais respiro entre linhas.",
            preview: <DensityPreview gap="spacious" />,
          },
        ]}
      />
    </FeatureCard>
  );
}
