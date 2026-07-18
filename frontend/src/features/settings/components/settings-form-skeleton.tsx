import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto genérico das páginas de Configurações baseadas em cards — a
 * página "aparece" no lugar onde vai ficar, sem salto visual.
 */
export function SettingsFormSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div
      className="max-w-3xl space-y-6"
      aria-busy="true"
      aria-label="Carregando configurações"
    >
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="mt-5 space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
