import { Edit, Power, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/utils/currency";
import type { Procedure } from "../types/procedure";

interface ProceduresTableProps {
  procedures: Procedure[];
  canManage: boolean;
  onEdit: (procedure: Procedure) => void;
  onToggleActive: (procedure: Procedure) => void;
}

export function ProceduresTable({
  procedures,
  canManage,
  onEdit,
  onToggleActive,
}: ProceduresTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-graphite-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            <th className="px-5 py-3">Procedimento</th>
            <th className="px-5 py-3">Preço base</th>
            <th className="hidden px-5 py-3 md:table-cell">Duração</th>
            <th className="px-5 py-3">Status</th>
            {canManage && <th className="px-5 py-3 text-right">Ações</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {procedures.map((procedure) => (
            <tr key={procedure.id} className="text-sm">
              <td className="px-5 py-3">
                <p className="font-medium text-ink">{procedure.name}</p>
                {procedure.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-mute">
                    {procedure.description}
                  </p>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3 font-semibold text-ink">
                {formatMoney(procedure.base_price)}
              </td>
              <td className="hidden px-5 py-3 text-ink-soft md:table-cell">
                {procedure.estimated_duration_minutes
                  ? `${procedure.estimated_duration_minutes} min`
                  : "—"}
              </td>
              <td className="px-5 py-3">
                <Badge tone={procedure.is_active ? "success" : "neutral"}>
                  {procedure.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              {canManage && (
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(procedure)}>
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={procedure.is_active ? "danger" : "outline"}
                      onClick={() => onToggleActive(procedure)}
                    >
                      {procedure.is_active ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                      {procedure.is_active ? "Inativar" : "Ativar"}
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
