import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useIsMobile } from "@/hooks/use-media-query";
import { overlayVariants, panelVariants, sheetVariants } from "@/lib/motion";
import { cn } from "@/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Largura máxima do diálogo (desktop). No mobile vira bottom sheet. */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useFocusTrap(panelRef, open);

  // Fecha no Escape e trava o scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-modal flex justify-center",
            isMobile ? "items-end" : "items-center p-4",
          )}
        >
          <m.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 bg-graphite-950/50"
            onClick={onClose}
            aria-hidden
          />
          <m.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            variants={isMobile ? sheetVariants : panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              // `relative` garante que o painel pinte acima do backdrop mesmo
              // depois que o Framer remove o transform ao fim da animação.
              "relative flex w-full flex-col bg-surface shadow-elevated outline-none",
              isMobile
                ? "max-h-[92vh] rounded-t-2xl border-t border-line"
                : cn("max-h-[85vh] rounded-2xl border border-line", sizes[size]),
            )}
          >
            {/* Alça do bottom sheet (mobile). */}
            {isMobile && (
              <div className="flex justify-center pt-2" aria-hidden>
                <span className="h-1 w-9 rounded-full bg-graphite-200" />
              </div>
            )}

            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h3 id={titleId} className="text-sm font-semibold tracking-tight text-ink">
                  {title}
                </h3>
                {description && (
                  <p id={descId} className="mt-0.5 text-xs text-ink-mute">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="-mr-1 shrink-0 rounded-lg p-1.5 text-ink-mute transition-colors hover:bg-graphite-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-ink-soft">
              {children}
            </div>

            {footer && (
              <div className="flex shrink-0 justify-end gap-2 border-t border-line px-5 py-4">
                {footer}
              </div>
            )}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
