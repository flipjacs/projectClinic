import { formatMoney } from "@/utils/currency";
import { formatDate } from "@/utils/format";
import type { Payment } from "../types/finance";
import { PaymentActions } from "./payment-actions";
import { PaymentMethodBadge } from "./payment-method-badge";
import { PaymentMobileCard } from "./payment-mobile-card";
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
  const hasActionsColumn = Boolean(canCancel || onChangeStatus || onEdit);

  return (
    <>
      {/* Desktop: tabela */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-card sm:block">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface-muted">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              {!hidePatient && <th className="px-5 py-3">Paciente</th>}
              <th className="px-5 py-3">Valor</th>
              <th className="px-5 py-3">Forma</th>
              <th className="px-5 py-3">Status</th>
              <th className="hidden px-5 py-3 lg:table-cell">Data</th>
              {hasActionsColumn && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {payments.map((p) => (
              <tr key={p.id} className="text-sm transition-colors hover:bg-gold-50/40">
                {!hidePatient && (
                  <td className="px-5 py-3 font-medium text-ink">{p.patient.name}</td>
                )}
                <td className="whitespace-nowrap px-5 py-3 font-semibold text-ink">
                  {formatMoney(p.amount)}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <PaymentMethodBadge method={p.payment_method} />
                </td>
                <td className="px-5 py-3">
                  <PaymentStatusBadge status={p.status} />
                </td>
                <td className="hidden whitespace-nowrap px-5 py-3 text-ink-mute lg:table-cell">
                  {formatDate(p.paid_at ?? p.created_at)}
                </td>
                {hasActionsColumn && (
                  <td className="px-5 py-3">
                    <PaymentActions
                      payment={p}
                      canCancel={canCancel}
                      onCancel={onCancel}
                      onChangeStatus={onChangeStatus}
                      onEdit={onEdit}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {payments.map((p) => (
          <PaymentMobileCard
            key={p.id}
            payment={p}
            hidePatient={hidePatient}
            canCancel={canCancel}
            onCancel={onCancel}
            onChangeStatus={onChangeStatus}
            onEdit={onEdit}
          />
        ))}
      </div>
    </>
  );
}
