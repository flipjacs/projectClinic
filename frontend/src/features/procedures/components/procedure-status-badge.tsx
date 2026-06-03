import { Badge } from "@/components/ui/badge";

export function ProcedureStatusBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? "success" : "neutral"}>{active ? "Ativo" : "Inativo"}</Badge>;
}
