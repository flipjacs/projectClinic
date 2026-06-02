import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/format";
import type { DashboardAppointmentSnapshot } from "../types/dashboard";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  in_progress: "Em andamento",
  completed: "Concluída",
  canceled: "Cancelada",
  no_show: "Falta",
};

function statusTone(status: string) {
  switch (status) {
    case "confirmed":
    case "completed":
      return "success" as const;
    case "canceled":
    case "no_show":
      return "danger" as const;
    case "in_progress":
      return "info" as const;
    default:
      return "gold" as const;
  }
}

export function UpcomingAppointments({
  appointments,
}: {
  appointments: DashboardAppointmentSnapshot[];
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Próximas consultas</CardTitle>
        <CalendarClock className="h-4 w-4 text-gray-400" aria-hidden />
      </CardHeader>
      <CardBody className="p-0">
        {appointments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={CalendarClock}
              title="Sem consultas próximas"
              description="Não há agendamentos futuros no período."
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {appointments.map((appt) => (
              <li key={appt.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{appt.patient.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {formatDateTime(appt.scheduled_start)} · Dr(a). {appt.dentist.name}
                  </p>
                </div>
                <Badge tone={statusTone(appt.status)}>
                  {STATUS_LABELS[appt.status] ?? appt.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
