import { formatMoney } from "@/utils/currency";
import { formatDate } from "@/utils/format";
import { PaymentActions, hasPaymentActions, type PaymentActionsProps } from "./payment-actions";
import { PaymentMethodBadge } from "./payment-method-badge";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentMobileCardProps extends PaymentActionsProps {
  hidePatient?: boolean;
}

/** Card de pagamento para telas pequenas (substitui a tabela no mobile). */
export function PaymentMobileCard({ hidePatient, ...actionProps }: PaymentMobileCardProps) {
  const { payment } = actionProps;
  const showActions = hasPaymentActions(actionProps);

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {!hidePatient && (
            <p className="truncate font-medium text-ink">{payment.patient.name}</p>
          )}
          <p className="mt-0.5 text-xs text-ink-mute">
            {formatDate(payment.paid_at ?? payment.created_at)}
          </p>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-lg font-semibold tracking-tight text-ink">
          {formatMoney(payment.amount)}
        </span>
        <PaymentMethodBadge method={payment.payment_method} />
      </div>

      {showActions && (
        <div className="mt-3 border-t border-line pt-3">
          <PaymentActions {...actionProps} />
        </div>
      )}
    </div>
  );
}
