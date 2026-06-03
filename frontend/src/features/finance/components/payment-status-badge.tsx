import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONES } from "../constants";
import type { PaymentStatus } from "../types/finance";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={PAYMENT_STATUS_TONES[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
