import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/utils/format";
import { maskCPF, maskPhone } from "@/utils/masks";
import type { Patient } from "../types/patient";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

export function PatientSummaryCard({ patient }: { patient: Patient }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Dados pessoais</CardTitle>
        {patient.is_active ? (
          <Badge tone="success">Ativo</Badge>
        ) : (
          <Badge tone="neutral">Inativo</Badge>
        )}
      </CardHeader>
      <CardBody>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="CPF" value={maskCPF(patient.cpf)} />
          <Field label="Nascimento" value={formatDate(patient.birth_date)} />
          <Field label="Telefone" value={maskPhone(patient.phone)} />
          <Field label="E-mail" value={patient.email ?? ""} />
          <div className="sm:col-span-2">
            <Field
              label="Endereço"
              value={`${patient.street}, ${patient.number} — ${patient.neighborhood}, ${patient.city}/${patient.state} · ${patient.zip_code}`}
            />
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}
