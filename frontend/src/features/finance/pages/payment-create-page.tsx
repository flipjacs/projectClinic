import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import { PaymentForm } from "../components/payment-form";
import { financeErrorMessage } from "../constants";
import { useCreatePayment } from "../hooks/use-finance";
import type { PaymentCreateInput } from "../types/finance";

interface PaymentCreateState {
  patientId?: number;
  patientName?: string;
  budgetId?: number;
}

export function PaymentCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as PaymentCreateState;
  const createMutation = useCreatePayment();

  const initial =
    state.patientId && state.patientName
      ? { patientId: state.patientId, patientName: state.patientName, budgetId: state.budgetId }
      : undefined;

  async function handleSubmit(input: PaymentCreateInput) {
    try {
      await createMutation.mutateAsync(input);
      toast.success("Pagamento registrado com sucesso.");
      if (state.budgetId) navigate(`/budgets/${state.budgetId}`, { replace: true });
      else navigate("/payments", { replace: true });
    } catch (error) {
      toast.error(financeErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Registrar pagamento"
        description="Informe o paciente, o valor e a forma de pagamento."
        actions={
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      />
      <PaymentForm
        initial={initial}
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
