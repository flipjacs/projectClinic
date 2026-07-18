import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PatientSelect } from "@/features/appointments/components/patient-select";
import { formatMoney, toMoneyPayload } from "@/utils/currency";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ORDER,
  PAYMENT_STATUS_FORM_OPTIONS,
  PAYMENT_STATUS_LABELS,
} from "../constants";
import { useBudgets } from "../hooks/use-finance";
import { paymentSchema, type PaymentFormValues } from "../schemas/finance-schema";
import type { PaymentCreateInput } from "../types/finance";

interface PaymentFormProps {
  onSubmit: (input: PaymentCreateInput) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** Pré-vincula a um paciente/orçamento (ex.: a partir do detalhe do orçamento). */
  initial?: { patientId: number; patientName: string; budgetId?: number };
}

const methodOptions = PAYMENT_METHOD_ORDER.map((m) => ({
  value: m,
  label: PAYMENT_METHOD_LABELS[m],
}));

const statusOptions = PAYMENT_STATUS_FORM_OPTIONS.map((s) => ({
  value: s,
  label: PAYMENT_STATUS_LABELS[s],
}));

/** Converte "YYYY-MM-DD" em ISO no meio-dia local (evita salto de fuso). */
function dateToIso(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d, 12, 0, 0).toISOString();
}

export function PaymentForm({ onSubmit, onCancel, isSubmitting, initial }: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      patient_id: initial?.patientId ?? 0,
      patient_name: initial?.patientName ?? null,
      budget_id: initial?.budgetId ?? null,
      amount: "",
      payment_method: "pix",
      status: "paid",
      paid_at_date: "",
      due_date: "",
      notes: "",
    },
  });

  const patientId = watch("patient_id");
  const budgetId = watch("budget_id");
  const status = watch("status");

  const budgetsQuery = useBudgets({
    patientId: patientId || undefined,
    includeCanceled: false,
    page: 1,
    pageSize: 50,
  });
  const budgets = patientId ? budgetsQuery.data?.items ?? [] : [];

  function submit(values: PaymentFormValues) {
    const payload: PaymentCreateInput = {
      patient_id: values.patient_id,
      budget_id: values.budget_id ?? null,
      amount: toMoneyPayload(values.amount),
      payment_method: values.payment_method,
      status: values.status,
      paid_at: values.paid_at_date ? dateToIso(values.paid_at_date) : null,
      due_date: values.due_date || null,
      notes: values.notes || null,
    };
    onSubmit(payload);
  }

  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
          {initial ? (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">Paciente</span>
              <div className="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-medium text-ink">
                {initial.patientName}
              </div>
            </div>
          ) : (
            <PatientSelect
              value={patientId || null}
              onChange={(p) => {
                setValue("patient_id", p?.id ?? 0, { shouldValidate: true });
                setValue("budget_id", null);
              }}
              error={errors.patient_id?.message}
            />
          )}

          {budgets.length > 0 && (
            <Select
              label="Vincular a orçamento (opcional)"
              options={[
                { value: "", label: "Sem vínculo" },
                ...budgets.map((b) => ({
                  value: String(b.id),
                  label: `Orçamento #${b.id} · ${formatMoney(b.total_amount)}`,
                })),
              ]}
              value={budgetId ? String(budgetId) : ""}
              onChange={(e) => setValue("budget_id", e.target.value ? Number(e.target.value) : null)}
            />
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Valor recebido (R$)"
              inputMode="decimal"
              placeholder="0,00"
              error={errors.amount?.message}
              {...register("amount")}
            />
            <Select
              label="Forma de pagamento"
              options={methodOptions}
              error={errors.payment_method?.message}
              {...register("payment_method")}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Select label="Status" options={statusOptions} {...register("status")} />
            <Input
              type="date"
              label="Data do pagamento"
              hint={status === "pending" ? "Opcional para pendências" : undefined}
              {...register("paid_at_date")}
            />
            <Input
              type="date"
              label="Vencimento (opcional)"
              {...register("due_date")}
            />
          </div>

          <Textarea label="Observações (opcional)" rows={2} {...register("notes")} />

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Registrar pagamento
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
