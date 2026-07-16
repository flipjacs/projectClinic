import { AnimatePresence, m } from "framer-motion";
import { CircleDot } from "lucide-react";
import { useFormContext, useFormState } from "react-hook-form";

import { EASE } from "@/lib/motion";
import type { ClinicSettingsFormValues } from "../../schemas/clinic-schema";
import { SaveActionsBar } from "./save-actions-bar";

/**
 * Banner de alterações pendentes. Aparece grudado ao rodapé da área de
 * conteúdo assim que qualquer campo muda e some após salvar/descartar.
 * Só ele assina o formState — o resto do formulário não re-renderiza.
 */
export function UnsavedChangesBanner() {
  const { control } = useFormContext<ClinicSettingsFormValues>();
  const { isDirty } = useFormState({ control });

  return (
    <div className="pointer-events-none sticky bottom-4 z-sticky">
      <AnimatePresence>
        {isDirty && (
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } }}
            exit={{ opacity: 0, y: 12, transition: { duration: 0.16, ease: EASE } }}
            role="status"
            className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-elevated backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="inline-flex items-center gap-2 text-sm font-medium text-ink">
              <CircleDot className="h-4 w-4 text-gold-600" aria-hidden />
              Você possui alterações não salvas.
            </span>
            <SaveActionsBar />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
