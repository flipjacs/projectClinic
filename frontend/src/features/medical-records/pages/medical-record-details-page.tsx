import { ArrowLeft, Pencil, Power, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { usePatient } from "@/features/patients/hooks/use-patients";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { MedicalRecordDetails } from "../components/medical-record-details";
import {
  useMedicalRecord,
  useSetMedicalRecordActive,
} from "../hooks/use-medical-records";

export function MedicalRecordDetailsPage() {
  const navigate = useNavigate();
  const { recordId: recordIdParam } = useParams();
  const recordId = Number(recordIdParam);

  const { data: record, isLoading, isError, error, refetch } = useMedicalRecord(recordId);
  const patientQuery = usePatient(record?.patient_id ?? 0);

  const [confirmOpen, setConfirmOpen] = useState(false);

  // O hook depende de patientId; só está disponível após o registro carregar.
  const setActive = useSetMedicalRecordActive(recordId, record?.patient_id ?? 0);

  if (isLoading) return <Loading fullPage label="Carregando registro…" />;
  if (isError || !record) {
    const apiError = toApiError(error);
    return (
      <>
        <PageHeader title="Registro clínico" />
        <ErrorState
          title={apiError.status === 403 ? "Acesso restrito" : "Não foi possível carregar os dados"}
          message={apiError.message}
          onRetry={apiError.status === 403 ? undefined : () => refetch()}
        />
      </>
    );
  }

  const historyPath = `/patients/${record.patient_id}/medical-records`;

  async function handleDeactivate() {
    try {
      await setActive.mutateAsync(false);
      toast.success("Registro inativado. O histórico foi preservado.");
      setConfirmOpen(false);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  }

  async function handleReactivate() {
    try {
      await setActive.mutateAsync(true);
      toast.success("Registro reativado.");
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Registro clínico"
        description={
          patientQuery.data
            ? `Paciente: ${patientQuery.data.name}.`
            : "Detalhes do atendimento."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => navigate(historyPath)}>
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            {record.is_active ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/medical-records/${record.id}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setConfirmOpen(true)}
                  isLoading={setActive.isPending}
                >
                  <Power className="h-4 w-4" />
                  Inativar
                </Button>
              </>
            ) : (
              <Button onClick={handleReactivate} isLoading={setActive.isPending}>
                <RotateCcw className="h-4 w-4" />
                Reativar
              </Button>
            )}
          </div>
        }
      />

      <div className="mx-auto max-w-3xl">
        <MedicalRecordDetails record={record} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Inativar registro clínico"
        message="O registro deixará de aparecer no histórico padrão, mas o conteúdo é preservado e pode ser reativado depois. Deseja continuar?"
        confirmLabel="Inativar"
        tone="danger"
        isLoading={setActive.isPending}
        onConfirm={handleDeactivate}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
