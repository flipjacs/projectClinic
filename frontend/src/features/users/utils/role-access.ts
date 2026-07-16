import type { LucideIcon } from "lucide-react";

import { NAV_ITEMS } from "@/lib/permissions";
import type { Role } from "@/types/roles";

export interface ModuleAccess {
  key: string;
  label: string;
  icon: LucideIcon;
  allowed: boolean;
}

/**
 * Acesso do cargo aos módulos do sistema, derivado do MESMO mapa que governa a
 * navegação (`NAV_ITEMS`). É a visão de acesso real do frontend por papel — não
 * um dado inventado. A autoridade final continua sendo o RBAC do backend, que
 * pode ter regras mais finas por operação (ex.: quem escreve no estoque); aqui
 * mostramos o acesso às áreas, que é o que o frontend controla.
 *
 * O "Dashboard" é omitido (todos têm) para focar nas áreas de trabalho.
 */
export function moduleAccessForRole(role: Role): ModuleAccess[] {
  return NAV_ITEMS.filter((item) => item.key !== "dashboard").map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    allowed: item.roles.includes(role),
  }));
}
