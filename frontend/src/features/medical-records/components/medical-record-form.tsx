import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  medicalRecordSchema,
  type MedicalRecordFormValues,
} from "../schemas/medical-record-schema";

interface MedicalRecordFormProps {
  defaultValues?: Partial<MedicalRecordFormValues>;
  onSubmit: (values: MedicalRecordFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

/** "YYYY-MM-DD" de hoje, no fuso local. */
function todayInput(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function MedicalRecordForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Salvar registro",
}: MedicalRecordFormProps) {
  const today = todayInput();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MedicalRecordFormValues>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      visit_date: today,
      main_complaint: "",
      diagnosis: "",
      performed_procedure: "",
      clinical_evolution: "",
      observations: "",
      ...defaultValues,
    },
  });

  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="max-w-xs">
            <Input
              type="date"
              label="Data do atendimento"
              max={today}
              error={errors.visit_date?.message}
              {...register("visit_date")}
            />
          </div>

          <Textarea
            label="Queixa principal"
            rows={3}
            placeholder="O que trouxe o paciente ao atendimento?"
            error={errors.main_complaint?.message}
            {...register("main_complaint")}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Textarea
              label="Diagnóstico"
              rows={4}
              placeholder="Avaliação clínica e hipótese diagnóstica (opcional)"
              error={errors.diagnosis?.message}
              {...register("diagnosis")}
            />
            <Textarea
              label="Procedimento realizado"
              rows={4}
              placeholder="Procedimentos executados neste atendimento (opcional)"
              error={errors.performed_procedure?.message}
              {...register("performed_procedure")}
            />
          </div>

          <Textarea
            label="Evolução clínica"
            rows={4}
            placeholder="Evolução do quadro e condutas (opcional)"
            error={errors.clinical_evolution?.message}
            {...register("clinical_evolution")}
          />

          <Textarea
            label="Observações do atendimento"
            rows={3}
            placeholder="Anotações complementares (opcional)"
            error={errors.observations?.message}
            {...register("observations")}
          />

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
