import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/stores/toast-store";

export interface DangerAction {
  key: string;
  label: string;
  description: string;
  buttonLabel: string;
  confirmTitle: string;
  confirmMessage: string;
  /**
   * Confirmação dupla: além do diálogo, exige marcar a caixa de
   * reconhecimento antes de habilitar o botão destrutivo.
   */
  doubleConfirm?: boolean;
  /** Estado de carregamento da ação (mutation em andamento). */
  isLoading?: boolean;
  /** Sem handler = ação planejada: confirma e avisa que chega em breve. */
  onConfirm?: () => void;
}

/**
 * Zona de risco das páginas de Configurações. Toda ação aqui é destrutiva ou
 * de alto impacto: o visual é inconfundível (vermelho, isolado do resto) e a
 * execução SEMPRE passa por um diálogo de confirmação — com reconhecimento
 * explícito extra quando a ação é irreversível (`doubleConfirm`).
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
  const [acknowledged, setAcknowledged] = useState(false);

  // Cada abertura de diálogo começa com o reconhecimento desmarcado.
  useEffect(() => {
    if (pending) setAcknowledged(false);
  }, [pending]);

  function handleConfirm() {
    if (!pending) return;
    if (pending.onConfirm) pending.onConfirm();
    else toast.info("Esta ação estará disponível em uma próxima fase.");
    setPending(null);
  }

  const confirmBlocked = Boolean(pending?.doubleConfirm) && !acknowledged;

  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4 text-danger-600" aria-hidden />
        <h2 id={headingId} className="text-sm font-semibold tracking-tight text-danger-700">
          Zona de risco
        </h2>
      </div>
      <p className="mt-1 text-sm text-ink-mute">{description}</p>

      <div className="mt-3 divide-y divide-danger-100 rounded-2xl border border-danger-200 bg-surface shadow-card">
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
              isLoading={action.isLoading}
              className="shrink-0 border-danger-200 text-danger-700 hover:bg-danger-50 active:bg-danger-100"
            >
              {action.buttonLabel}
            </Button>
          </div>
        ))}
      </div>

      {pending && (
        <Modal
          open
          onClose={() => setPending(null)}
          title={pending.confirmTitle}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPending(null)}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleConfirm} disabled={confirmBlocked}>
                {pending.buttonLabel}
              </Button>
            </>
          }
        >
          <p>{pending.confirmMessage}</p>
          {pending.doubleConfirm && (
            <Checkbox
              className="mt-4"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              label="Entendo as consequências desta ação"
              description="Esta operação não pode ser desfeita pelo sistema."
            />
          )}
        </Modal>
      )}
    </section>
  );
}
