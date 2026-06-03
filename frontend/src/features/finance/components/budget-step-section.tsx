import type { ReactNode } from "react";

import { Card, CardBody } from "@/components/ui/card";

interface BudgetStepSectionProps {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Seção numerada que dá hierarquia de etapas ao formulário de orçamento. */
export function BudgetStepSection({
  step,
  title,
  description,
  children,
}: BudgetStepSectionProps) {
  return (
    <Card>
      <CardBody className="p-5 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-700 ring-1 ring-inset ring-gold-200"
            aria-hidden
          >
            {step}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-mute">{description}</p>}
          </div>
        </div>
        {children}
      </CardBody>
    </Card>
  );
}
