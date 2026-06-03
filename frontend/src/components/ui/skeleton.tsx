import { cn } from "@/utils/cn";

/**
 * Bloco de carregamento (esqueleto). Usado no lugar de spinners quando o
 * conteúdo tem forma conhecida — a página "aparece" no mesmo lugar onde vai
 * ficar, reduzindo o salto visual.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "skeleton-shimmer relative block overflow-hidden rounded-md bg-graphite-100",
        className,
      )}
      aria-hidden
    />
  );
}
