import { Power, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/utils/currency";
import type { Procedure } from "../types/procedure";

interface ProceduresTableProps {
  procedures: Procedure[];
  canManage: boolean;
  onEdit: (procedure: Procedure) => void;
  onToggleActive: (procedure: Procedure) => void;
  togglingId?: number;
}

export function ProceduresTable({
  procedures,
  canManage,
  onEdit,
  onToggleActive,
  togglingId,
}: ProceduresTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-graphite-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            <th className="px-5 py-3">Procedimento</th>
            <th className="px-5 py-3">Preço base</th>
            <th className="hidden px-5 py-3 sm:table-cell">Duração</th>
            <th className="px-5 py-3">Situação</th>
            {canManage && <th className="px-5 py-3 text-right">Ações</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {procedures.map((p) => (
            <tr key={p.id} className="text-sm">
              <td className="px-5 py-3">
                <p className="font-medium text-ink">{p.name}</p>
                {p.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-mute">{p.description}</p>
                )}
              </td>
              <td className="whitespace-nowrap px-5 py-3 font-medium text-ink">
                {formatMoney(p.base_price)}
              </td>
              <td className="hidden whitespace-nowrap px-5 py-3 text-ink-soft sm:table-cell">
                {p.estimated_duration_minutes ? `${p.estimated_duration_minutes} min` : "—"}
              </td>
              <td className="px-5 py-3">
                {p.is_active ? (
                  <Badge tone="success">Ativo</Badge>
                ) : (
                  <Badge tone="neutral">Inativo</Badge>
                )}
              </td>
              {canManage && (
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant={p.is_active ? "secondary" : "primary"}
                      size="sm"
                      onClick={() => onToggleActive(p)}
                      isLoading={togglingId === p.id}
                    >
                      <Power className="h-4 w-4" />
                      {p.is_active ? "Inativar" : "Ativar"}
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
