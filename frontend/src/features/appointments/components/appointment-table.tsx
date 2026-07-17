import { ChevronRight } from "lucide-react";
import type { KeyboardEvent } from "react";

import { formatDateOnly } from "@/utils/format";
import { isoToLocalTime } from "../constants";
import type { Appointment } from "../types/appointment";
import { AppointmentStatusBadge } from "./appointment-status-badge";

interface AppointmentTableProps {
  appointments: Appointment[];
  onOpen: (id: number) => void;
}

/** Lista de consultas em tabela legível (rolagem horizontal no mobile). */
export function AppointmentTable({ appointments, onOpen }: AppointmentTableProps) {
  function openFromKeyboard(event: KeyboardEvent<HTMLTableRowElement>, id: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(id);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
      <table className="min-w-full divide-y divide-line">
        <thead className="bg-graphite-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
            <th className="px-5 py-3">Data e hora</th>
            <th className="px-5 py-3">Paciente</th>
            <th className="hidden px-5 py-3 sm:table-cell">Profissional</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {appointments.map((appt) => (
            <tr
              key={appt.id}
              onClick={() => onOpen(appt.id)}
              onKeyDown={(event) => openFromKeyboard(event, appt.id)}
              tabIndex={0}
              aria-label={`Abrir consulta de ${appt.patient.name}`}
              className="cursor-pointer text-sm transition-colors hover:bg-gold-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400"
            >
              <td className="whitespace-nowrap px-5 py-3">
                <span className="font-medium text-ink">{formatDateOnly(appt.scheduled_start)}</span>
                <span className="ml-2 text-ink-mute">
                  {isoToLocalTime(appt.scheduled_start)}
                </span>
              </td>
              <td className="px-5 py-3 font-medium text-ink">{appt.patient.name}</td>
              <td className="hidden px-5 py-3 text-ink-soft sm:table-cell">
                Dr(a). {appt.dentist.name}
              </td>
              <td className="px-5 py-3">
                <AppointmentStatusBadge status={appt.status} />
              </td>
              <td className="px-5 py-3 text-right">
                <ChevronRight className="ml-auto h-4 w-4 text-ink-mute" aria-hidden />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
