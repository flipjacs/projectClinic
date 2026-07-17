import { z } from "zod";

/**
 * Contrato do formulário Configurações → Aparência. Preferências por usuário;
 * tema escuro e idiomas extras já fazem parte do contrato, mesmo antes de o
 * produto suportá-los (as opções aparecem com o estado real de cada uma).
 */

export const THEMES = ["light", "dark", "system"] as const;
export const DENSITIES = ["compact", "comfortable", "spacious"] as const;
export const LANGUAGES = ["pt-BR", "en", "es"] as const;

export const appearanceSettingsSchema = z.object({
  theme: z.enum(THEMES),
  density: z.enum(DENSITIES),
  language: z.enum(LANGUAGES),
  preferences: z.object({
    reducedMotion: z.boolean(),
    highContrast: z.boolean(),
    confirmCriticalActions: z.boolean(),
    autoSaveFilters: z.boolean(),
    reopenLastPage: z.boolean(),
  }),
});

export type AppearanceSettingsFormValues = z.infer<typeof appearanceSettingsSchema>;

export function defaultAppearanceSettings(): AppearanceSettingsFormValues {
  return {
    theme: "light",
    density: "comfortable",
    language: "pt-BR",
    preferences: {
      reducedMotion: false,
      highContrast: false,
      confirmCriticalActions: true,
      autoSaveFilters: true,
      reopenLastPage: false,
    },
  };
}
