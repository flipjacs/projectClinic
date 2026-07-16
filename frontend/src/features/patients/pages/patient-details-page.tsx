import { FileText, Pencil, Power } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { ErrorState } from "@/components/feedback/error-state";
import { Loading } from "@/components/feedback/loading";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toApiError } from "@/lib/api";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import {
  parseDiseaseConditions,
  serializeDiseaseConditions,
} from "../constants/health-conditions";
import { PatientHealthCard } from "../components/patient-health-card";
import { PatientHealthForm } from "../components/patient-health-form";
import { PatientSummaryCard } from "../components/patient-summary-card";
import {
  usePatient,
  usePatientHealth,
  useSaveHealthInfo,
  useTogglePatientActive,
} from "../hooks/use-patients";
import type { HealthFormValues } from "../schemas/patient-schema";

export function PatientDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const patientId = Number(id);
  const { user } = useAuth();
  const isClinical = user?.role === ROLES.ADMIN || user?.role === ROLES.DENTIST;

  const { data: patient, isLoading, isError, refetch } = usePatient(patientId);
  const healthQuery = usePatientHealth(patientId, isClinical);
  const health = healthQuery.data ?? null;

  const toggleActive = useTogglePatientActive();
  const saveHealth = useSaveHealthInfo(patientId, Boolean(health));

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingHealth, setEditingHealth] = useState(false);

  if (isLoading) return <Loading fullPage label="Carregando ficha…" />;
  if (isError || !patient) return <ErrorState onRetry={() => refetch()} />;

  async function handleToggleActive() {
    if (!patient) return;
    try {
      await toggleActive.mutateAsync({ id: patient.id, active: !patient.is_active });
      toast.success(patient.is_active ? "Paciente inativado." : "Paciente reativado.");
      setConfirmOpen(false);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  async function handleSaveHealth(values: HealthFormValues) {
    try {
      await saveHealth.mutateAsync({
        has_disease: values.has_disease,
        disease_description: values.has_disease
          ? serializeDiseaseConditions({
              conditions: values.disease_conditions,
              otherEnabled: values.disease_other_enabled,
              otherText: values.disease_other_text,
            })
          : null,
        has_allergy: values.has_allergy,
        allergy_description: values.has_allergy ? values.allergy_description || null : null,
        uses_medication: values.uses_medication,
        medication_description: values.uses_medication
          ? values.medication_description || null
          : null,
        health_observations: values.health_observations || null,
      });
      toast.success("Informações de saúde salvas.");
      setEditingHealth(false);
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }

  return (
    <>
      <Breadcrumbs
        items={[{ label: "Pacientes", to: "/patients" }, { label: patient.name }]}
      />
      <PageHeader
        title={patient.name}
        description="Ficha completa do paciente."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate(`/patients/${patient.id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            {isClinical && (
              <Button
                variant={patient.is_active ? "danger" : "primary"}
                onClick={() =>
                  patient.is_active ? setConfirmOpen(true) : handleToggleActive()
                }
                isLoading={toggleActive.isPending}
              >
                <Power className="h-4 w-4" />
                {patient.is_active ? "Inativar" : "Reativar"}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PatientSummaryCard patient={patient} />

          {/* Entrada para o prontuário — apenas perfis clínicos. */}
          {isClinical && (
            <Card>
              <CardBody className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100">
                    <FileText className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink">Prontuário odontológico</h3>
                    <p className="mt-0.5 text-sm text-ink-mute">
                      Histórico clínico, diagnósticos e evolução do paciente.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/patients/${patient.id}/medical-records`)}
                  >
                    Ver histórico
                  </Button>
                  <Button
                    onClick={() => navigate(`/patients/${patient.id}/medical-records/new`)}
                  >
                    <FileText className="h-4 w-4" />
                    Novo registro
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div>
          {isClinical ? (
            editingHealth ? (
              <Card>
                <CardHeader>
                  <CardTitle>{health ? "Editar saúde" : "Adicionar saúde"}</CardTitle>
                </CardHeader>
                <CardBody>
                  <PatientHealthForm
                    defaultValues={
                      health
                        ? (() => {
                            const parsed = parseDiseaseConditions(health.disease_description);
                            return {
                              has_disease: health.has_disease,
                              disease_conditions: parsed.conditions,
                              disease_other_enabled: parsed.otherEnabled,
                              disease_other_text: parsed.otherText,
                              has_allergy: health.has_allergy,
                              allergy_description: health.allergy_description ?? "",
                              uses_medication: health.uses_medication,
                              medication_description: health.medication_description ?? "",
                              health_observations: health.health_observations ?? "",
                            };
                          })()
                        : undefined
                    }
                    onSubmit={handleSaveHealth}
                    onCancel={() => setEditingHealth(false)}
                    isSubmitting={saveHealth.isPending}
                  />
                </CardBody>
              </Card>
            ) : healthQuery.isLoading ? (
              <Card>
                <CardBody>
                  <Loading label="Carregando saúde…" />
                </CardBody>
              </Card>
            ) : (
              <PatientHealthCard
                health={health}
                canEdit
                onEdit={() => setEditingHealth(true)}
              />
            )
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Informações de saúde</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-ink-mute">
                  Seção clínica restrita a dentistas e administradores.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Inativar paciente"
        message={`Tem certeza que deseja inativar ${patient.name}? O paciente deixará de aparecer nas listagens padrão, mas o histórico é preservado.`}
        confirmLabel="Inativar"
        tone="danger"
        isLoading={toggleActive.isPending}
        onConfirm={handleToggleActive}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
