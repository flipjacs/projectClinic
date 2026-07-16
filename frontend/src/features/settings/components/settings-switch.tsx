import type { InputHTMLAttributes } from "react";

import { Switch } from "@/components/ui/switch";
import { SettingsItem } from "./settings-item";

interface SettingsSwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  description?: string;
}

/**
 * Linha de configuração liga/desliga: <SettingsItem> com o Switch do design
 * system à direita. O rótulo visível fica na linha; o switch recebe o mesmo
 * texto via aria-label para leitores de tela.
 */
export function SettingsSwitch({ label, description, ...props }: SettingsSwitchProps) {
  return (
    <SettingsItem
      label={label}
      description={description}
      control={<Switch aria-label={label} {...props} />}
    />
  );
}
