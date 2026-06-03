import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { BudgetForm } from "../components/budget-form";
import { useCreateBudget } from "../hooks/use-finance";
import type { BudgetFormValues } from "../schemas/finance-schema";

export function BudgetCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateBudget();

  async function handleSubmit(values: BudgetFormValues) {
    try {
      const budget = await createMutation.mutateAsync({
        patient_id: values.patient_id,
        dentist_id: values.dentist_id,
        notes: values.notes || null,
        items: values.items.map((item) => ({
          procedure_id: item.procedure_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      });
      toast.success("Orçamento criado. O total final foi calculado pelo sistema.");
      navigate(`/budgets/${budget.id}`, { replace: true });
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Novo orçamento"
        description="Monte uma proposta simples a partir dos procedimentos cadastrados."
        actions={
          <Button variant="ghost" onClick={() => navigate("/budgets")}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      />
      <BudgetForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/budgets")}
        isSubmitting={createMutation.isPending}
      />
    </>
  );
}
