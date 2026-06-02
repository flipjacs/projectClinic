import { LogOut, Menu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { ROLE_LABELS } from "@/types/roles";

interface HeaderProps {
  title?: string;
  onOpenMenu: () => void;
}

export function Header({ title, onOpenMenu }: HeaderProps) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("")
    : "?";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-ink">{user?.name ?? "—"}</p>
          {user && (
            <Badge tone="gold" className="mt-0.5">
              {ROLE_LABELS[user.role]}
            </Badge>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-800">
          {initials}
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sair"
          title="Sair"
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
