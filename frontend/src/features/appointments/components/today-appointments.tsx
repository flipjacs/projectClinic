import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayAppointments } from "../hooks/use-appointments";
import { AppointmentCard } from "./appointment-card";

/** Seção "Consultas de hoje": visão rápida do dia em cards. */
export function TodayAppointments({ onOpen }: { onOpen: (id: number) => void }) {
  const { data, isLoading, isError, refetch } = useTodayAppointments();

  return (
    <section aria-label="Consultas de hoje" className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-ink">
          <CalendarClock className="h-4 w-4 text-gold-600" aria-hidden />
          Consultas de hoje
          {data && data.items.length > 0 && (
            <span className="text-ink-mute">({data.meta.total})</span>
          )}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Nenhuma consulta agendada para hoje"
          description="As consultas do dia aparecem aqui assim que forem marcadas."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.items.map((appt) => (
            <AppointmentCard key={appt.id} appointment={appt} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}
