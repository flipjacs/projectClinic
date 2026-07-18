import { Check, Minus } from "lucide-react";

import { ROLE_META } from "../constants";
import { moduleAccessForRole } from "../utils/role-access";
import type { Role } from "@/types/roles";
import { cn } from "@/utils/cn";

/**
 * Acesso do cargo aos módulos, de forma visual. Cada módulo é um cartão com
 * ícone: verde/dourado quando o cargo acessa, neutro esmaecido quando não.
 * Deriva do mapa real de navegação — a autoridade final é o backend.
 */
export function UserPermissions({ role }: { role: Role }) {
  const modules = moduleAccessForRole(role);
  const allowedCount = modules.filter((m) => m.allowed).length;

  return (
    <div>
      <p className="mb-4 text-sm text-ink-mute">
        O cargo <span className="font-medium text-ink">{ROLE_META[role].label}</span> tem
        acesso a <span className="font-medium text-ink">{allowedCount}</span> de{" "}
        {modules.length} áreas do sistema.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.key}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3",
                mod.allowed ? "border-line bg-surface" : "border-dashed border-line bg-canvas/40",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  mod.allowed ? "bg-gold-100 text-gold-700" : "bg-graphite-100 text-graphite-400",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span
                className={cn(
                  "flex-1 text-sm font-medium",
                  mod.allowed ? "text-ink" : "text-ink-mute",
                )}
              >
                {mod.label}
              </span>
              {mod.allowed ? (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-success-100 text-success-700"
                  aria-label="Com acesso"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-graphite-100 text-graphite-400"
                  aria-label="Sem acesso"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-ink-mute">
        As permissões seguem o cargo. Para alterá-las, edite o cargo do usuário. O controle
        final é aplicado pelo servidor a cada requisição.
      </p>
    </div>
  );
}
