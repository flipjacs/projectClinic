import { Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import { FeatureCard } from "../feature-card";
import { OptionCardGroup } from "./option-card-group";

/** Mini-janela desenhada em CSS simulando o tema. */
function ThemePreview({ dark, split }: { dark?: boolean; split?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative h-16 overflow-hidden rounded-lg border",
        dark ? "border-graphite-700 bg-graphite-900" : "border-line bg-white",
      )}
    >
      {split && (
        <div className="absolute inset-y-0 right-0 w-1/2 border-l border-graphite-700 bg-graphite-900" />
      )}
      <div className="relative flex h-full flex-col gap-1.5 p-2">
        <div className={cn("h-1.5 w-2/5 rounded-full", dark ? "bg-graphite-600" : "bg-graphite-200")} />
        <div className={cn("h-1.5 w-4/5 rounded-full", dark ? "bg-graphite-700" : "bg-graphite-100")} />
        <div className={cn("h-1.5 w-3/5 rounded-full", dark ? "bg-graphite-700" : "bg-graphite-100")} />
        <div className="mt-auto h-2.5 w-9 rounded-full bg-gold-500/90" />
      </div>
    </div>
  );
}

/** Escolha do tema da interface — claro hoje; escuro e automático a caminho. */
export function ThemeSelector() {
  return (
    <FeatureCard
      icon={Palette}
      title="Tema"
      description="Aparência geral da interface neste dispositivo."
    >
      <OptionCardGroup
        name="theme"
        label="Tema da interface"
        options={[
          { value: "light", label: "Claro", hint: "Tema atual do sistema.", preview: <ThemePreview /> },
          {
            value: "dark",
            label: "Escuro",
            hint: "Ideal para ambientes com pouca luz.",
            preview: <ThemePreview dark />,
            badge: <Badge tone="gold">Em desenvolvimento</Badge>,
            disabled: true,
          },
          {
            value: "system",
            label: "Sistema",
            hint: "Acompanha o tema do dispositivo.",
            preview: <ThemePreview split />,
            badge: <Badge tone="gold">Em desenvolvimento</Badge>,
            disabled: true,
          },
        ]}
      />
    </FeatureCard>
  );
}
