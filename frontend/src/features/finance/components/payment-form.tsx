import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PatientSelect } from "@/features/appointments/components/patient-select";
import { formatMoney, moneyToNumber } from "@/utils/currency";
import { useBudgetSettlement, useBudgets } from "../hooks/use-finance";
import { paymentSchema, type PaymentFormValues } from "../schemas/finance-schema";
import type { Budget, PaymentMethod, PaymentStatus } from "../types/finance";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "./payment-status-badge";

const paymentMethodOptions = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }),
);

const paymentStatusOptions: PaymentStatus[] = ["paid", "partially_paid", "pending"];

function dateToIsoEndOfDay(date: string | undefined): string | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0).toISOString();
}

interface PaymentFormProps {
  initialBudget?: Budget | null;
  onSubmit: (values: PaymentFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PaymentForm({
  initialBudget,
  onSubmit,
  onCancel,
  isSubmitting,
}: PaymentFormProps) {
  const { data: budgetsData } = useBudgets({
    page: 1,
    pageSize: 100,
    includeCanceled: false,
  });
  const budgets = (budgetsData?.items ?? []).filter((budget) =>
    budget.status === "draft" || budget.status === "approved"
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      patient_id: initialBudget?.patient_id ?? 0,
      patient_name: initialBudget?.patient.name ?? null,
      budget_id: initialBudget?.id ?? null,
      amount: "",
      payment_method: "pix",
      status: "paid",
      paid_at_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      notes: "",
    },
  });

  const selectedBudgetId = watch("budget_id");
  const selectedBudget = useMemo(
    () => budgets.find((budget) => budget.id === selectedBudgetId) ?? initialBudget ?? null,
    [budgets, initialBudget, selectedBudgetId],
  );
  const amount = watch("amount");
  const status = watch("status");
  const patientId = watch("patient_id");
  const settlement = useBudgetSettlement(selectedBudgetId ?? 0);

  useEffect(() => {
    if (selectedBudget) {
      setValue("patient_id", selectedBudget.patient_id, { shouldValidate: true });
      setValue("patient_name", selectedBudget.patient.name);
    }
  }, [selectedBudget, setValue]);

  const amountNumber = moneyToNumber(amount);
  const pendingNumber = moneyToNumber(settlement.data?.total_pending);
  const exceedsPending =
    Boolean(selectedBudgetId) && pendingNumber > 0 && amountNumber > pendingNumber;

  async function submit(values: PaymentFormValues) {
    await onSubmit({
      ...values,
      paid_at_date:
        values.status === "paid" || values.status === "partially_paid"
          ? dateToIsoEndOfDay(values.paid_at_date ?? "") ?? undefined
          : undefined,
    });
  }

  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
          <Select
            label="Orçamento (opcional)"
            options={[
              { value: "", label: "Pagamento avulso" },
              ...budgets.map((budget) => ({
                value: String(budget.id),
                label: `#${budget.id} · ${budget.patient.name} · ${formatMoney(budget.total_amount)}`,
              })),
            ]}
            value={selectedBudgetId ? String(selectedBudgetId) : ""}
            onChange={(event) => {
              const next = event.target.value ? Number(event.target.value) : null;
              setValue("budget_id", next, { shouldValidate: true });
            }}
          />

          <PatientSelect
            value={patientId || null}
            selectedLabel={watch("patient_name")}
            onChange={(patient) => {
              setValue("patient_id", patient?.id ?? 0, { shouldValidate: true });
              setValue("patient_name", patient?.name ?? null);
              setValue("budget_id", null);
            }}
            error={errors.patient_id?.message}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Input
              label="Valor recebido"
              inputMode="decimal"
              placeholder="0.00"
              error={errors.amount?.message}
              {...register("amount")}
            />
            <Select
              label="Forma de pagamento"
              options={paymentMethodOptions}
              error={errors.payment_method?.message}
              {...register("payment_method")}
            />
            <Select
              label="Status"
              options={paymentStatusOptions.map((s) => ({
                value: s,
                label: PAYMENT_STATUS_LABELS[s],
              }))}
              error={errors.status?.message}
              {...register("status")}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {(status === "paid" || status === "partially_paid") && (
              <Input
                type="date"
                label="Data de recebimento"
                error={errors.paid_at_date?.message}
                {...register("paid_at_date")}
              />
            )}
            {status !== "paid" && (
              <Input
                type="date"
                label="Vencimento (opcional)"
                error={errors.due_date?.message}
                {...register("due_date")}
              />
            )}
          </div>

          {selectedBudgetId && settlement.data && (
            <div className="rounded-2xl border border-line bg-graphite-50 px-4 py-3">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-ink-mute">Total do orçamento</p>
                  <p className="font-semibold text-ink">
                    {formatMoney(settlement.data.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-mute">Valor recebido</p>
                  <p className="font-semibold text-ink">
                    {formatMoney(settlement.data.total_paid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-mute">Valor pendente</p>
                  <p className="font-semibold text-ink">
                    {formatMoney(settlement.data.total_pending)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {exceedsPending && (
            <div className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>
                Este pagamento ultrapassa o valor do orçamento. O backend fará a
                validação definitiva ao registrar.
              </p>
            </div>
          )}

          <Textarea
            label="Observações (opcional)"
            rows={3}
            error={errors.notes?.message}
            {...register("notes")}
          />

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
