import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { PatientForm } from "../components/patient-form";
import { useCreatePatient } from "../hooks/use-patients";
import type { PatientFormValues } from "../schemas/patient-schema";

export function PatientCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePatient();

  async function handleSubmit(values: PatientFormValues) {
    try {
      const patient = await createMutation.mutateAsync({ ...values, email: values.email || null });
      toast.success("Paciente cadastrado com sucesso.");
      navigate(`/patients/${patient.id}`, { replace: true });
    } catch (error) {
      const apiError = toApiError(error);
      toast.error(
        apiError.status === 409
          ? "Já existe um paciente com este CPF."
          : apiError.message,
      );
    }
  }

  return (
    <>
      <PageHeader
        title="Novo paciente"
        description="Preencha os dados para criar a ficha do paciente."
        actions={
          <Button variant="ghost" onClick={() => navigate("/patients")}>
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        }
      />
      <PatientForm
        onSubmit={handleSubmit}
        onCancel={() => navigate("/patients")}
        isSubmitting={createMutation.isPending}
        submitLabel="Cadastrar paciente"
      />
    </>
  );
}
