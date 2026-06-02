import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

interface LoadingProps {
  label?: string;
  className?: string;
  fullPage?: boolean;
}

export function Loading({ label = "Carregando…", className, fullPage }: LoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-sm text-gray-500",
        fullPage ? "min-h-[60vh]" : "py-10",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-5 w-5 animate-spin text-gold-500" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
