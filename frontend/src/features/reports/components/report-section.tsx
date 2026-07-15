import type { ReactNode } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { EmptyChart } from "./charts/empty-chart";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  /** Altura reservada para skeleton/vazio (o gráfico define a própria). */
  height?: number;
  className?: string;
  children: ReactNode;
}

/**
 * Envelope padrão de um bloco de gráfico: cabeçalho + corpo com estados de
 * carregamento, erro e vazio já resolvidos. Mantém todos os gráficos coesos.
 */
export function ChartCard({
  title,
  subtitle,
  action,
  isLoading,
  isError,
  isEmpty,
  emptyMessage,
  onRetry,
  height = 240,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-mute">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 pb-5 pt-4">
        {isLoading ? (
          <div style={{ height }}>
            <Skeleton className="h-full w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div style={{ minHeight: height }} className="flex items-center justify-center">
            <ErrorState title="Não foi possível carregar" onRetry={onRetry} />
          </div>
        ) : isEmpty ? (
          <EmptyChart message={emptyMessage} height={height} />
        ) : (
          children
        )}
      </div>
    </Card>
  );
}
