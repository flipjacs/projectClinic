import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";
import { MOVEMENT_LABELS } from "../constants";
import type { MovementType } from "../types/inventory";

const STYLES: Record<
  MovementType,
  { icon: LucideIcon; chip: string; text: string }
> = {
  in: {
    icon: ArrowDownLeft,
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    text: "text-emerald-700",
  },
  out: {
    icon: ArrowUpRight,
    chip: "bg-red-50 text-red-700 ring-red-200",
    text: "text-red-700",
  },
  adjustment: {
    icon: Scale,
    chip: "bg-graphite-100 text-graphite-700 ring-graphite-200",
    text: "text-graphite-700",
  },
};

/** Selo do tipo de movimentação, com ícone direcional (entrada/saída/ajuste). */
export function MovementTypeBadge({ type }: { type: MovementType }) {
  const { icon: Icon, chip } = STYLES[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        chip,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {MOVEMENT_LABELS[type]}
    </span>
  );
}

/** Ícone circular do tipo — usado na timeline. */
export function MovementTypeIcon({ type }: { type: MovementType }) {
  const { icon: Icon, chip } = STYLES[type];
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
        chip,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}
