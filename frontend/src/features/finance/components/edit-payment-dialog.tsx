import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/stores/toast-store";
import { formatMoney } from "@/utils/currency";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  dateInputToIso,
  financeErrorMessage,
  isoToDateInput,
} from "../constants";
import { useUpdatePayment } from "../hooks/use-finance";
import {
  paymentEditSchema,
  type PaymentEditFormValues,
} from "../schemas/finance-schema";
import type { Payment } from "../types/finance";

const methodOptions = PAYMENT_METHOD_ORDER.map((m) => ({
  value: m,
  label: PAYMENT_METHOD_LABELS[m],
}));

interface EditPaymentDialogProps {
  payment: Payment;
  onClose: () => void;
}

/**
 * Edição dos campos não-financeiros do pagamento (forma, data do pagamento,
 * vencimento, observações). Valor e status não mudam por aqui (regra do backend).
 */
export function EditPaymentDialog({ payment, onClose }: EditPaymentDialogProps) {
  const update = useUpdatePayment(payment.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentEditFormValues>({
    resolver: zodResolver(paymentEditSchema),
    defaultValues: {
      payment_method: payment.payment_method,
      paid_at_date: isoToDateInput(payment.paid_at),
      due_date: payment.due_date ?? "",
      notes: payment.notes ?? "",
    },
  });

  async function submit(values: PaymentEditFormValues) {
    try {
      await update.mutateAsync({
        payment_method: values.payment_method,
        paid_at: values.paid_at_date ? dateInputToIso(values.paid_at_date) : null,
        due_date: values.due_date || null,
        notes: values.notes || null,
      });
      toast.success("Pagamento atualizado.");
      onClose();
    } catch (error) {
      toast.error(financeErrorMessage(error));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Editar pagamento"
      description={`${payment.patient.name} · ${formatMoney(payment.amount)}`}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <Select
          label="Forma de pagamento"
          options={methodOptions}
          error={errors.payment_method?.message}
          {...register("payment_method")}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input type="date" label="Data do pagamento" {...register("paid_at_date")} />
          <Input type="date" label="Vencimento" {...register("due_date")} />
        </div>
        <Textarea label="Observações (opcional)" rows={2} {...register("notes")} />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={update.isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={update.isPending}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
