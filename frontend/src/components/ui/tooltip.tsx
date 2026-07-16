import {
  cloneElement,
  useCallback,
  useId,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/utils/cn";

interface TooltipProps {
  label: string;
  /** Elemento gatilho (deve encaminhar eventos de mouse/foco). */
  children: ReactElement;
  side?: "top" | "bottom";
  /** Atraso para exibir, em ms. */
  delay?: number;
}

interface Coords {
  left: number;
  top: number;
}

/**
 * Tooltip da marca via portal (posição fixed) — nunca é recortado por
 * containers com `overflow: hidden` (tabelas, cards). Aparece no hover e no
 * foco por teclado; some no blur, no scroll e no Escape. O nome acessível
 * continua vindo do próprio gatilho (ex.: `aria-label`); a bolha é visual.
 */
export function Tooltip({ label, children, side = "top", delay = 150 }: TooltipProps) {
  const id = useId();
  const timer = useRef<number>();
  const triggerRef = useRef<HTMLElement | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);

  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const r = el.getBoundingClientRect();
      const left = r.left + r.width / 2;
      const top = side === "top" ? r.top - 8 : r.bottom + 8;
      setCoords({ left, top });
    }, delay);
  }, [delay, side]);

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setCoords(null);
  }, []);

  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      const { ref } = children as unknown as { ref?: unknown };
      if (typeof ref === "function") ref(node);
      else if (ref && typeof ref === "object") (ref as { current: unknown }).current = node;
    },
    "aria-describedby": coords ? id : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") hide();
      (children.props as { onKeyDown?: (e: React.KeyboardEvent) => void }).onKeyDown?.(e);
    },
  });

  return (
    <>
      {trigger}
      {coords &&
        createPortal(
          <span
            role="tooltip"
            id={id}
            className={cn(
              "pointer-events-none fixed z-tooltip -translate-x-1/2 animate-fade-in rounded-md bg-graphite-900 px-2 py-1 text-xs font-medium text-white shadow-elevated",
              side === "top" ? "-translate-y-full" : "",
            )}
            style={{ left: coords.left, top: coords.top }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  );
}
