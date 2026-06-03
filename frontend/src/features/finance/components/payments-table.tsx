import { Pencil, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/utils/currency";
import { formatDate } from "@/utils/format";
import { PAYMENT_METHOD_LABELS, PAYMENT_TRANSITIONS } from "../constants";
import type { Payment } from "../types/finance";
import { PaymentStatusBadge } from "./payment-status-badge";

interface PaymentsTableProps {
  payments: Payment[];
  /** Mostra as ações clínicas (alterar status / cancelar). */
  canCancel?: boolean;
  onCancel?: (payment: Payment) => void;
  /** Habilita a ação de alterar status (apenas perfis clínicos). */
  onChangeStatus?: (payment: Payment) => void;
  /** Habilita a ação de editar (forma/datas/observações — apenas clínicos). */
  onEdit?: (payment: Payment) => void;
  /** Esconde a coluna de paciente (ex.: dentro do detalhe de um orçamento). */
  hidePatient?: boolean;
}

export function PaymentsTable({
  payments,
  canCancel,
  onCancel,
  onChangeStatus,
  onEdit,
  hidePatient,
}: PaymentsTableProps) {
  const hasActions = Boolean(canCancel || onChangeStatus || onEdit);
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
            {hasActions && <th className="px-5 py-3" />}
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
              {hasActions && (
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && p.status !== "canceled" && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                        <Pencil className="h-4 w-4" />
                        Editar
                      </Button>
                    )}
                    {onChangeStatus && PAYMENT_TRANSITIONS[p.status].length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => onChangeStatus(p)}>
                        <RefreshCw className="h-4 w-4" />
                        Status
                      </Button>
                    )}
                    {canCancel && p.status !== "canceled" && onCancel && (
                      <Button variant="ghost" size="sm" onClick={() => onCancel(p)}>
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
