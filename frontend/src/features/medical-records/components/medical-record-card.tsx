import { ChevronRight } from "lucide-react";

import { cn } from "@/utils/cn";
import { formatDateLong } from "@/utils/format";
import type { MedicalRecord } from "../types/medical-record";
import { MedicalRecordStatusBadge } from "./medical-record-status-badge";

interface MedicalRecordCardProps {
  record: MedicalRecord;
  onOpen: (id: number) => void;
}

/** Rótulo + trecho de uma seção clínica (oculto quando vazio). */
function Snippet({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p className="text-sm text-ink-soft">
      <span className="font-medium text-ink-mute">{label}: </span>
      <span className="line-clamp-2">{value}</span>
    </p>
  );
}

/** Cartão de um atendimento na timeline — clicável, escaneável. */
export function MedicalRecordCard({ record, onOpen }: MedicalRecordCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(record.id)}
      className={cn(
        "group block w-full rounded-2xl border bg-white p-5 text-left shadow-card",
        "transition-shadow duration-150 ease-out-quint hover:shadow-soft hover:border-graphite-200",
        record.is_active ? "border-line" : "border-line bg-graphite-50/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-ink">
            {formatDateLong(record.visit_date)}
          </p>
          <p className="mt-0.5 text-xs text-ink-mute">Dr(a). {record.dentist.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {!record.is_active && <MedicalRecordStatusBadge isActive={false} />}
          <ChevronRight
            className="h-4 w-4 text-ink-mute transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-gold-700">
            Queixa principal
          </p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium text-ink">
            {record.main_complaint}
          </p>
        </div>
        <Snippet label="Diagnóstico" value={record.diagnosis} />
        <Snippet label="Procedimento" value={record.performed_procedure} />
      </div>
    </button>
  );
}
