import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PatientSelect } from "@/features/appointments/components/patient-select";
import { useDentistOptions } from "@/features/appointments/hooks/use-appointments";
import { useActiveProcedures } from "@/features/procedures/hooks/use-procedures";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toast } from "@/stores/toast-store";
import { ROLES } from "@/types/roles";
import { moneyToNumber, toMoneyPayload } from "@/utils/currency";
import type { BudgetCreateInput } from "../types/finance";
import { BudgetItemsTable, lineTotal, type BudgetItemDraft } from "./budget-items-table";
import { BudgetStepSection } from "./budget-step-section";
import { BudgetSummaryPanel } from "./budget-summary-panel";

interface BudgetFormProps {
  onSubmit: (input: BudgetCreateInput) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BudgetForm({ onSubmit, onCancel, isSubmitting }: BudgetFormProps) {
  const { user } = useAuth();
  const isDentist = user?.role === ROLES.DENTIST;
  const { dentists } = useDentistOptions();
  const proceduresQuery = useActiveProcedures();
  const procedures = proceduresQuery.data?.items ?? [];

  const [patientId, setPatientId] = useState<number | null>(null);
  const [dentistId, setDentistId] = useState<number>(isDentist ? user?.id ?? 0 : 0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<BudgetItemDraft[]>([]);
  const [picked, setPicked] = useState("");
  const [errors, setErrors] = useState<{ patient?: string; dentist?: string; items?: string }>({});

  function addProcedure() {
    const id = Number(picked);
    if (!id) return;
    if (items.some((it) => it.procedure_id === id)) {
      toast.info("Procedimento já adicionado. Ajuste a quantidade na lista.");
      return;
    }
    const proc = procedures.find((p) => p.id === id);
    if (!proc) return;
    setItems((prev) => [
      ...prev,
      {
        procedure_id: proc.id,
        name: proc.name,
        quantity: 1,
        unit_price: toMoneyPayload(moneyToNumber(proc.base_price)),
      },
    ]);
    setPicked("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!patientId) next.patient = "Selecione o paciente";
    if (!dentistId) next.dentist = "Selecione o profissional";
    if (items.length === 0) next.items = "Adicione ao menos um procedimento";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: BudgetCreateInput = {
      patient_id: patientId as number,
      dentist_id: dentistId,
      notes: notes.trim() || null,
      items: items.map((it) => {
        const num = lineTotal({ ...it, quantity: 1 }); // valor unitário numérico
        return {
          procedure_id: it.procedure_id,
          quantity: it.quantity,
          unit_price: num > 0 ? toMoneyPayload(num) : null,
        };
      }),
    };
    onSubmit(payload);
  }

  const estimatedTotal = items.reduce((acc, it) => acc + lineTotal(it), 0);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3" noValidate>
      <div className="space-y-6 lg:col-span-2">
        <BudgetStepSection step={1} title="Paciente e profissional">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <PatientSelect
              value={patientId}
              onChange={(p) => setPatientId(p?.id ?? null)}
              error={errors.patient}
            />
            {isDentist ? (
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink">Profissional</span>
                <div className="rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm font-medium text-ink">
                  Dr(a). {user?.name}
                </div>
              </div>
            ) : (
              <Select
                label="Profissional"
                placeholder="Selecione o profissional"
                options={dentists.map((d) => ({ value: String(d.id), label: `Dr(a). ${d.name}` }))}
                value={dentistId ? String(dentistId) : ""}
                onChange={(e) => setDentistId(Number(e.target.value) || 0)}
                error={errors.dentist}
              />
            )}
          </div>
        </BudgetStepSection>

        <BudgetStepSection
          step={2}
          title="Procedimentos"
          description="Monte o plano de tratamento com os procedimentos necessários."
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1">
              <Select
                aria-label="Selecionar procedimento"
                placeholder={
                  proceduresQuery.isLoading ? "Carregando…" : "Escolha um procedimento"
                }
                options={procedures.map((p) => ({
                  value: String(p.id),
                  label: p.name,
                }))}
                value={picked}
                onChange={(e) => setPicked(e.target.value)}
              />
            </div>
            <Button type="button" variant="outline" onClick={addProcedure} disabled={!picked}>
              <Plus className="h-4 w-4" />
              Adicionar procedimento
            </Button>
          </div>
          {errors.items && <p className="mt-1 text-xs text-red-600">{errors.items}</p>}
          <div className="mt-3">
            <BudgetItemsTable
              items={items}
              onQuantity={(i, q) =>
                setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, quantity: q } : it)))
              }
              onUnitPrice={(i, v) =>
                setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, unit_price: v } : it)))
              }
              onRemove={(i) => setItems((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </div>
        </BudgetStepSection>

        <BudgetStepSection step={3} title="Observações">
          <Textarea
            label="Observações (opcional)"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </BudgetStepSection>
      </div>

      <div className="lg:col-span-1">
        <BudgetSummaryPanel
          itemsCount={items.length}
          estimatedTotal={estimatedTotal}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
        />
      </div>
    </form>
  );
}
