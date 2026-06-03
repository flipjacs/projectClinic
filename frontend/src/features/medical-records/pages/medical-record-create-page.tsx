import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/features/patients/hooks/use-patients";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { MedicalRecordForm } from "../components/medical-record-form";
import { useCreateMedicalRecord } from "../hooks/use-medical-records";
import type { MedicalRecordFormValues } from "../schemas/medical-record-schema";

export function MedicalRecordCreatePage() {
  const navigate = useNavigate();
  const { patientId: patientIdParam } = useParams();
  const patientId = Number(patientIdParam);

  const patientQuery = usePatient(patientId);
  const createMutation = useCreateMedicalRecord(patientId);

  const historyPath = `/patients/${patientId}/medical-records`;

  async function handleSubmit(values: MedicalRecordFormValues) {
    try {
      await createMutation.mutateAsync({
        visit_date: values.visit_date,
        main_complaint: values.main_complaint,
        diagnosis: values.diagnosis || null,
        performed_procedure: values.performed_procedure || null,
        clinical_evolution: values.clinical_evolution || null,
        observations: values.observations || null,
      });
      toast.success("Registro clínico adicionado ao histórico.");
      navigate(historyPath, { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(
        apiError.status === 403
          ? "Você não tem permissão para alterar prontuários."
          : apiError.message,
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Novo registro clínico"
        description={
          patientQuery.data
            ? `Atendimento de ${patientQuery.data.name}.`
            : "Registre o atendimento do paciente."
        }
        actions={
          <Button variant="ghost" onClick={() => navigate(historyPath)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao histórico
          </Button>
        }
      />
      <MedicalRecordForm
        onSubmit={handleSubmit}
        onCancel={() => navigate(historyPath)}
        isSubmitting={createMutation.isPending}
        submitLabel="Salvar registro"
      />
    </>
  );
}
