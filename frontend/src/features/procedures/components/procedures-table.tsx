import { Clock, Pencil, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/utils/currency";
import type { Procedure } from "../types/procedure";
import { ProcedureStatusBadge } from "./procedure-status-badge";

interface ProceduresTableProps {
  procedures: Procedure[];
  canManage: boolean;
  onEdit: (procedure: Procedure) => void;
  onToggleActive: (procedure: Procedure) => void;
  togglingId?: number;
}

function ActionButtons({
  procedure,
  onEdit,
  onToggleActive,
  togglingId,
}: Pick<ProceduresTableProps, "onEdit" | "onToggleActive" | "togglingId"> & {
  procedure: Procedure;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => onEdit(procedure)}>
        <Pencil className="h-4 w-4" />
        Editar
      </Button>
      <Button
        variant={procedure.is_active ? "secondary" : "primary"}
        size="sm"
        onClick={() => onToggleActive(procedure)}
        isLoading={togglingId === procedure.id}
      >
        <Power className="h-4 w-4" />
        {procedure.is_active ? "Inativar" : "Ativar"}
      </Button>
    </div>
  );
}

export function ProceduresTable({
  procedures,
  canManage,
  onEdit,
  onToggleActive,
  togglingId,
}: ProceduresTableProps) {
  return (
    <>
      {/* Desktop: tabela limpa */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface shadow-card sm:block">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface-muted">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3">Procedimento</th>
              <th className="px-5 py-3">Valor base</th>
              <th className="hidden px-5 py-3 lg:table-cell">Duração média</th>
              <th className="px-5 py-3">Situação</th>
              {canManage && <th className="px-5 py-3 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {procedures.map((p) => (
              <tr key={p.id} className="text-sm transition-colors hover:bg-gold-50/40">
                <td className="px-5 py-3">
                  <p className="font-medium text-ink">{p.name}</p>
                  {p.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-ink-mute">{p.description}</p>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-semibold text-ink">
                  {formatMoney(p.base_price)}
                </td>
                <td className="hidden whitespace-nowrap px-5 py-3 text-ink-soft lg:table-cell">
                  {p.estimated_duration_minutes ? `${p.estimated_duration_minutes} min` : "—"}
                </td>
                <td className="px-5 py-3">
                  <ProcedureStatusBadge active={p.is_active} />
                </td>
                {canManage && (
                  <td className="px-5 py-3">
                    <ActionButtons
                      procedure={p}
                      onEdit={onEdit}
                      onToggleActive={onToggleActive}
                      togglingId={togglingId}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {procedures.map((p) => (
          <div key={p.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{p.name}</p>
                {p.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-mute">{p.description}</p>
                )}
              </div>
              <ProcedureStatusBadge active={p.is_active} />
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="font-semibold text-ink">{formatMoney(p.base_price)}</span>
              {p.estimated_duration_minutes && (
                <span className="flex items-center gap-1 text-ink-mute">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {p.estimated_duration_minutes} min
                </span>
              )}
            </div>
            {canManage && (
              <div className="mt-3 border-t border-line pt-3">
                <ActionButtons
                  procedure={p}
                  onEdit={onEdit}
                  onToggleActive={onToggleActive}
                  togglingId={togglingId}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
