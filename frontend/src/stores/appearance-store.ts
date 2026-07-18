import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Preferências de aparência do usuário. Fonte de verdade LOCAL (localStorage) —
 * sobrevive a refresh e independe do backend. Quando o backend existir, basta
 * hidratar este store a partir da API; a UI e a aplicação ao DOM não mudam.
 */

export type Theme = "light" | "dark" | "system";
export type Density = "compact" | "comfortable" | "spacious";
export type Language = "pt-BR" | "en" | "es";

export interface AppearancePreferences {
  reducedMotion: boolean;
  highContrast: boolean;
  confirmCriticalActions: boolean;
  autoSaveFilters: boolean;
  reopenLastPage: boolean;
}

/** Apenas os dados (sem as ações) — o payload de aparência. */
export type AppearanceValues = Pick<
  AppearanceState,
  "theme" | "density" | "language" | "preferences"
>;

export interface AppearanceState {
  theme: Theme;
  density: Density;
  language: Language;
  preferences: AppearancePreferences;
  /** Substitui todos os valores COM transição suave (save do usuário). */
  setAll: (next: AppearanceValues) => void;
  /**
   * Hidrata do backend SEM transição (carga inicial / sincronização). É a
   * origem de verdade externa; o localStorage fica só como cache anti-flicker.
   */
  hydrate: (next: AppearanceValues) => void;
}

export const DEFAULT_APPEARANCE: AppearanceValues = {
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

/** Tema efetivo (resolve "system" pelo prefers-color-scheme). */
export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/**
 * Aplica as preferências ao <html> via data-attributes. O CSS (index.css) faz
 * o resto: tokens de cor, densidade (font-size), contraste e transição.
 */
export function applyAppearance(state: AppearanceValues): void {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolveTheme(state.theme));
  root.setAttribute("data-density", state.density);
  root.setAttribute("data-contrast", state.preferences.highContrast ? "high" : "normal");
  root.setAttribute("data-motion", state.preferences.reducedMotion ? "reduced" : "full");
  root.setAttribute("lang", state.language);
}

/** Transição suave: liga a classe por ~300ms durante a troca. */
function withThemeTransition(fn: () => void): void {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  fn();
  window.setTimeout(() => root.classList.remove("theme-transition"), 320);
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      ...DEFAULT_APPEARANCE,
      setAll: (next) =>
        withThemeTransition(() => {
          applyAppearance(next);
          set(next);
        }),
      hydrate: (next) => {
        applyAppearance(next);
        set(next);
      },
    }),
    {
      name: "clinic.appearance",
      partialize: (s) => ({
        theme: s.theme,
        density: s.density,
        language: s.language,
        preferences: s.preferences,
      }),
      onRehydrateStorage: () => (state) => {
        // Aplica assim que o valor salvo é recarregado (sem transição no boot).
        if (state) applyAppearance(state);
      },
    },
  ),
);
