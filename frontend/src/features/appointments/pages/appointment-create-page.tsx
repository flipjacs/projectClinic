import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import { appointmentErrorMessage, buildWindow } from "../constants";
import { AppointmentForm } from "../components/appointment-form";
import { useCreateAppointment } from "../hooks/use-appointments";
import type { AppointmentFormValues } from "../schemas/appointment-schema";

export function AppointmentCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateAppointment();

  async function handleSubmit(values: AppointmentFormValues) {
    try {
      const window = buildWindow(values.date, values.start_time, values.duration_min);
      const appointment = await createMutation.mutateAsync({
        patient_id: values.patient_id,
        dentist_id: values.dentist_id,
        scheduled_start: window.scheduled_start,
        scheduled_end: window.scheduled_end,
        reason: values.reason || null,
        notes: values.notes || null,
      });
      toast.success("Consulta agendada com sucesso.");
      navigate(`/appointments/${appointment.id}`, { replace: true });
    } catch (error) {
      toast.error(appointmentErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Nova consulta"
        description="Selecione o paciente, o profissional e o horário do atendimento."
        actions={
          <Button variant="ghost" onClick={() => navigate("/appointments")}>
            <ArrowLeft className="h-4 w-4" />
            Voltar à agenda
          </Button>
        }
      />
      <AppointmentForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/appointments")}
        isSubmitting={createMutation.isPending}
        submitLabel="Agendar consulta"
      />
    </>
  );
}
