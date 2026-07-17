import type { ReactNode } from "react";
import { Controller, useFormContext, type FieldPath, type FieldValues } from "react-hook-form";

import { Switch } from "@/components/ui/switch";
import { SettingsItem } from "../settings-item";

interface FormSwitchRowProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  /** Obrigatória por princípio: um toggle nunca fica sem explicação. */
  description: string;
  /** Badge opcional ao lado do controle (ex.: <Badge>Em breve</Badge>). */
  badge?: ReactNode;
  /** Recurso ainda sem suporte: switch visível porém inerte. */
  disabled?: boolean;
}

/**
 * Linha liga/desliga conectada ao formulário (React Hook Form). Cada linha
 * assina apenas o próprio campo — alternar um switch não re-renderiza os
 * demais. Base do NotificationSwitch e das regras de política de senha.
 */
export function FormSwitchRow<T extends FieldValues>({
  name,
  label,
  description,
  badge,
  disabled,
}: FormSwitchRowProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SettingsItem
          label={label}
          description={description}
          control={
            <>
              {badge}
              <Switch
                aria-label={label}
                name={field.name}
                checked={Boolean(field.value)}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                disabled={disabled}
              />
            </>
          }
        />
      )}
    />
  );
}
