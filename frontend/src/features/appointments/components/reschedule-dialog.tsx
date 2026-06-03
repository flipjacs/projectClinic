import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/stores/toast-store";
import {
  appointmentErrorMessage,
  buildWindow,
  DEFAULT_DURATION,
  DURATION_OPTIONS,
  durationMinutes,
  isoToLocalDate,
  isoToLocalTime,
  todayInput,
} from "../constants";
import { useRescheduleAppointment } from "../hooks/use-appointments";
import {
  rescheduleSchema,
  type RescheduleFormValues,
} from "../schemas/appointment-schema";
import type { Appointment } from "../types/appointment";

const durationOptions = DURATION_OPTIONS.map((d) => ({ value: String(d), label: `${d} min` }));

interface RescheduleDialogProps {
  appointment: Appointment;
  onClose: () => void;
}

export function RescheduleDialog({ appointment, onClose }: RescheduleDialogProps) {
  const reschedule = useRescheduleAppointment(appointment.id);

  const currentDuration = durationMinutes(
    appointment.scheduled_start,
    appointment.scheduled_end,
  );
  const initialDuration = (DURATION_OPTIONS as readonly number[]).includes(currentDuration)
    ? currentDuration
    : DEFAULT_DURATION;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: isoToLocalDate(appointment.scheduled_start),
      start_time: isoToLocalTime(appointment.scheduled_start),
      duration_min: initialDuration,
      reason: "",
    },
  });

  async function onSubmit(values: RescheduleFormValues) {
    try {
      const window = buildWindow(values.date, values.start_time, values.duration_min);
      await reschedule.mutateAsync({ ...window, reason: values.reason || null });
      toast.success("Consulta remarcada com sucesso.");
      onClose();
    } catch (error) {
      toast.error(appointmentErrorMessage(error));
    }
  }

  return (
    <Modal open onClose={onClose} title="Remarcar consulta">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input type="date" label="Data" min={todayInput()} error={errors.date?.message} {...register("date")} />
          <Input type="time" label="Início" error={errors.start_time?.message} {...register("start_time")} />
          <Select
            label="Duração"
            options={durationOptions}
            error={errors.duration_min?.message}
            {...register("duration_min", { valueAsNumber: true })}
          />
        </div>
        <Textarea
          label="Motivo da remarcação (opcional)"
          rows={2}
          error={errors.reason?.message}
          {...register("reason")}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={reschedule.isPending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={reschedule.isPending}>
            Remarcar consulta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
