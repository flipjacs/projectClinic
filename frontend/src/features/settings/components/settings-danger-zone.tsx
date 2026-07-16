import { TriangleAlert } from "lucide-react";
import { useId, useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";

export interface DangerAction {
  key: string;
  label: string;
  description: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  /** Sem handler = ação planejada: confirma e avisa que chega em breve. */
  onConfirm?: () => void;
}

/**
 * Zona de risco das páginas de Configurações. Toda ação aqui é destrutiva ou
 * de alto impacto: o visual é inconfundível (vermelho, isolado do resto) e a
 * execução SEMPRE passa por um diálogo de confirmação — inclusive as ações
 * ainda não implementadas.
 */
export function SettingsDangerZone({
  description = "Ações de alto impacto. Cada uma exige confirmação antes de executar.",
  actions,
}: {
  description?: string;
  actions: DangerAction[];
}) {
  const headingId = useId();
  const [pending, setPending] = useState<DangerAction | null>(null);

  function handleConfirm() {
    if (!pending) return;
    if (pending.onConfirm) pending.onConfirm();
    else toast.info("Esta ação estará disponível em uma próxima fase.");
    setPending(null);
  }

  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4 text-danger-600" aria-hidden />
        <h2 id={headingId} className="text-sm font-semibold tracking-tight text-danger-700">
          Zona de risco
        </h2>
      </div>
      <p className="mt-1 text-sm text-ink-mute">{description}</p>

      <div className="mt-3 divide-y divide-danger-100 rounded-2xl border border-danger-200 bg-white shadow-card">
        {actions.map((action) => (
          <div
            key={action.key}
            className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{action.label}</p>
              <p className="mt-0.5 text-sm text-ink-mute">{action.description}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPending(action)}
              className="shrink-0 border-danger-200 text-danger-700 hover:bg-danger-50 active:bg-danger-100"
            >
              {action.buttonLabel}
            </Button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pending !== null}
        tone="danger"
        title={pending?.confirmTitle ?? ""}
        message={pending?.confirmMessage ?? ""}
        confirmLabel={pending?.buttonLabel}
        onConfirm={handleConfirm}
        onClose={() => setPending(null)}
      />
    </section>
  );
}
