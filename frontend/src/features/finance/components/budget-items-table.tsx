import { Plus, Trash2 } from "lucide-react";
import type {
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatMoney, multiplyMoney, toMoneyPayload } from "@/utils/currency";
import type { Procedure } from "@/features/procedures/types/procedure";
import type { BudgetFormValues } from "../schemas/finance-schema";

interface BudgetItemsTableProps {
  fields: FieldArrayWithId<BudgetFormValues, "items", "id">[];
  items: BudgetFormValues["items"];
  procedures: Procedure[];
  errors: FieldErrors<BudgetFormValues>;
  register: UseFormRegister<BudgetFormValues>;
  setValue: UseFormSetValue<BudgetFormValues>;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function BudgetItemsTable({
  fields,
  items,
  procedures,
  errors,
  register,
  setValue,
  onAdd,
  onRemove,
}: BudgetItemsTableProps) {
  const procedureOptions = procedures.map((p) => ({ value: String(p.id), label: p.name }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Procedimentos</h3>
          <p className="text-xs text-ink-mute">O total final é calculado pelo sistema.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-graphite-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-ink-mute">
              <th className="px-4 py-3">Procedimento</th>
              <th className="w-28 px-4 py-3">Qtd.</th>
              <th className="w-36 px-4 py-3">Valor unit.</th>
              <th className="w-32 px-4 py-3">Estimado</th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {fields.map((field, index) => {
              const item = items[index];
              const rowTotal = multiplyMoney(item?.unit_price, item?.quantity ?? 1);
              return (
                <tr key={field.id} className="align-top text-sm">
                  <td className="px-4 py-3">
                    <Select
                      label=""
                      aria-label={`Procedimento do item ${index + 1}`}
                      options={procedureOptions}
                      value={String(item?.procedure_id || "")}
                      onChange={(event) => {
                        const procedureId = Number(event.target.value);
                        const procedure = procedures.find((p) => p.id === procedureId);
                        setValue(`items.${index}.procedure_id`, procedureId, {
                          shouldValidate: true,
                        });
                        if (procedure) {
                          setValue(
                            `items.${index}.unit_price`,
                            toMoneyPayload(procedure.base_price ?? 0),
                            { shouldValidate: true },
                          );
                        }
                      }}
                      error={errors.items?.[index]?.procedure_id?.message}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      aria-label={`Quantidade do item ${index + 1}`}
                      type="number"
                      min={1}
                      error={errors.items?.[index]?.quantity?.message}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      aria-label={`Valor unitário do item ${index + 1}`}
                      inputMode="decimal"
                      error={errors.items?.[index]?.unit_price?.message}
                      {...register(`items.${index}.unit_price`)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 pt-5 font-semibold text-ink">
                    {formatMoney(rowTotal)}
                  </td>
                  <td className="px-4 py-3 pt-4">
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="rounded-lg p-2 text-ink-mute transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
                      aria-label="Remover procedimento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
