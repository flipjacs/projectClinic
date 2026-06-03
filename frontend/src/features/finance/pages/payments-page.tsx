import { Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { PaymentsTable } from "../components/payments-table";
import { PAYMENT_STATUS_LABELS } from "../components/payment-status-badge";
import {
  useCancelPayment,
  useChangePaymentStatus,
  usePayments,
} from "../hooks/use-finance";
import type { Payment, PaymentStatus } from "../types/finance";

const PAGE_SIZE = 20;

export function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [statusTarget, setStatusTarget] = useState<Payment | null>(null);
  const [nextStatus, setNextStatus] = useState<PaymentStatus>("paid");

  const query = usePayments({ status, page, pageSize: PAGE_SIZE });
  const changeStatus = useChangePaymentStatus(statusTarget?.id ?? 0);
  const cancelPayment = useCancelPayment(cancelTarget?.id ?? 0);
  const totalPages = query.data?.meta.total_pages ?? 0;

  async function applyStatus() {
    if (!statusTarget) return;
    try {
      await changeStatus.mutateAsync({
        status: nextStatus,
        paidAt: nextStatus === "paid" ? new Date().toISOString() : null,
      });
      toast.success("Status do pagamento atualizado.");
      setStatusTarget(null);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function cancelSelectedPayment() {
    if (!cancelTarget) return;
    try {
      await cancelPayment.mutateAsync(cancelReason || null);
      toast.success("Pagamento cancelado.");
      setCancelTarget(null);
      setCancelReason("");
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Registros recebidos, pendentes e cancelados."
        actions={
          <Button onClick={() => navigate("/payments/new")}>
            <Plus className="h-4 w-4" />
            Registrar pagamento
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Select
          label="Status"
          options={[
            { value: "", label: "Todos" },
            ...(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map((s) => ({
              value: s,
              label: PAYMENT_STATUS_LABELS[s],
            })),
          ]}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as PaymentStatus | "");
            setPage(1);
          }}
        />
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={toApiError(query.error).message} onRetry={() => query.refetch()} />
      ) : !query.data || query.data.items.length === 0 ? (
        <EmptyState
          title="Nenhum pagamento encontrado"
          description="Registre um pagamento recebido ou pendente."
          action={
            <Button onClick={() => navigate("/payments/new")}>
              <Plus className="h-4 w-4" />
              Registrar pagamento
            </Button>
          }
        />
      ) : (
        <>
          <PaymentsTable
            payments={query.data.items}
            canManage={canManage}
            onStatusChange={(payment, next) => {
              setStatusTarget(payment);
              setNextStatus(next);
            }}
            onCancel={setCancelTarget}
          />
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2 text-sm text-ink-mute">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span>{page} / {totalPages}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(statusTarget)}
        onClose={() => setStatusTarget(null)}
        title="Atualizar pagamento"
        description="Confirme a mudança de status financeiro."
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusTarget(null)} disabled={changeStatus.isPending}>
              Voltar
            </Button>
            <Button onClick={applyStatus} isLoading={changeStatus.isPending}>
              Confirmar
            </Button>
          </>
        }
      >
        Marcar pagamento #{statusTarget?.id} como {PAYMENT_STATUS_LABELS[nextStatus]}?
      </Modal>

      <Modal open={Boolean(cancelTarget)} onClose={() => setCancelTarget(null)} title="Cancelar pagamento">
        <div className="space-y-4">
          <Textarea
            label="Motivo do cancelamento (opcional)"
            rows={3}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCancelTarget(null)} disabled={cancelPayment.isPending}>
              Voltar
            </Button>
            <Button variant="danger" onClick={cancelSelectedPayment} isLoading={cancelPayment.isPending}>
              Cancelar pagamento
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
