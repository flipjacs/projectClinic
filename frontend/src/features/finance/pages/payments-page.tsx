import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PatientSelect } from "@/features/appointments/components/patient-select";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_ORDER, financeErrorMessage } from "../constants";
import { CancelReasonDialog } from "../components/cancel-reason-dialog";
import { ChangePaymentStatusDialog } from "../components/change-payment-status-dialog";
import { EditPaymentDialog } from "../components/edit-payment-dialog";
import { PaymentsTable } from "../components/payments-table";
import { useCancelPayment, usePayments } from "../hooks/use-finance";
import type { Payment, PaymentStatus } from "../types/finance";

const PAGE_SIZE = 20;
const statusOptions = [
  { value: "", label: "Todos" },
  ...PAYMENT_STATUS_ORDER.map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] })),
];

export function PaymentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCancel = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<Payment | null>(null);
  const [statusTarget, setStatusTarget] = useState<Payment | null>(null);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);

  const cancelMutation = useCancelPayment(cancelTarget?.id ?? 0);

  const params = useMemo(
    () => ({
      status: status || undefined,
      patientId: patientId ?? undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [status, patientId, page],
  );

  const { data, isLoading, isError, isFetching, refetch } = usePayments(params);
  const totalPages = data?.meta.total_pages ?? 0;

  async function confirmCancel(reason: string | null) {
    try {
      await cancelMutation.mutateAsync(reason);
      toast.success("Pagamento cancelado com sucesso.");
      setCancelTarget(null);
    } catch (error) {
      toast.error(financeErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Registro e acompanhamento dos pagamentos da clínica."
        actions={
          <Button onClick={() => navigate("/payments/new")}>
            <Plus className="h-4 w-4" />
            Registrar pagamento
          </Button>
        }
      />

      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as PaymentStatus | "");
                setPage(1);
              }}
            />
            <PatientSelect
              label="Paciente"
              value={patientId}
              onChange={(p) => {
                setPatientId(p?.id ?? null);
                setPage(1);
              }}
            />
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Nenhum pagamento encontrado"
          description="Ajuste os filtros ou registre um novo pagamento."
        />
      ) : (
        <>
          <PaymentsTable
            payments={data.items}
            canCancel={canCancel}
            onCancel={setCancelTarget}
            onChangeStatus={canCancel ? setStatusTarget : undefined}
            onEdit={canCancel ? setEditTarget : undefined}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-ink-mute">
            <span>
              {data.meta.total} pagamento(s){isFetching ? " · atualizando…" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="px-1">
                  {page} / {Math.max(totalPages, 1)}
                </span>
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
          </div>
        </>
      )}

      {cancelTarget && (
        <CancelReasonDialog
          title="Cancelar pagamento"
          description={`${cancelTarget.patient.name} · ${cancelTarget.id}`}
          confirmLabel="Cancelar pagamento"
          isLoading={cancelMutation.isPending}
          onConfirm={confirmCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {statusTarget && (
        <ChangePaymentStatusDialog
          payment={statusTarget}
          onClose={() => setStatusTarget(null)}
        />
      )}

      {editTarget && (
        <EditPaymentDialog payment={editTarget} onClose={() => setEditTarget(null)} />
      )}
    </>
  );
}
