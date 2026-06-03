import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLES } from "@/types/roles";
import { DEFAULT_DURATION, DURATION_OPTIONS, todayInput } from "../constants";
import { useDentistOptions } from "../hooks/use-appointments";
import {
  appointmentSchema,
  type AppointmentFormValues,
} from "../schemas/appointment-schema";
import { PatientSelect } from "./patient-select";

interface AppointmentFormProps {
  onSubmit: (values: AppointmentFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const durationOptions = DURATION_OPTIONS.map((d) => ({
  value: String(d),
  label: `${d} min`,
}));

export function AppointmentForm({
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = "Agendar consulta",
}: AppointmentFormProps) {
  const { user } = useAuth();
  const isDentist = user?.role === ROLES.DENTIST;
  const { dentists, isLoading: loadingDentists } = useDentistOptions();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient_id: 0,
      dentist_id: isDentist ? user?.id ?? 0 : 0,
      date: todayInput(),
      start_time: "09:00",
      duration_min: DEFAULT_DURATION,
      reason: "",
      notes: "",
    },
  });

  const patientId = watch("patient_id");
  const noDentistOptions = !isDentist && !loadingDentists && dentists.length === 0;

  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <PatientSelect
            value={patientId || null}
            onChange={(p) =>
              setValue("patient_id", p?.id ?? 0, { shouldValidate: true })
            }
            error={errors.patient_id?.message}
          />

          {/* Profissional: dentista agenda para si; demais escolhem na lista. */}
          {isDentist ? (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">Profissional</span>
              <div className="rounded-lg border border-line bg-graphite-50 px-3 py-2 text-sm font-medium text-ink">
                Dr(a). {user?.name}
              </div>
            </div>
          ) : (
            <div>
              <Select
                label="Profissional"
                placeholder="Selecione o profissional"
                options={dentists.map((d) => ({ value: String(d.id), label: `Dr(a). ${d.name}` }))}
                error={errors.dentist_id?.message}
                {...register("dentist_id", { valueAsNumber: true })}
              />
              {noDentistOptions && (
                <p className="mt-1 text-xs text-amber-700">
                  Nenhum profissional disponível para seleção no seu perfil. Peça a um
                  administrador para cadastrar/listar os profissionais.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <Input
              type="date"
              label="Data"
              min={todayInput()}
              error={errors.date?.message}
              {...register("date")}
            />
            <Input
              type="time"
              label="Início"
              error={errors.start_time?.message}
              {...register("start_time")}
            />
            <Select
              label="Duração"
              options={durationOptions}
              error={errors.duration_min?.message}
              {...register("duration_min", { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Motivo (opcional)"
            placeholder="Ex.: avaliação, limpeza, dor…"
            maxLength={200}
            error={errors.reason?.message}
            {...register("reason")}
          />

          <Textarea
            label="Observações (opcional)"
            rows={3}
            placeholder="Informações úteis para o atendimento"
            error={errors.notes?.message}
            {...register("notes")}
          />

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={noDentistOptions}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
