import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format";
import { maskPhone } from "@/utils/masks";
import type { PatientListItem } from "../types/patient";

interface PatientTableProps {
  patients: PatientListItem[];
  onOpen: (id: number) => void;
}

export function PatientTable({ patients, onOpen }: PatientTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-gray-500">
            <th className="px-5 py-3">Nome</th>
            <th className="px-5 py-3">Telefone</th>
            <th className="px-5 py-3">Situação</th>
            <th className="hidden px-5 py-3 sm:table-cell">Cadastro</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {patients.map((p) => (
            <tr
              key={p.id}
              onClick={() => onOpen(p.id)}
              className="cursor-pointer text-sm transition-colors hover:bg-gold-50/50"
            >
              <td className="px-5 py-3 font-medium text-ink">{p.name}</td>
              <td className="px-5 py-3 text-gray-600">{maskPhone(p.phone)}</td>
              <td className="px-5 py-3">
                {p.is_active ? (
                  <Badge tone="success">Ativo</Badge>
                ) : (
                  <Badge tone="neutral">Inativo</Badge>
                )}
              </td>
              <td className="hidden px-5 py-3 text-gray-500 sm:table-cell">
                {formatDate(p.created_at)}
              </td>
              <td className="px-5 py-3 text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-gray-400" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
