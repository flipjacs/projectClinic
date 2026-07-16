import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkingHoursTable } from "./working-hours-table";

/** Horário de funcionamento semanal da clínica. */
export function ClinicScheduleCard() {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Horário de funcionamento</CardTitle>
          <p className="mt-0.5 text-xs text-ink-mute">
            Dias e horários em que a clínica atende. A agenda usará esta grade.
          </p>
        </div>
      </CardHeader>
      <WorkingHoursTable />
    </Card>
  );
}
