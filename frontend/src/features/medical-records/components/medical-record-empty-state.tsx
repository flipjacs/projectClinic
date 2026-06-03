import { FileText, Plus } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";

interface MedicalRecordEmptyStateProps {
  /** Exibe a ação de criar (apenas para perfis clínicos). */
  canCreate?: boolean;
  onCreate?: () => void;
}

export function MedicalRecordEmptyState({
  canCreate,
  onCreate,
}: MedicalRecordEmptyStateProps) {
  return (
    <EmptyState
      icon={FileText}
      title="Este paciente ainda não possui registros clínicos"
      description="Os atendimentos registrados aparecem aqui em ordem cronológica."
      action={
        canCreate && onCreate ? (
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Novo registro clínico
          </Button>
        ) : undefined
      }
    />
  );
}
