import { Image as ImageIcon } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import type { ClinicSettingsFormValues } from "../../schemas/clinic-schema";
import { FeatureCard } from "../feature-card";
import { LogoUploader } from "./logo-uploader";

/** Logos da clínica — o principal (documentos) e o reduzido (ícones). */
export function ClinicBrandingCard() {
  const { control } = useFormContext<ClinicSettingsFormValues>();

  return (
    <FeatureCard
      icon={ImageIcon}
      title="Identidade visual"
      description="Imagens exibidas no sistema e nos documentos gerados."
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
        <Controller
          control={control}
          name="branding.logo"
          render={({ field }) => (
            <LogoUploader
              label="Logo"
              description="Usado em recibos, orçamentos e no topo do sistema."
              value={field.value}
              onChange={field.onChange}
              rules={{ minEdge: 128, maxEdge: 1600 }}
              shape="wide"
            />
          )}
        />
        <Controller
          control={control}
          name="branding.logoSmall"
          render={({ field }) => (
            <LogoUploader
              label="Logo reduzida"
              description="Versão quadrada para ícones e espaços pequenos."
              value={field.value}
              onChange={field.onChange}
              rules={{ minEdge: 64, maxEdge: 512 }}
              shape="square"
            />
          )}
        />
      </div>
    </FeatureCard>
  );
}
