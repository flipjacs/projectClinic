import { Controller, useFormContext } from "react-hook-form";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { maskPhone } from "@/utils/masks";
import type { ClinicSettingsFormValues } from "../../schemas/clinic-schema";

/** Identificação e contatos da clínica — o que aparece em documentos. */
export function ClinicGeneralCard() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ClinicSettingsFormValues>();
  const e = errors.general;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Informações gerais</CardTitle>
          <p className="mt-0.5 text-xs text-ink-mute">
            Identificação usada em recibos, orçamentos e comunicações.
          </p>
        </div>
      </CardHeader>
      <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Nome da clínica *"
          autoComplete="organization"
          error={e?.name?.message}
          {...register("general.name")}
        />
        <Input
          label="Nome fantasia"
          hint="Como a clínica é conhecida, se diferente do nome."
          error={e?.tradeName?.message}
          {...register("general.tradeName")}
        />
        <Input
          label="Responsável técnico *"
          autoComplete="name"
          error={e?.technicalDirector?.message}
          {...register("general.technicalDirector")}
        />
        <Controller
          control={control}
          name="general.cro"
          render={({ field }) => (
            <Input
              label="CRO *"
              placeholder="CRO-SP 12345"
              name={field.name}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value.toUpperCase())}
              onBlur={field.onBlur}
              error={e?.cro?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="general.phone"
          render={({ field }) => (
            <Input
              label="Telefone *"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(00) 0000-0000"
              name={field.name}
              value={field.value}
              onChange={(event) => field.onChange(maskPhone(event.target.value))}
              onBlur={field.onBlur}
              error={e?.phone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="general.whatsapp"
          render={({ field }) => (
            <Input
              label="WhatsApp"
              type="tel"
              inputMode="numeric"
              placeholder="(00) 00000-0000"
              name={field.name}
              value={field.value}
              onChange={(event) => field.onChange(maskPhone(event.target.value))}
              onBlur={field.onBlur}
              error={e?.whatsapp?.message}
            />
          )}
        />
        <Input
          label="E-mail *"
          type="email"
          autoComplete="email"
          placeholder="contato@clinica.com.br"
          error={e?.email?.message}
          {...register("general.email")}
        />
        <Input
          label="Website"
          type="url"
          autoComplete="url"
          placeholder="clinica.com.br"
          error={e?.website?.message}
          {...register("general.website")}
        />
      </CardBody>
    </Card>
  );
}
