import { Controller, useFormContext } from "react-hook-form";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClinicSettingsFormValues } from "../../schemas/clinic-schema";
import { LogoUploader } from "./logo-uploader";

/** Logos da clínica — o principal (documentos) e o reduzido (ícones). */
export function ClinicBrandingCard() {
  const { control } = useFormContext<ClinicSettingsFormValues>();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Identidade visual</CardTitle>
          <p className="mt-0.5 text-xs text-ink-mute">
            Imagens exibidas no sistema e nos documentos gerados.
          </p>
        </div>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
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
      </CardBody>
    </Card>
  );
}
