import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PatientSelect } from "@/features/appointments/components/patient-select";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_ORDER } from "../constants";
import type { PaymentStatus } from "../types/finance";

const statusOptions = [
  { value: "", label: "Todos os status" },
  ...PAYMENT_STATUS_ORDER.map((s) => ({ value: s, label: PAYMENT_STATUS_LABELS[s] })),
];

export interface PaymentFiltersValue {
  status: PaymentStatus | "";
  patientId: number | null;
  from: string;
  to: string;
}

interface PaymentFiltersProps {
  value: PaymentFiltersValue;
  onChange: (next: Partial<PaymentFiltersValue>) => void;
}

/** Card de filtros da listagem de pagamentos: status, paciente e período. */
export function PaymentFilters({ value, onChange }: PaymentFiltersProps) {
  return (
    <Card className="mb-6">
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Status"
            options={statusOptions}
            value={value.status}
            onChange={(e) => onChange({ status: e.target.value as PaymentStatus | "" })}
          />
          <PatientSelect
            label="Paciente"
            value={value.patientId}
            onChange={(p) => onChange({ patientId: p?.id ?? null })}
          />
          <Input
            type="date"
            label="De"
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => onChange({ from: e.target.value })}
          />
          <Input
            type="date"
            label="Até"
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => onChange({ to: e.target.value })}
          />
        </div>
      </CardBody>
    </Card>
  );
}
