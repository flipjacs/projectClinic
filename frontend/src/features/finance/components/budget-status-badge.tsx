import { Badge } from "@/components/ui/badge";
import { BUDGET_STATUS_LABELS, BUDGET_STATUS_TONES } from "../constants";
import type { BudgetStatus } from "../types/finance";

export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  return <Badge tone={BUDGET_STATUS_TONES[status]}>{BUDGET_STATUS_LABELS[status]}</Badge>;
}
