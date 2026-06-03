import { CalendarDays, Stethoscope } from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { formatDateLong, formatDateTime } from "@/utils/format";
import type { MedicalRecord } from "../types/medical-record";
import { MedicalRecordStatusBadge } from "./medical-record-status-badge";

/** Uma seção clínica do prontuário, com rótulo claro e texto preservando quebras. */
function ClinicalSection({ label, value }: { label: string; value: string | null }) {
  return (
    <section>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gold-700">
        {label}
      </h3>
      {value ? (
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
          {value}
        </p>
      ) : (
        <p className="mt-1 text-sm italic text-ink-mute">Não informado</p>
      )}
    </section>
  );
}

export function MedicalRecordDetails({ record }: { record: MedicalRecord }) {
  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        {/* Cabeçalho: data, dentista e status. */}
        <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-ink">
              <CalendarDays className="h-4 w-4 text-gold-600" aria-hidden />
              <span className="text-base font-semibold tracking-tight">
                {formatDateLong(record.visit_date)}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-mute">
              <Stethoscope className="h-3.5 w-3.5" aria-hidden />
              Dr(a). {record.dentist.name}
            </p>
          </div>
          <MedicalRecordStatusBadge isActive={record.is_active} />
        </div>

        {/* Seções clínicas. */}
        <div className="mt-5 space-y-5">
          <ClinicalSection label="Queixa principal" value={record.main_complaint} />
          <ClinicalSection label="Diagnóstico" value={record.diagnosis} />
          <ClinicalSection label="Procedimento realizado" value={record.performed_procedure} />
          <ClinicalSection label="Evolução clínica" value={record.clinical_evolution} />
          <ClinicalSection label="Observações do atendimento" value={record.observations} />
        </div>

        {/* Rodapé de auditoria leve. */}
        <p className="mt-6 border-t border-line pt-4 text-xs text-ink-mute">
          Registrado em {formatDateTime(record.created_at)}
          {record.updated_at !== record.created_at &&
            ` · atualizado em ${formatDateTime(record.updated_at)}`}
        </p>
      </CardBody>
    </Card>
  );
}
