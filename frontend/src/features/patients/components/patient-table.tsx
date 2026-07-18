import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format";
import { maskPhone } from "@/utils/masks";
import type { PatientListItem } from "../types/patient";
import { PatientAvatar } from "./patient-avatar";

interface PatientTableProps {
  patients: PatientListItem[];
  onOpen: (id: number) => void;
}

export function PatientTable({ patients, onOpen }: PatientTableProps) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-3 sm:hidden">
        {patients.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onOpen(p.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left shadow-card transition-shadow hover:shadow-soft"
          >
            <PatientAvatar name={p.name} muted={!p.is_active} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-ink">{p.name}</span>
              <span className="block truncate text-xs text-ink-mute">{maskPhone(p.phone)}</span>
            </span>
            {p.is_active ? (
              <Badge tone="success">Ativo</Badge>
            ) : (
              <Badge tone="neutral">Inativo</Badge>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-mute" aria-hidden />
          </button>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card sm:block">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted">
            <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              <th className="px-5 py-3">Paciente</th>
              <th className="px-5 py-3">Telefone</th>
              <th className="px-5 py-3">Situação</th>
              <th className="px-5 py-3">Cadastro</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {patients.map((p) => (
              <tr
                key={p.id}
                onClick={() => onOpen(p.id)}
                className="group cursor-pointer transition-colors hover:bg-canvas/60"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <PatientAvatar name={p.name} size="sm" muted={!p.is_active} />
                    <span className="font-medium text-ink group-hover:text-gold-700">
                      {p.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-soft">{maskPhone(p.phone)}</td>
                <td className="px-5 py-3">
                  {p.is_active ? (
                    <Badge tone="success">Ativo</Badge>
                  ) : (
                    <Badge tone="neutral">Inativo</Badge>
                  )}
                </td>
                <td className="px-5 py-3 text-ink-mute">{formatDate(p.created_at)}</td>
                <td className="px-5 py-3 text-right">
                  <ChevronRight
                    className="ml-auto h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
