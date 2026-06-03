import { XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/utils/currency";
import { formatDate } from "@/utils/format";
import { PAYMENT_METHOD_LABELS } from "../constants";
import type { Payment } from "../types/finance";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentsTableProps {
  payments: Payment[];
  /** Mostra a ação de cancelar (apenas perfis clínicos). */
  canCancel?: boolean;
  onCancel?: (payment: Payment) => void;
  /** Esconde a coluna de paciente (ex.: dentro do detalhe de um orçamento). */
  hidePatient?: boolean;
}

export function PaymentsTable({
  payments,
  canCancel,
  onCancel,
  hidePatient,
}: PaymentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-graphite-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            {!hidePatient && <th className="px-5 py-3">Paciente</th>}
            <th className="px-5 py-3">Valor</th>
            <th className="hidden px-5 py-3 sm:table-cell">Forma</th>
            <th className="px-5 py-3">Status</th>
            <th className="hidden px-5 py-3 sm:table-cell">Data</th>
            {canCancel && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payments.map((p) => (
            <tr key={p.id} className="text-sm">
              {!hidePatient && (
                <td className="px-5 py-3 font-medium text-ink">{p.patient.name}</td>
              )}
              <td className="whitespace-nowrap px-5 py-3 font-medium text-ink">
                {formatMoney(p.amount)}
              </td>
              <td className="hidden whitespace-nowrap px-5 py-3 text-ink-soft sm:table-cell">
                {PAYMENT_METHOD_LABELS[p.payment_method]}
              </td>
              <td className="px-5 py-3">
                <PaymentStatusBadge status={p.status} />
              </td>
              <td className="hidden whitespace-nowrap px-5 py-3 text-ink-mute sm:table-cell">
                {formatDate(p.paid_at ?? p.created_at)}
              </td>
              {canCancel && (
                <td className="px-5 py-3 text-right">
                  {p.status !== "canceled" && onCancel && (
                    <Button variant="ghost" size="sm" onClick={() => onCancel(p)}>
                      <XCircle className="h-4 w-4" />
                      Cancelar
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
