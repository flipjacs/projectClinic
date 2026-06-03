import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PatientSelect } from "@/features/appointments/components/patient-select";
import { useDentistOptions } from "@/features/appointments/hooks/use-appointments";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProcedures } from "@/features/procedures/hooks/use-procedures";
import { ROLES } from "@/types/roles";
import { formatMoney, multiplyMoney, toMoneyPayload } from "@/utils/currency";
import { BudgetItemsTable } from "./budget-items-table";
import { budgetSchema, type BudgetFormValues } from "../schemas/finance-schema";

interface BudgetFormProps {
  onSubmit: (values: BudgetFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BudgetForm({ onSubmit, onCancel, isSubmitting }: BudgetFormProps) {
  const { user } = useAuth();
  const isDentist = user?.role === ROLES.DENTIST;
  const { dentists, isLoading: loadingDentists } = useDentistOptions();
  const { data: proceduresData } = useProcedures({
    page: 1,
    pageSize: 100,
    includeInactive: false,
  });
  const procedures = proceduresData?.items ?? [];

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      patient_id: 0,
      patient_name: null,
      dentist_id: isDentist ? user?.id ?? 0 : 0,
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const patientId = watch("patient_id");

  useEffect(() => {
    if (isDentist && user?.id) {
      setValue("dentist_id", user.id, { shouldValidate: true });
    }
  }, [isDentist, setValue, user?.id]);

  const estimatedTotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + multiplyMoney(item.unit_price, item.quantity),
        0,
      ),
    [items],
  );

  function addItem() {
    const procedure = procedures[0];
    append({
      procedure_id: procedure?.id ?? 0,
      quantity: 1,
      unit_price: procedure ? toMoneyPayload(procedure.base_price ?? 0) : "0.00",
    });
  }

  const noProcedures = procedures.length === 0;
  const noDentists = !isDentist && !loadingDentists && dentists.length === 0;

  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <PatientSelect
              value={patientId || null}
              selectedLabel={watch("patient_name")}
              onChange={(patient) => {
                setValue("patient_id", patient?.id ?? 0, { shouldValidate: true });
                setValue("patient_name", patient?.name ?? null);
              }}
              error={errors.patient_id?.message}
            />

            {isDentist ? (
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  Profissional
                </span>
                <div className="rounded-lg border border-line bg-graphite-50 px-3 py-2 text-sm font-medium text-ink">
                  Dr(a). {user?.name}
                </div>
              </div>
            ) : (
              <Select
                label="Profissional"
                placeholder="Selecione o profissional"
                options={dentists.map((d) => ({ value: String(d.id), label: `Dr(a). ${d.name}` }))}
                error={errors.dentist_id?.message}
                {...register("dentist_id", { valueAsNumber: true })}
              />
            )}
          </div>

          <BudgetItemsTable
            fields={fields}
            items={items}
            procedures={procedures}
            errors={errors}
            register={register}
            setValue={setValue}
            onAdd={addItem}
            onRemove={remove}
          />
          {errors.items?.root?.message && (
            <p className="text-xs text-red-600">{errors.items.root.message}</p>
          )}
          {noProcedures && (
            <p className="text-sm text-amber-700">
              Cadastre ao menos um procedimento ativo antes de montar um orçamento.
            </p>
          )}

          <div className="rounded-2xl border border-gold-200 bg-gold-50/60 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gold-800">
              Total estimado
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              {formatMoney(estimatedTotal)}
            </p>
            <p className="mt-1 text-xs text-ink-mute">
              O total final é calculado pelo sistema.
            </p>
          </div>

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
            <Button type="submit" isLoading={isSubmitting} disabled={noProcedures || noDentists}>
              Criar orçamento
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
