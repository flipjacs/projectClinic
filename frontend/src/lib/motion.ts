import type { Transition, Variants } from "framer-motion";

/**
 * Fundação de motion do OdontoPrime. Curvas e durações alinhadas ao design
 * system (mesmo `out-quint` do CSS). Discreto por princípio: entradas curtas,
 * saídas ainda mais curtas. O respeito a `prefers-reduced-motion` é global via
 * `<MotionConfig reducedMotion="user">` — aqui não precisamos repetir.
 */

/** Curva padrão (out-quint) — a mesma usada nas transições CSS. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Spring suave para toques/press (sem overshoot exagerado). */
export const SOFT_SPRING: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 0.7,
};

/** Transição de página: fade + leve deslize vertical. */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE } },
};

/** Backdrop de overlays (modal/paleta). */
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE } },
};

/** Painel de diálogos: escala + leve subida. */
export const panelVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: EASE } },
  exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.13, ease: EASE } },
};

/** Item que chega de baixo (toasts, notificações). */
export const toastVariants: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.24, ease: EASE } },
  exit: { opacity: 0, x: 16, scale: 0.98, transition: { duration: 0.16, ease: EASE } },
};
