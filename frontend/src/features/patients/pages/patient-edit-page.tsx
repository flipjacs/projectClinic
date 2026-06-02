import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { maskCEP, maskCPF, maskPhone } from "@/utils/masks";
import { PatientForm } from "../components/patient-form";
import { usePatient, useUpdatePatient } from "../hooks/use-patients";
import type { PatientFormValues } from "../schemas/patient-schema";

export function PatientEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const patientId = Number(id);

  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const updateMutation = useUpdatePatient(patientId);

  const defaults = useMemo<Partial<PatientFormValues> | undefined>(() => {
    if (!patient) return undefined;
    return {
      name: patient.name,
      cpf: maskCPF(patient.cpf),
      birth_date: patient.birth_date,
      phone: maskPhone(patient.phone),
      email: patient.email ?? "",
      street: patient.street,
      number: patient.number,
      neighborhood: patient.neighborhood,
      city: patient.city,
      state: patient.state,
      zip_code: maskCEP(patient.zip_code),
    };
  }, [patient]);

  async function handleSubmit(values: PatientFormValues) {
    try {
      await updateMutation.mutateAsync({ ...values, email: values.email || null });
      toast.success("Dados do paciente atualizados.");
      navigate(`/patients/${patientId}`, { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(
        apiError.status === 409 ? "Já existe um paciente com este CPF." : apiError.message,
      );
    }
  }

  if (isLoading) return <Loading fullPage label="Carregando paciente…" />;
  if (isError || !patient) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title={`Editar: ${patient.name}`}
        actions={
          <Button variant="ghost" onClick={() => navigate(`/patients/${patientId}`)}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      />
      <PatientForm
        defaultValues={defaults}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/patients/${patientId}`)}
        isSubmitting={updateMutation.isPending}
        submitLabel="Salvar alterações"
      />
    </>
  );
}
