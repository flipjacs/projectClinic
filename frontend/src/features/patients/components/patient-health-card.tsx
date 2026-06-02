import { HeartPulse, Pencil } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import type { PatientHealthInfo } from "../types/patient";

interface PatientHealthCardProps {
  health: PatientHealthInfo | null;
  canEdit: boolean;
  onEdit: () => void;
}

function Row({
  label,
  active,
  description,
}: {
  label: string;
  active: boolean;
  description: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {active && description && (
          <p className="mt-0.5 text-sm text-gray-600">{description}</p>
        )}
      </div>
      <Badge tone={active ? "warning" : "neutral"}>{active ? "Sim" : "Não"}</Badge>
    </div>
  );
}

export function PatientHealthCard({ health, canEdit, onEdit }: PatientHealthCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Informações de saúde</CardTitle>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {health ? "Editar" : "Adicionar"}
          </Button>
        )}
      </CardHeader>
      <CardBody>
        {!health ? (
          <EmptyState
            icon={HeartPulse}
            title="Sem informações de saúde"
            description={
              canEdit
                ? "Cadastre doenças, alergias e medicações relevantes do paciente."
                : "Nenhuma informação de saúde registrada."
            }
          />
        ) : (
          <div className="divide-y divide-gray-100">
            <Row label="Doença / condição" active={health.has_disease} description={health.disease_description} />
            <Row label="Alergia" active={health.has_allergy} description={health.allergy_description} />
            <Row label="Medicação contínua" active={health.uses_medication} description={health.medication_description} />
            {health.health_observations && (
              <div className="py-2">
                <p className="text-sm font-medium text-ink">Observações</p>
                <p className="mt-0.5 text-sm text-gray-600">{health.health_observations}</p>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
