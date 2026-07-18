import axios from "axios";

import { api } from "@/lib/api";
import type { AppearanceSettingsFormValues } from "../schemas/appearance-schema";

/**
 * Client HTTP das Configurações de Aparência.
 *
 * Endpoints IMPLEMENTADOS (por usuário): GET/PUT /settings/appearance. O GET
 * sempre retorna 200 (padrões se o usuário ainda não personalizou), então o
 * tema é aplicado sem risco de falha. O appearance-store hidrata a partir daqui
 * e mantém o localStorage só como cache anti-flicker.
 */

const APPEARANCE_PATH = "/settings/appearance";

/** DTO no formato do backend (snake_case, padrão dos outros módulos). */
export interface AppearanceSettingsDto {
  theme: "light" | "dark" | "system";
  density: "compact" | "comfortable" | "spacious";
  language: "pt-BR" | "en" | "es";
  preferences: {
    reduced_motion: boolean;
    high_contrast: boolean;
    confirm_critical_actions: boolean;
    auto_save_filters: boolean;
    reopen_last_page: boolean;
  };
}

export function toAppearanceFormValues(
  dto: AppearanceSettingsDto,
): AppearanceSettingsFormValues {
  return {
    theme: dto.theme,
    density: dto.density,
    language: dto.language,
    preferences: {
      reducedMotion: dto.preferences.reduced_motion,
      highContrast: dto.preferences.high_contrast,
      confirmCriticalActions: dto.preferences.confirm_critical_actions,
      autoSaveFilters: dto.preferences.auto_save_filters,
      reopenLastPage: dto.preferences.reopen_last_page,
    },
  };
}

export function toAppearancePayload(
  values: AppearanceSettingsFormValues,
): AppearanceSettingsDto {
  return {
    theme: values.theme,
    density: values.density,
    language: values.language,
    preferences: {
      reduced_motion: values.preferences.reducedMotion,
      high_contrast: values.preferences.highContrast,
      confirm_critical_actions: values.preferences.confirmCriticalActions,
      auto_save_filters: values.preferences.autoSaveFilters,
      reopen_last_page: values.preferences.reopenLastPage,
    },
  };
}

/** `null` = nada salvo ainda (ou endpoint ainda não implantado). */
export async function getAppearanceSettings(): Promise<AppearanceSettingsFormValues | null> {
  try {
    const { data } = await api.get<AppearanceSettingsDto>(APPEARANCE_PATH);
    return toAppearanceFormValues(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

export async function updateAppearanceSettings(
  values: AppearanceSettingsFormValues,
): Promise<AppearanceSettingsFormValues> {
  const { data } = await api.put<AppearanceSettingsDto>(
    APPEARANCE_PATH,
    toAppearancePayload(values),
  );
  return toAppearanceFormValues(data);
}
