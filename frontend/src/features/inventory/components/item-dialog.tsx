import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/stores/toast-store";
import { CATEGORY_LABELS, CATEGORY_ORDER, UNIT_LABELS, UNIT_ORDER } from "../constants";
import { useCreateItem, useUpdateItem } from "../hooks/use-inventory";
import {
  emptyItemForm,
  itemFormSchema,
  toDecimalPayload,
  type ItemFormValues,
} from "../schemas/inventory-schema";
import type {
  InventoryItem,
  InventoryItemCreateInput,
  InventoryItemUpdateInput,
} from "../types/inventory";
import { inventoryErrorMessage } from "../utils/inventory-error";

const categoryOptions = CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));
const unitOptions = UNIT_ORDER.map((u) => ({ value: u, label: UNIT_LABELS[u] }));

/** Remove zeros decimais irrelevantes ao pré-preencher campos numéricos. */
function toInput(dec: string | null): string {
  if (!dec) return "";
  const n = Number(dec);
  return Number.isFinite(n) ? String(n) : dec;
}

interface ItemDialogProps {
  open: boolean;
  onClose: () => void;
  /** Presente = edição; ausente = criação. */
  item?: InventoryItem | null;
}

export function ItemDialog({ open, onClose, item }: ItemDialogProps) {
  const isEdit = Boolean(item);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem(item?.id ?? 0);
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const defaultValues = useMemo<ItemFormValues>(() => {
    if (!item) return emptyItemForm;
    return {
      name: item.name,
      category: item.category,
      unit_of_measure: item.unit_of_measure,
      current_quantity: toInput(item.current_quantity) || "0",
      minimum_quantity: toInput(item.minimum_quantity) || "0",
      supplier: item.supplier ?? "",
      unit_price: toInput(item.unit_price),
      expiration_date: item.expiration_date ?? "",
      notes: item.notes ?? "",
    };
  }, [item]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues,
  });

  // Sincroniza o formulário ao abrir ou trocar o item alvo.
  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setFormError(null);
    }
  }, [open, defaultValues, reset]);

  async function onSubmit(values: ItemFormValues) {
    setFormError(null);
    try {
      if (isEdit && item) {
        const payload: InventoryItemUpdateInput = {
          name: values.name.trim(),
          category: values.category,
          unit_of_measure: values.unit_of_measure,
          minimum_quantity: toDecimalPayload(values.minimum_quantity, 3),
          supplier: values.supplier.trim() || null,
          unit_price: values.unit_price.trim() ? toDecimalPayload(values.unit_price, 2) : null,
          expiration_date: values.expiration_date.trim() || null,
          notes: values.notes.trim() || null,
        };
        await updateMutation.mutateAsync(payload);
        toast.success("Item atualizado com sucesso.");
      } else {
        const payload: InventoryItemCreateInput = {
          name: values.name.trim(),
          category: values.category,
          unit_of_measure: values.unit_of_measure,
          current_quantity: toDecimalPayload(values.current_quantity, 3),
          minimum_quantity: toDecimalPayload(values.minimum_quantity, 3),
          supplier: values.supplier.trim() || null,
          unit_price: values.unit_price.trim() ? toDecimalPayload(values.unit_price, 2) : null,
          expiration_date: values.expiration_date.trim() || null,
          notes: values.notes.trim() || null,
        };
        await createMutation.mutateAsync(payload);
        toast.success("Item cadastrado com sucesso.");
      }
      onClose();
    } catch (error) {
      setFormError(inventoryErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? "Editar item" : "Novo item"}
      description={
        isEdit
          ? "Atualize os dados do material. O saldo muda apenas por movimentações."
          : "Cadastre um novo material do estoque da clínica."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="item-form" isLoading={isSaving}>
            {isEdit ? "Salvar alterações" : "Cadastrar item"}
          </Button>
        </>
      }
    >
      <form
        id="item-form"
        onSubmit={handleSubmit(onSubmit)}
        className="max-h-[65vh] space-y-4 overflow-y-auto pr-0.5"
      >
        <Input
          label="Nome do material"
          placeholder="Ex.: Luva de procedimento M"
          autoFocus
          error={errors.name?.message}
          {...register("name")}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Categoria"
            options={categoryOptions}
            error={errors.category?.message}
            {...register("category")}
          />
          <Select
            label="Unidade de medida"
            options={unitOptions}
            error={errors.unit_of_measure?.message}
            {...register("unit_of_measure")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {!isEdit && (
            <Input
              label="Quantidade inicial"
              inputMode="decimal"
              placeholder="0"
              error={errors.current_quantity?.message}
              {...register("current_quantity")}
            />
          )}
          <Input
            label="Estoque mínimo"
            inputMode="decimal"
            placeholder="0"
            hint="Abaixo disso, o item entra em alerta."
            error={errors.minimum_quantity?.message}
            {...register("minimum_quantity")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Preço unitário (opcional)"
            inputMode="decimal"
            placeholder="0,00"
            error={errors.unit_price?.message}
            {...register("unit_price")}
          />
          <Input
            label="Validade (opcional)"
            type="date"
            error={errors.expiration_date?.message}
            {...register("expiration_date")}
          />
        </div>

        <Input
          label="Fornecedor (opcional)"
          placeholder="Ex.: Dental Cremer"
          error={errors.supplier?.message}
          {...register("supplier")}
        />

        <Textarea
          label="Observações (opcional)"
          rows={3}
          placeholder="Local de armazenamento, lote, instruções…"
          error={errors.notes?.message}
          {...register("notes")}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
