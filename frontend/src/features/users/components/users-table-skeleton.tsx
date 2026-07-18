import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto de carregamento com a MESMA forma da lista — a tabela no desktop e
 * os cartões no mobile aparecem exatamente onde o conteúdo vai ficar, evitando
 * salto visual e a sensação de "spinner genérico".
 */
export function UsersTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {/* Mobile: cartões */}
      <div className="space-y-3 sm:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-2/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card sm:block">
        <div className="border-b border-line px-5 py-3">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="ml-2 h-5 w-24 rounded-full" />
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="ml-auto h-3.5 w-20" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
