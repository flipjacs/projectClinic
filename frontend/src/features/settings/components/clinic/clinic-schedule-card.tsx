import { Clock } from "lucide-react";

import { FeatureCard } from "../feature-card";
import { WorkingHoursTable } from "./working-hours-table";

/** Horário de funcionamento semanal da clínica. */
export function ClinicScheduleCard() {
  return (
    <FeatureCard
      icon={Clock}
      title="Horário de funcionamento"
      description="Dias e horários em que a clínica atende. A agenda usará esta grade."
      flush
    >
      <WorkingHoursTable />
    </FeatureCard>
  );
}
