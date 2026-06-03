import { Pencil, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PAYMENT_TRANSITIONS } from "../constants";
import type { Payment } from "../types/finance";

export interface PaymentActionsProps {
  payment: Payment;
  /** Mostra a ação de cancelar (apenas perfis clínicos). */
  canCancel?: boolean;
  onCancel?: (payment: Payment) => void;
  /** Habilita a ação de alterar status. */
  onChangeStatus?: (payment: Payment) => void;
  /** Habilita a ação de editar (forma/datas/observações). */
  onEdit?: (payment: Payment) => void;
}

/** Indica se há ao menos uma ação disponível para o pagamento. */
export function hasPaymentActions({
  payment,
  canCancel,
  onChangeStatus,
  onEdit,
}: PaymentActionsProps): boolean {
  const canEdit = Boolean(onEdit) && payment.status !== "canceled";
  const canChange = Boolean(onChangeStatus) && PAYMENT_TRANSITIONS[payment.status].length > 0;
  const canDoCancel = Boolean(canCancel) && payment.status !== "canceled";
  return canEdit || canChange || canDoCancel;
}

/** Botões de ação de um pagamento (editar / alterar status / cancelar). */
export function PaymentActions({
  payment,
  canCancel,
  onCancel,
  onChangeStatus,
  onEdit,
}: PaymentActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && payment.status !== "canceled" && (
        <Button variant="ghost" size="sm" onClick={() => onEdit(payment)}>
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      )}
      {onChangeStatus && PAYMENT_TRANSITIONS[payment.status].length > 0 && (
        <Button variant="ghost" size="sm" onClick={() => onChangeStatus(payment)}>
          <RefreshCw className="h-4 w-4" />
          Status
        </Button>
      )}
      {canCancel && payment.status !== "canceled" && onCancel && (
        <Button variant="ghost" size="sm" onClick={() => onCancel(payment)}>
          <XCircle className="h-4 w-4" />
          Cancelar
        </Button>
      )}
    </div>
  );
}
