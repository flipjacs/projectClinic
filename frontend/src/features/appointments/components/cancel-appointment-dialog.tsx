import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/stores/toast-store";
import { appointmentErrorMessage } from "../constants";
import { useCancelAppointment } from "../hooks/use-appointments";
import { cancelSchema, type CancelFormValues } from "../schemas/appointment-schema";
import type { Appointment } from "../types/appointment";

interface CancelAppointmentDialogProps {
  appointment: Appointment;
  onClose: () => void;
}

export function CancelAppointmentDialog({ appointment, onClose }: CancelAppointmentDialogProps) {
  const cancel = useCancelAppointment(appointment.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { cancellation_reason: "" },
  });

  async function onSubmit(values: CancelFormValues) {
    try {
      await cancel.mutateAsync(values.cancellation_reason || null);
      toast.success("Consulta cancelada com sucesso.");
      onClose();
    } catch (error) {
      toast.error(appointmentErrorMessage(error));
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Cancelar consulta"
      description={`${appointment.patient.name} · esta ação pode ser registrada para auditoria.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Textarea
          label="Motivo do cancelamento (opcional)"
          rows={3}
          placeholder="Ex.: paciente solicitou, imprevisto na clínica…"
          error={errors.cancellation_reason?.message}
          {...register("cancellation_reason")}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={cancel.isPending}>
            Voltar
          </Button>
          <Button type="submit" variant="danger" isLoading={cancel.isPending}>
            Cancelar consulta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
