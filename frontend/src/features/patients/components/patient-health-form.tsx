import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { healthSchema, type HealthFormValues } from "../schemas/patient-schema";

interface PatientHealthFormProps {
  defaultValues?: Partial<HealthFormValues>;
  onSubmit: (values: HealthFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EMPTY: HealthFormValues = {
  has_disease: false,
  disease_description: "",
  has_allergy: false,
  allergy_description: "",
  uses_medication: false,
  medication_description: "",
  health_observations: "",
};

function Toggle({
  label,
  checked,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-ink">
      <input
        type="checkbox"
        checked={checked}
        className="h-4 w-4 rounded border-gray-300 text-gold-500 focus-visible:ring-gold-400"
        {...props}
      />
      {label}
    </label>
  );
}

export function PatientHealthForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: PatientHealthFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HealthFormValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const hasDisease = watch("has_disease");
  const hasAllergy = watch("has_allergy");
  const usesMedication = watch("uses_medication");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-3">
        <Toggle label="Possui doença / condição" {...register("has_disease")} />
        {hasDisease && (
          <Textarea
            label="Descrição da doença"
            rows={2}
            error={errors.disease_description?.message}
            {...register("disease_description")}
          />
        )}
      </div>

      <div className="space-y-3">
        <Toggle label="Possui alergia" {...register("has_allergy")} />
        {hasAllergy && (
          <Textarea
            label="Descrição da alergia"
            rows={2}
            error={errors.allergy_description?.message}
            {...register("allergy_description")}
          />
        )}
      </div>

      <div className="space-y-3">
        <Toggle label="Usa medicação contínua" {...register("uses_medication")} />
        {usesMedication && (
          <Textarea
            label="Descrição da medicação"
            rows={2}
            error={errors.medication_description?.message}
            {...register("medication_description")}
          />
        )}
      </div>

      <Textarea
        label="Observações de saúde"
        rows={3}
        placeholder="Anotações clínicas relevantes (opcional)"
        error={errors.health_observations?.message}
        {...register("health_observations")}
      />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Salvar saúde
        </Button>
      </div>
    </form>
  );
}
