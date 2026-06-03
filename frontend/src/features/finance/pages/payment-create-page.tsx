import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { PaymentForm } from "../components/payment-form";
import { useBudget, useCreatePayment } from "../hooks/use-finance";
import type { PaymentFormValues } from "../schemas/finance-schema";

function paymentErrorMessage(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.status === 422) {
    return "Este pagamento ultrapassa o valor do orçamento ou possui dados inválidos.";
  }
  if (apiError.status === 403) return "Você não tem permissão para registrar este pagamento.";
  return apiError.message;
}

export function PaymentCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const budgetId = Number(searchParams.get("budgetId") ?? 0);
  const budgetQuery = useBudget(budgetId);
  const createMutation = useCreatePayment();

  async function handleSubmit(values: PaymentFormValues) {
    try {
      await createMutation.mutateAsync({
        patient_id: values.patient_id,
        budget_id: values.budget_id || null,
        amount: values.amount,
        payment_method: values.payment_method,
        status: values.status,
        paid_at: values.paid_at_date || null,
        due_date: values.due_date || null,
        notes: values.notes || null,
      });
      toast.success("Pagamento registrado.");
      navigate(values.budget_id ? `/budgets/${values.budget_id}` : "/payments", { replace: true });
    } catch (error) {
      toast.error(paymentErrorMessage(error));
    }
  }

  if (budgetId > 0 && budgetQuery.isLoading) {
    return <Loading fullPage label="Carregando orçamento…" />;
  }

  if (budgetId > 0 && budgetQuery.isError) {
    return (
      <>
        <PageHeader title="Registrar pagamento" />
        <ErrorState message={toApiError(budgetQuery.error).message} onRetry={() => budgetQuery.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Registrar pagamento"
        description="Informe o valor recebido e vincule ao orçamento quando aplicável."
        actions={
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      />
      <PaymentForm
        initialBudget={budgetQuery.data ?? null}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
