import { cn } from "@/utils/cn";
import type { MedicalRecord } from "../types/medical-record";
import { MedicalRecordCard } from "./medical-record-card";

interface MedicalRecordTimelineProps {
  records: MedicalRecord[];
  onOpen: (id: number) => void;
}

/**
 * Timeline vertical do histórico clínico. Cada nó liga-se ao próximo por uma
 * linha contínua; o dourado marca atendimentos ativos, o cinza os inativados.
 */
export function MedicalRecordTimeline({ records, onOpen }: MedicalRecordTimelineProps) {
  return (
    <ol className="relative">
      {records.map((record, i) => {
        const isLast = i === records.length - 1;
        return (
          <li key={record.id} className="relative flex gap-4 pb-4 last:pb-0">
            {/* Trilho: nó + linha contínua. */}
            <div className="flex flex-col items-center" aria-hidden>
              <span
                className={cn(
                  "mt-5 h-2.5 w-2.5 shrink-0 rounded-full ring-4",
                  record.is_active
                    ? "bg-gold-500 ring-gold-100"
                    : "bg-graphite-300 ring-graphite-100",
                )}
              />
              {!isLast && <span className="mt-1 w-px flex-1 bg-line" />}
            </div>
            <div className="min-w-0 flex-1">
              <MedicalRecordCard record={record} onOpen={onOpen} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
