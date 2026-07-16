import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { EASE } from "@/lib/motion";

interface AnimatedNumberProps {
  value: number;
  /** Formata o número em cada frame (padrão: inteiro). */
  format?: (n: number) => string;
  /** Duração da contagem, em segundos. */
  duration?: number;
  className?: string;
}

/**
 * Contador animado: interpola do valor anterior até o novo com a curva do
 * design system. Se o usuário pediu menos movimento, mostra o valor final
 * imediatamente (sem contagem).
 */
export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  duration = 0.6,
  className,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const from = useRef(0);
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    if (reduce) {
      setDisplay(format(value));
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(format(v)),
      onComplete: () => {
        from.current = value;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <span className={className} aria-label={format(value)}>
      {display}
    </span>
  );
}
