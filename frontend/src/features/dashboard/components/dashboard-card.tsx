import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  /** Destaque dourado para indicadores prioritários. */
  highlight?: boolean;
}

export function DashboardCard({ label, value, icon: Icon, hint, highlight }: DashboardCardProps) {
  return (
    <Card className={cn("p-5", highlight && "border-gold-200 bg-gold-50/40")}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            highlight ? "bg-gold-100 text-gold-700" : "bg-gray-100 text-gray-500",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </Card>
  );
}
