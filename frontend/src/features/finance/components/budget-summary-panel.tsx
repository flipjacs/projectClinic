import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { formatMoney } from "@/utils/currency";

interface BudgetSummaryPanelProps {
  itemsCount: number;
  estimatedTotal: number;
  isSubmitting?: boolean;
  onCancel: () => void;
}

/**
 * Painel-resumo do orçamento em criação. O total é apenas uma estimativa visual
 * — o backend calcula o valor definitivo no envio (fonte da verdade).
 */
export function BudgetSummaryPanel({
  itemsCount,
  estimatedTotal,
  isSubmitting,
  onCancel,
}: BudgetSummaryPanelProps) {
  return (
    <Card className="lg:sticky lg:top-6">
      <CardBody className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-ink">Resumo do orçamento</h2>

        <dl className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-ink-mute">Itens</dt>
            <dd className="text-sm font-medium text-ink">{itemsCount}</dd>
          </div>
          <div className="border-t border-line pt-3">
            <dt className="text-sm text-ink-mute">Total estimado</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-ink">
              {formatMoney(estimatedTotal)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-xs text-ink-mute">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" aria-hidden />
          <span>O backend calcula o total final com segurança.</span>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button type="submit" isLoading={isSubmitting} className="w-full justify-center">
            Criar orçamento
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full justify-center"
          >
            Cancelar
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
