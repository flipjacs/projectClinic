import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Guarda de alterações não salvas:
 * - bloqueia navegações internas (react-router) e devolve o blocker para a UI
 *   decidir (salvar / descartar / cancelar) num diálogo próprio;
 * - avisa no fechamento/refresh da aba via `beforeunload` (aí o diálogo é o
 *   nativo do navegador — o único permitido nesse evento).
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Exigido por navegadores antigos para exibir o aviso.
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  return blocker;
}
