import { Badge } from "@/components/ui/badge";

/** Status do prontuário. Inativo = cancelado logicamente (histórico preservado). */
export function MedicalRecordStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge tone="success">Ativo</Badge>
  ) : (
    <Badge tone="neutral">Inativado</Badge>
  );
}
