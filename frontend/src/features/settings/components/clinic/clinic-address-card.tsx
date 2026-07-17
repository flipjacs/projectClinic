import { Loader2, MapPin } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { maskCEP, onlyDigits, UFS } from "@/utils/masks";
import { useCepLookup } from "../../hooks/use-cep-lookup";
import type { ClinicSettingsFormValues } from "../../schemas/clinic-schema";
import { FeatureCard } from "../feature-card";

const UF_OPTIONS = UFS.map((uf) => ({ value: uf, label: uf }));

const CEP_HINTS: Record<string, string | undefined> = {
  "not-found": "CEP não encontrado — preencha o endereço manualmente.",
  error: "Não foi possível consultar o CEP agora. Preencha manualmente.",
};

/** Endereço com preenchimento automático por CEP (ViaCEP). */
export function ClinicAddressCard() {
  const {
    register,
    control,
    setValue,
    setFocus,
    formState: { errors },
  } = useFormContext<ClinicSettingsFormValues>();
  const { lookup, status } = useCepLookup();
  const e = errors.address;

  async function handleCepChange(masked: string) {
    if (onlyDigits(masked).length !== 8) return;
    const address = await lookup(masked);
    if (!address) return;

    const fill = (name: keyof ClinicSettingsFormValues["address"], value: string) => {
      if (!value) return;
      setValue(`address.${name}`, value as never, {
        shouldDirty: true,
        shouldValidate: true,
      });
    };
    fill("street", address.street);
    fill("district", address.district);
    fill("city", address.city);
    fill("state", address.state);
    // O que falta preencher é sempre o número — leva o foco direto até lá.
    setFocus("address.number");
  }

  return (
    <FeatureCard
      icon={MapPin}
      title="Endereço"
      description="Informe o CEP para preencher o endereço automaticamente."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Controller
            control={control}
            name="address.zipCode"
            render={({ field }) => (
              <Input
                label="CEP *"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                name={field.name}
                value={field.value}
                onChange={(event) => {
                  const masked = maskCEP(event.target.value);
                  field.onChange(masked);
                  void handleCepChange(masked);
                }}
                onBlur={field.onBlur}
                error={e?.zipCode?.message}
                hint={CEP_HINTS[status]}
              />
            )}
          />
          {status === "loading" && (
            <Loader2
              className="absolute right-3 top-9 h-4 w-4 animate-spin text-gold-600"
              aria-hidden
            />
          )}
          <span className="sr-only" role="status" aria-live="polite">
            {status === "loading" ? "Buscando endereço pelo CEP…" : ""}
          </span>
        </div>

        <div className="sm:col-span-4">
          <Input
            label="Rua *"
            autoComplete="address-line1"
            error={e?.street?.message}
            {...register("address.street")}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Número *"
            autoComplete="address-line2"
            error={e?.number?.message}
            {...register("address.number")}
          />
        </div>
        <div className="sm:col-span-4">
          <Input
            label="Complemento"
            placeholder="Sala, andar…"
            error={e?.complement?.message}
            {...register("address.complement")}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Bairro *"
            error={e?.district?.message}
            {...register("address.district")}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Cidade *"
            autoComplete="address-level2"
            error={e?.city?.message}
            {...register("address.city")}
          />
        </div>
        <div className="sm:col-span-1">
          <Select
            label="Estado *"
            placeholder="UF"
            options={UF_OPTIONS}
            autoComplete="address-level1"
            error={e?.state?.message}
            {...register("address.state")}
          />
        </div>
        <div className="sm:col-span-1">
          <Input
            label="País *"
            autoComplete="country-name"
            error={e?.country?.message}
            {...register("address.country")}
          />
        </div>
      </div>
    </FeatureCard>
  );
}
