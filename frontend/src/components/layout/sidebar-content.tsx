import { LogOut } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLE_LABELS, type Role } from "@/types/roles";
import { SidebarNav } from "./sidebar-nav";

function initialsOf(name: string | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Conteúdo completo da sidebar (grafite): marca no topo, navegação rolável e
 * rodapé com o usuário logado + sair. Compartilhado entre a sidebar fixa do
 * desktop e o drawer mobile.
 */
export function SidebarContent({
  role,
  onNavigate,
}: {
  role: Role | undefined;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-graphite-900 text-white">
      <div className="px-5 py-5">
        <Logo tone="light" />
      </div>

      <div className="scrollbar-dark flex-1 overflow-y-auto pb-4">
        <SidebarNav role={role} onNavigate={onNavigate} />
      </div>

      {/* Rodapé: usuário + sair. */}
      <div className="border-t border-graphite-700/70 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-graphite-700 text-xs font-semibold text-gold-300"
            aria-hidden
          >
            {initialsOf(user?.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? "—"}</p>
            <p className="truncate text-xs text-graphite-300">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Sair da conta"
            title="Sair"
            className="shrink-0 rounded-lg p-2 text-graphite-300 transition-colors hover:bg-graphite-700 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
