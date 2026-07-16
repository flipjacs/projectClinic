import { Card, CardBody } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { STATUS_LABELS, STATUS_ORDER } from "../constants";
import type { AppointmentStatus, Dentist } from "../types/appointment";
import { PatientSelect } from "./patient-select";

export interface AppointmentFilterValues {
  date: string; // "" = qualquer
  patientId: number | null;
  patientName: string | null;
  dentistId: number | null;
  status: AppointmentStatus | "";
  includeCanceled: boolean;
}

export const EMPTY_FILTERS: AppointmentFilterValues = {
  date: "",
  patientId: null,
  patientName: null,
  dentistId: null,
  status: "",
  includeCanceled: false,
};

interface AppointmentFiltersProps {
  value: AppointmentFilterValues;
  onChange: (next: AppointmentFilterValues) => void;
  dentists: Dentist[];
}

const statusOptions = [
  { value: "", label: "Todos" },
  ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

export function AppointmentFilters({ value, onChange, dentists }: AppointmentFiltersProps) {
  const patch = (partial: Partial<AppointmentFilterValues>) =>
    onChange({ ...value, ...partial });

  const hasActiveFilter =
    value.date !== "" ||
    value.patientId !== null ||
    value.dentistId !== null ||
    value.status !== "" ||
    value.includeCanceled;

  return (
    <Card className="mb-4">
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="date"
            label="Data"
            value={value.date}
            onChange={(e) => patch({ date: e.target.value })}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={value.status}
            onChange={(e) => patch({ status: e.target.value as AppointmentStatus | "" })}
          />
          {dentists.length > 0 && (
            <Select
              label="Profissional"
              options={[
                { value: "", label: "Todos" },
                ...dentists.map((d) => ({ value: String(d.id), label: `Dr(a). ${d.name}` })),
              ]}
              value={value.dentistId ? String(value.dentistId) : ""}
              onChange={(e) => patch({ dentistId: e.target.value ? Number(e.target.value) : null })}
            />
          )}
          <PatientSelect
            label="Paciente"
            value={value.patientId}
            selectedLabel={value.patientName}
            onChange={(p) =>
              patch({ patientId: p?.id ?? null, patientName: p?.name ?? null })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            label="Incluir canceladas"
            checked={value.includeCanceled}
            onChange={(e) => patch({ includeCanceled: e.target.checked })}
          />
          {hasActiveFilter && (
            <button
              type="button"
              onClick={() => onChange(EMPTY_FILTERS)}
              className="text-sm font-medium text-gold-700 transition-colors hover:text-gold-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
