import { Badge } from "@/components/ui/badge";
import type { PaymentMethod, PaymentStatus } from "../types/finance";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendente",
  partially_paid: "Parcial",
  paid: "Pago",
  canceled: "Cancelado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Transferência",
  other: "Outro",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone =
    status === "paid"
      ? "success"
      : status === "partially_paid"
        ? "warning"
        : status === "canceled"
          ? "danger"
          : "gold";

  return <Badge tone={tone}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}
