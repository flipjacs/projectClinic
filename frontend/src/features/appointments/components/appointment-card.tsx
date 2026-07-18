import { Clock } from "lucide-react";

import { cn } from "@/utils/cn";
import { isoToLocalTime } from "../constants";
import type { Appointment } from "../types/appointment";
import { AppointmentStatusBadge } from "./appointment-status-badge";

interface AppointmentCardProps {
  appointment: Appointment;
  onOpen: (id: number) => void;
}

/** Cartão de consulta (usado na seção "Consultas de hoje"). */
export function AppointmentCard({ appointment, onOpen }: AppointmentCardProps) {
  const canceled = appointment.status === "canceled";
  return (
    <button
      type="button"
      onClick={() => onOpen(appointment.id)}
      className={cn(
        "group block w-full rounded-2xl border border-line bg-surface p-4 text-left shadow-card",
        "transition-shadow duration-150 ease-out-quint hover:shadow-soft hover:border-graphite-200",
        canceled && "opacity-75",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-tight text-ink">
          <Clock className="h-4 w-4 text-gold-600" aria-hidden />
          {isoToLocalTime(appointment.scheduled_start)}
          <span className="text-ink-mute">–</span>
          {isoToLocalTime(appointment.scheduled_end)}
        </span>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <p className="mt-3 truncate text-sm font-medium text-ink">{appointment.patient.name}</p>
      <p className="mt-0.5 truncate text-xs text-ink-mute">
        Dr(a). {appointment.dentist.name}
        {appointment.reason ? ` · ${appointment.reason}` : ""}
      </p>
    </button>
  );
}
