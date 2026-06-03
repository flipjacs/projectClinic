import { Ban, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDateOnly, formatDateTime } from "@/utils/format";
import { formatMoney } from "@/utils/currency";
import type { Payment, PaymentStatus } from "../types/finance";
import {
  PAYMENT_METHOD_LABELS,
  PaymentStatusBadge,
} from "./payment-status-badge";

interface PaymentsTableProps {
  payments: Payment[];
  canManage?: boolean;
  onStatusChange?: (payment: Payment, status: PaymentStatus) => void;
  onCancel?: (payment: Payment) => void;
}

export function PaymentsTable({
  payments,
  canManage,
  onStatusChange,
  onCancel,
}: PaymentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-graphite-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            <th className="px-5 py-3">Pagamento</th>
            <th className="px-5 py-3">Paciente</th>
            <th className="px-5 py-3">Valor</th>
            <th className="hidden px-5 py-3 md:table-cell">Forma</th>
            <th className="px-5 py-3">Status</th>
            {canManage && <th className="px-5 py-3 text-right">Ações</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payments.map((payment) => {
            const canMarkPaid =
              canManage && payment.status !== "paid" && payment.status !== "canceled";
            const canCancel = canManage && payment.status !== "canceled";

            return (
              <tr key={payment.id} className="text-sm">
                <td className="whitespace-nowrap px-5 py-3">
                  <p className="font-semibold text-ink">#{payment.id}</p>
                  <p className="text-xs text-ink-mute">
                    {payment.paid_at
                      ? formatDateTime(payment.paid_at)
                      : payment.due_date
                        ? `Vence em ${formatDateOnly(payment.due_date)}`
                        : formatDateOnly(payment.created_at)}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{payment.patient.name}</p>
                  {payment.budget_id && (
                    <p className="text-xs text-ink-mute">Orçamento #{payment.budget_id}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-semibold text-ink">
                  {formatMoney(payment.amount)}
                </td>
                <td className="hidden px-5 py-3 text-ink-soft md:table-cell">
                  {PAYMENT_METHOD_LABELS[payment.payment_method]}
                </td>
                <td className="px-5 py-3">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                {canManage && (
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {canMarkPaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStatusChange?.(payment, "paid")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Marcar pago
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onCancel?.(payment)}
                        >
                          <Ban className="h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
