import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_TONES } from "../constants";
import type { AppointmentStatus } from "../types/appointment";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
