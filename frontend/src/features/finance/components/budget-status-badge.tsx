import { Badge } from "@/components/ui/badge";
import type { BudgetStatus } from "../types/finance";

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  draft: "Rascunho",
  approved: "Aprovado",
  rejected: "Rejeitado",
  canceled: "Cancelado",
};

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const tone =
    status === "approved"
      ? "success"
      : status === "rejected" || status === "canceled"
        ? "danger"
        : "gold";

  return <Badge tone={tone}>{BUDGET_STATUS_LABELS[status]}</Badge>;
}
