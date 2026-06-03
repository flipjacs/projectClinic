import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { healthSchema, type HealthFormValues } from "../schemas/patient-schema";
import { HealthConditionSelector } from "./health-condition-selector";

interface PatientHealthFormProps {
  defaultValues?: Partial<HealthFormValues>;
  onSubmit: (values: HealthFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const EMPTY: HealthFormValues = {
  has_disease: false,
  disease_conditions: [],
  disease_other_enabled: false,
  disease_other_text: "",
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
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<HealthFormValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
  });

  const hasDisease = watch("has_disease");
  const hasAllergy = watch("has_allergy");
  const usesMedication = watch("uses_medication");

  function handleDiseaseToggle(next: boolean) {
    if (!next) {
      const v = getValues();
      const hasData =
        v.disease_conditions.length > 0 || (v.disease_other_enabled && v.disease_other_text.trim());
      if (
        hasData &&
        !window.confirm("Remover as condições já selecionadas para este paciente?")
      ) {
        return;
      }
      setValue("disease_conditions", [], { shouldValidate: false });
      setValue("disease_other_enabled", false, { shouldValidate: false });
      setValue("disease_other_text", "", { shouldValidate: false });
    }
    setValue("has_disease", next, { shouldValidate: false });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-3">
        <Toggle
          label="Possui doença / condição"
          checked={hasDisease}
          aria-expanded={hasDisease}
          onChange={(e) => handleDiseaseToggle(e.target.checked)}
        />
        {hasDisease && (
          <Controller
            control={control}
            name="disease_conditions"
            render={({ field: conditionsField }) => (
              <HealthConditionSelector
                conditions={conditionsField.value}
                otherEnabled={watch("disease_other_enabled")}
                otherText={watch("disease_other_text")}
                onConditionsChange={(next) =>
                  setValue("disease_conditions", next, { shouldValidate: true })
                }
                onOtherEnabledChange={(next) => {
                  setValue("disease_other_enabled", next, { shouldValidate: true });
                  if (!next) setValue("disease_other_text", "", { shouldValidate: true });
                }}
                onOtherTextChange={(next) =>
                  setValue("disease_other_text", next, { shouldValidate: true })
                }
                onClear={() => {
                  setValue("disease_conditions", [], { shouldValidate: true });
                  setValue("disease_other_enabled", false, { shouldValidate: true });
                  setValue("disease_other_text", "", { shouldValidate: true });
                }}
                conditionsError={errors.disease_conditions?.message}
                otherError={errors.disease_other_text?.message}
              />
            )}
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
