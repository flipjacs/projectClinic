import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/stores/toast-store";
import { formatMoney } from "@/utils/currency";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_TRANSITIONS,
  financeErrorMessage,
} from "../constants";
import { useChangePaymentStatus } from "../hooks/use-finance";
import { PaymentStatusBadge } from "./payment-status-badge";
import type { Payment } from "../types/finance";

interface ChangePaymentStatusDialogProps {
  payment: Payment;
  onClose: () => void;
}

/** Diálogo para avançar o status de um pagamento (transições válidas do backend). */
export function ChangePaymentStatusDialog({
  payment,
  onClose,
}: ChangePaymentStatusDialogProps) {
  const changeStatus = useChangePaymentStatus(payment.id);
  const transitions = PAYMENT_TRANSITIONS[payment.status];

  async function apply(status: (typeof transitions)[number]) {
    try {
      await changeStatus.mutateAsync(status);
      toast.success(`Status alterado para "${PAYMENT_STATUS_LABELS[status]}".`);
      onClose();
    } catch (error) {
      toast.error(financeErrorMessage(error));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Alterar status do pagamento"
      description={`${payment.patient.name} · ${formatMoney(payment.amount)}`}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-ink-mute">
          Status atual:
          <PaymentStatusBadge status={payment.status} />
        </div>

        {transitions.length === 0 ? (
          <p className="text-sm text-ink-mute">
            Este pagamento não permite mais mudança de status. Para encerrá-lo, use
            a opção de cancelar.
          </p>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Mudar para:</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  onClick={() => apply(status)}
                  isLoading={changeStatus.isPending}
                >
                  {PAYMENT_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end border-t border-line pt-4">
          <Button variant="secondary" onClick={onClose} disabled={changeStatus.isPending}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
