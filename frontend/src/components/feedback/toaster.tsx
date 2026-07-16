import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { toastVariants } from "@/lib/motion";
import { useToastStore, type ToastTone } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

const toneStyles: Record<ToastTone, string> = {
  success: "border-success-200 bg-success-50 text-success-800",
  error: "border-danger-200 bg-danger-50 text-danger-700",
  info: "border-gold-200 bg-gold-50 text-gold-800",
};

const toneIcon = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = toneIcon[t.tone];
          return (
            <m.div
              key={t.id}
              layout
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-elevated",
                toneStyles[t.tone],
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar aviso"
                className="rounded-md p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <X className="h-4 w-4" />
              </button>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
