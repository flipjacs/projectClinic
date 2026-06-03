import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { cancelReasonSchema, type CancelReasonValues } from "../schemas/finance-schema";

interface CancelReasonDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: (reason: string | null) => void;
  onClose: () => void;
}

/** Diálogo de cancelamento com motivo opcional (orçamento / pagamento). */
export function CancelReasonDialog({
  title,
  description,
  confirmLabel = "Confirmar cancelamento",
  isLoading,
  onConfirm,
  onClose,
}: CancelReasonDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelReasonValues>({
    resolver: zodResolver(cancelReasonSchema),
    defaultValues: { reason: "" },
  });

  return (
    <Modal open onClose={onClose} title={title} description={description}>
      <form
        onSubmit={handleSubmit((v) => onConfirm(v.reason || null))}
        className="space-y-4"
        noValidate
      >
        <Textarea
          label="Motivo (opcional)"
          rows={3}
          placeholder="Informe o motivo do cancelamento"
          error={errors.reason?.message}
          {...register("reason")}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Voltar
          </Button>
          <Button type="submit" variant="danger" isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
