import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import { toast } from "@/stores/toast-store";
import { UNIT_SHORT_LABELS } from "../constants";
import {
  useInventoryPermissions,
  useRegisterAdjustment,
  useRegisterMovement,
} from "../hooks/use-inventory";
import {
  buildMovementSchema,
  parseDecimal,
  toDecimalPayload,
  type MovementFormValues,
} from "../schemas/inventory-schema";
import { formatQuantity, quantityToNumber } from "../utils/inventory-status";
import type { InventoryItem, MovementType } from "../types/inventory";
import { inventoryErrorMessage } from "../utils/inventory-error";
import { ItemSelect } from "./item-select";

interface MovementDialogProps {
  open: boolean;
  onClose: () => void;
  /** Material pré-selecionado (ex.: a partir da página de detalhes). */
  presetItem?: InventoryItem | null;
  defaultKind?: MovementType;
}

const KIND_META: Record<MovementType, { label: string; icon: typeof ArrowDownLeft }> = {
  in: { label: "Entrada", icon: ArrowDownLeft },
  out: { label: "Saída", icon: ArrowUpRight },
  adjustment: { label: "Ajuste", icon: Scale },
};

export function MovementDialog({
  open,
  onClose,
  presetItem = null,
  defaultKind = "in",
}: MovementDialogProps) {
  const { canAdjust } = useInventoryPermissions();
  const kinds = useMemo<MovementType[]>(
    () => (canAdjust ? ["in", "out", "adjustment"] : ["in", "out"]),
    [canAdjust],
  );

  const [item, setItem] = useState<InventoryItem | null>(presetItem);
  const [kind, setKind] = useState<MovementType>(defaultKind);
  const [formError, setFormError] = useState<string | null>(null);

  const available = item ? quantityToNumber(item.current_quantity) : undefined;
  const unit = item ? UNIT_SHORT_LABELS[item.unit_of_measure] : "";

  // Resolver dinâmico: o schema depende do tipo e do saldo disponível.
  const kindRef = useRef(kind);
  const availableRef = useRef(available);
  kindRef.current = kind;
  availableRef.current = available;

  const moveMutation = useRegisterMovement(item?.id ?? 0);
  const adjustMutation = useRegisterAdjustment(item?.id ?? 0);
  const isSaving = moveMutation.isPending || adjustMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useForm<MovementFormValues>({
    defaultValues: { quantity: "", reason: "" },
    mode: "onChange",
    resolver: (values, ctx, opts) =>
      zodResolver(buildMovementSchema(kindRef.current, availableRef.current))(
        values,
        ctx,
        opts,
      ),
  });

  useEffect(() => {
    if (open) {
      setItem(presetItem);
      setKind(defaultKind);
      setFormError(null);
      reset({ quantity: "", reason: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reavalia o saldo/limite em tempo real ao trocar o tipo ou o material.
  useEffect(() => {
    if (getValues("quantity")?.trim()) trigger("quantity");
  }, [kind, available, getValues, trigger]);

  const quantityRaw = watch("quantity");
  const quantityNum = parseDecimal(quantityRaw ?? "") ?? 0;

  // Prévia do saldo resultante em tempo real.
  const resulting = useMemo(() => {
    if (available === undefined) return null;
    if (kind === "in") return available + quantityNum;
    if (kind === "out") return available - quantityNum;
    return quantityNum; // ajuste: quantity é o saldo final
  }, [available, kind, quantityNum]);

  const exceedsStock = kind === "out" && available !== undefined && quantityNum > available;

  async function onSubmit(values: MovementFormValues) {
    setFormError(null);
    if (!item) {
      setFormError("Selecione um material para movimentar.");
      return;
    }
    try {
      if (kind === "adjustment") {
        await adjustMutation.mutateAsync({
          quantity: toDecimalPayload(values.quantity, 3),
          reason: values.reason.trim(),
        });
        toast.success("Saldo ajustado com sucesso.");
      } else {
        await moveMutation.mutateAsync({
          direction: kind,
          payload: {
            quantity: toDecimalPayload(values.quantity, 3),
            reason: values.reason.trim() || null,
          },
        });
        toast.success(kind === "in" ? "Entrada registrada." : "Saída registrada.");
      }
      onClose();
    } catch (error) {
      // Conflito de saldo do backend cai como mensagem de campo, o resto vira alerta.
      const message = inventoryErrorMessage(error);
      if (kind === "out") setError("quantity", { message });
      else setFormError(message);
    }
  }

  const quantityLabel = kind === "adjustment" ? "Novo saldo" : "Quantidade";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Movimentar estoque"
      description="Registre uma entrada, saída ou ajuste de saldo."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSaving} type="button">
            Cancelar
          </Button>
          <Button
            type="submit"
            form="movement-form"
            isLoading={isSaving}
            disabled={!item || exceedsStock}
          >
            Salvar movimentação
          </Button>
        </>
      }
    >
      <form id="movement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {presetItem ? (
          <div className="rounded-lg border border-line bg-graphite-50 px-3 py-2">
            <p className="text-sm font-medium text-ink">{presetItem.name}</p>
            <p className="text-xs text-ink-mute">
              Saldo atual: {formatQuantity(presetItem.current_quantity)} {unit}
            </p>
          </div>
        ) : (
          <ItemSelect value={item} onChange={setItem} />
        )}

        {/* Tipo — controle segmentado */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Tipo</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {kinds.map((k) => {
              const Icon = KIND_META[k].icon;
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1",
                    active
                      ? "border-gold-300 bg-gold-50 text-gold-800"
                      : "border-line bg-white text-ink-soft hover:bg-graphite-50",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {KIND_META[k].label}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label={quantityLabel}
          inputMode="decimal"
          placeholder="0"
          autoFocus={Boolean(presetItem)}
          error={errors.quantity?.message}
          hint={
            !errors.quantity && item && kind === "out"
              ? `Disponível: ${formatQuantity(item.current_quantity)} ${unit}`
              : undefined
          }
          {...register("quantity")}
        />

        {/* Prévia do saldo resultante */}
        {item && resulting !== null && quantityRaw?.trim() && !errors.quantity && (
          <div
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
              resulting <= 0 ? "bg-red-50 text-red-700" : "bg-graphite-50 text-ink-soft",
            )}
          >
            <span>Saldo após a movimentação</span>
            <span className="font-semibold tabular-nums">
              {formatQuantity(String(resulting))} {unit}
            </span>
          </div>
        )}

        {kind === "adjustment" ? (
          <Textarea
            label="Justificativa do ajuste"
            rows={2}
            placeholder="Ex.: correção após contagem física"
            error={errors.reason?.message}
            {...register("reason")}
          />
        ) : (
          <Input
            label="Motivo (opcional)"
            placeholder={kind === "in" ? "Ex.: compra / reposição" : "Ex.: uso em atendimento"}
            error={errors.reason?.message}
            {...register("reason")}
          />
        )}

        {formError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
