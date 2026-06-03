import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toMoneyPayload } from "@/utils/currency";
import { procedureSchema, type ProcedureFormValues } from "../schemas/procedure-schema";

interface ProcedureFormProps {
  defaultValues?: Partial<ProcedureFormValues>;
  onSubmit: (values: ProcedureFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ProcedureForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Salvar procedimento",
}: ProcedureFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: "",
      description: "",
      base_price: "0.00",
      estimated_duration_minutes: null,
      ...defaultValues,
      ...(defaultValues?.base_price
        ? { base_price: toMoneyPayload(defaultValues.base_price) }
        : {}),
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Nome do procedimento"
        placeholder="Ex.: Limpeza odontológica"
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Preço base"
          inputMode="decimal"
          placeholder="0.00"
          error={errors.base_price?.message}
          {...register("base_price")}
        />
        <Input
          label="Duração estimada (min)"
          type="number"
          min={1}
          max={1440}
          error={errors.estimated_duration_minutes?.message}
          {...register("estimated_duration_minutes", {
            setValueAs: (v) => (v === "" ? null : Number(v)),
          })}
        />
      </div>
      <Textarea
        label="Descrição (opcional)"
        rows={3}
        placeholder="Orientações ou observações internas"
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
