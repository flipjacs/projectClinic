import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { MedicalRecordForm } from "../components/medical-record-form";
import {
  useMedicalRecord,
  useUpdateMedicalRecord,
} from "../hooks/use-medical-records";
import type { MedicalRecordFormValues } from "../schemas/medical-record-schema";

export function MedicalRecordEditPage() {
  const navigate = useNavigate();
  const { recordId: recordIdParam } = useParams();
  const recordId = Number(recordIdParam);

  const { data: record, isLoading, isError, error, refetch } = useMedicalRecord(recordId);
  const updateMutation = useUpdateMedicalRecord(recordId, record?.patient_id ?? 0);

  if (isLoading) return <Loading fullPage label="Carregando registro…" />;
  if (isError || !record) {
    const apiError = toApiError(error);
    return (
      <>
        <PageHeader title="Editar registro clínico" />
        <ErrorState
          title={apiError.status === 403 ? "Acesso restrito" : "Não foi possível carregar os dados"}
          message={apiError.message}
          onRetry={apiError.status === 403 ? undefined : () => refetch()}
        />
      </>
    );
  }

  const detailsPath = `/medical-records/${record.id}`;

  async function handleSubmit(values: MedicalRecordFormValues) {
    try {
      await updateMutation.mutateAsync({
        visit_date: values.visit_date,
        main_complaint: values.main_complaint,
        diagnosis: values.diagnosis || null,
        performed_procedure: values.performed_procedure || null,
        clinical_evolution: values.clinical_evolution || null,
        observations: values.observations || null,
      });
      toast.success("Registro clínico atualizado.");
      navigate(detailsPath, { replace: true });
    } catch (err) {
      const apiError = toApiError(err);
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
        title="Editar registro clínico"
        description="Ajuste as informações do atendimento."
        actions={
          <Button variant="ghost" onClick={() => navigate(detailsPath)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      />
      <MedicalRecordForm
        defaultValues={{
          visit_date: record.visit_date,
          main_complaint: record.main_complaint,
          diagnosis: record.diagnosis ?? "",
          performed_procedure: record.performed_procedure ?? "",
          clinical_evolution: record.clinical_evolution ?? "",
          observations: record.observations ?? "",
        }}
        onSubmit={handleSubmit}
        onCancel={() => navigate(detailsPath)}
        isSubmitting={updateMutation.isPending}
        submitLabel="Salvar alterações"
      />
    </>
  );
}
