import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Prende o foco do teclado dentro de `ref` enquanto `active` for verdadeiro
 * (diálogos, sheets, drawer). Ao ativar, foca o container se o foco ainda não
 * estiver dentro (respeitando `autoFocus`); ao desativar, devolve o foco ao
 * elemento que estava focado antes de abrir. Essencial para teclado + leitores
 * de tela: sem isso, o Tab vaza para a página atrás do overlay.
 */
export function useFocusTrap<T extends HTMLElement>(ref: RefObject<T>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Só rouba o foco se nada dentro já estiver focado (ex.: campo com autoFocus).
    if (!container.contains(document.activeElement)) {
      container.focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || !container) return;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        e.preventDefault();
        container.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const activeEl = document.activeElement;
      if (e.shiftKey && (activeEl === first || activeEl === container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      // Devolve o foco a quem abriu (se ainda existir no DOM).
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
    };
  }, [active, ref]);
}
