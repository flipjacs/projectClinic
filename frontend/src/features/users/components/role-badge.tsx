import { Badge } from "@/components/ui/badge";
import type { Role } from "@/types/roles";
import { ROLE_META } from "../constants";

/** Badge do cargo — ícone + rótulo, no tom definido em ROLE_META. */
export function RoleBadge({ role }: { role: Role }) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className="gap-1">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {meta.label}
    </Badge>
  );
}
