import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import { BudgetForm } from "../components/budget-form";
import { financeErrorMessage } from "../constants";
import { useCreateBudget } from "../hooks/use-finance";
import type { BudgetCreateInput } from "../types/finance";

export function BudgetCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateBudget();

  async function handleSubmit(input: BudgetCreateInput) {
    try {
      const budget = await createMutation.mutateAsync(input);
      toast.success("Orçamento criado com sucesso.");
      navigate(`/budgets/${budget.id}`, { replace: true });
    } catch (error) {
      toast.error(financeErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Novo orçamento"
        description="Monte o plano de tratamento com os procedimentos necessários."
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
