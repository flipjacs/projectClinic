import { KeyRound } from "lucide-react";
import { useFormContext, useWatch, type Control } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import {
  assessPolicyStrength,
  type PolicyStrength,
  type SecuritySettingsFormValues,
} from "../../schemas/security-schema";
import { FeatureCard } from "../feature-card";
import { FormSwitchRow } from "../form";
import { SettingsItem } from "../settings-item";

// ---------------------------------------------------------------------------
// Medidor da força da política — isolado: só ele re-renderiza ao editar
// ---------------------------------------------------------------------------

const STRENGTH_META: Record<PolicyStrength, { label: string; level: number; tone: string }> = {
  basic: { label: "Política básica", level: 1, tone: "bg-warning-500" },
  good: { label: "Política boa", level: 2, tone: "bg-gold-500" },
  strong: { label: "Política forte", level: 3, tone: "bg-success-600" },
};

function PolicyStrengthMeter({ control }: { control: Control<SecuritySettingsFormValues> }) {
  const policy = useWatch({ control, name: "passwordPolicy" });
  const meta = STRENGTH_META[assessPolicyStrength(policy)];

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300 ease-out-quint",
              segment <= meta.level ? meta.tone : "bg-graphite-100",
            )}
          />
        ))}
      </div>
      <span role="status" className="shrink-0 text-xs font-medium text-ink-soft">
        {meta.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

/** Regras de senha aplicadas a todos os usuários da clínica. */
export function PasswordPolicyCard() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<SecuritySettingsFormValues>();
  const e = errors.passwordPolicy;

  return (
    <FeatureCard
      icon={KeyRound}
      title="Política de senhas"
      description="Regras aplicadas às senhas de todos os usuários do sistema."
      flush
    >
      <div className="px-5 py-4">
        <PolicyStrengthMeter control={control} />
      </div>

      <SettingsItem
        label="Comprimento mínimo"
        description="Quantidade mínima de caracteres exigida."
        control={
          <Input
            type="number"
            min={6}
            max={64}
            inputMode="numeric"
            aria-label="Comprimento mínimo da senha"
            className="w-24 text-center"
            error={e?.minLength?.message}
            {...register("passwordPolicy.minLength", { valueAsNumber: true })}
          />
        }
      />
      <FormSwitchRow<SecuritySettingsFormValues>
        name="passwordPolicy.requireUppercase"
        label="Exigir letras maiúsculas"
        description="A senha precisa conter ao menos uma letra maiúscula."
      />
      <FormSwitchRow<SecuritySettingsFormValues>
        name="passwordPolicy.requireNumbers"
        label="Exigir números"
        description="A senha precisa conter ao menos um número."
      />
      <FormSwitchRow<SecuritySettingsFormValues>
        name="passwordPolicy.requireSpecialChars"
        label="Exigir caracteres especiais"
        description="A senha precisa conter símbolos como @, # ou !."
      />
      <SettingsItem
        label="Expiração da senha"
        description="Dias até a troca obrigatória. Use 0 para nunca expirar."
        control={
          <Input
            type="number"
            min={0}
            max={365}
            inputMode="numeric"
            aria-label="Dias até a expiração da senha"
            className="w-24 text-center"
            error={e?.expirationDays?.message}
            {...register("passwordPolicy.expirationDays", { valueAsNumber: true })}
          />
        }
      />
      <FormSwitchRow<SecuritySettingsFormValues>
        name="passwordPolicy.allowPasswordReuse"
        label="Permitir reutilização de senha"
        description="Se desligado, a nova senha não pode repetir as anteriores."
      />
    </FeatureCard>
  );
}
