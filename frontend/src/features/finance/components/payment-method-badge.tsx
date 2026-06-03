import {
  Banknote,
  CreditCard,
  Landmark,
  QrCode,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { PAYMENT_METHOD_SHORT_LABELS } from "../constants";
import type { PaymentMethod } from "../types/finance";

const ICONS: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  pix: QrCode,
  credit_card: CreditCard,
  debit_card: CreditCard,
  bank_transfer: Landmark,
  other: Wallet,
};

/** Método de pagamento com ícone discreto + label curta. */
export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const Icon = ICONS[method];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
      <Icon className="h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
      {PAYMENT_METHOD_SHORT_LABELS[method]}
    </span>
  );
}
