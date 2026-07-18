import { useEffect } from "react";

import { applyAppearance, useAppearanceStore } from "@/stores/appearance-store";

/**
 * Mantém o <html> sincronizado com as preferências de aparência e reage a
 * mudanças do tema do sistema quando o modo "system" está ativo. Não renderiza
 * nada — é só o efeito colateral no documento.
 */
export function ThemeManager() {
  const theme = useAppearanceStore((s) => s.theme);
  const density = useAppearanceStore((s) => s.density);
  const language = useAppearanceStore((s) => s.language);
  const highContrast = useAppearanceStore((s) => s.preferences.highContrast);
  const reducedMotion = useAppearanceStore((s) => s.preferences.reducedMotion);

  // Reaplica sempre que qualquer preferência muda (cobre o boot também).
  useEffect(() => {
    applyAppearance({
      theme,
      density,
      language,
      preferences: useAppearanceStore.getState().preferences,
    });
  }, [theme, density, language, highContrast, reducedMotion]);

  // Segue o tema do sistema em tempo real quando "system" está selecionado.
  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      document.documentElement.setAttribute(
        "data-theme",
        media.matches ? "dark" : "light",
      );
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return null;
}
