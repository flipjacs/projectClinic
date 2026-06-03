import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";

interface NavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}

/** Item de navegação da sidebar grafite. Ativo = superfície + texto claro + traço dourado. */
export function NavItem({ to, label, icon: Icon, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
          "transition-colors duration-150 ease-out-quint",
          isActive
            ? "bg-graphite-700 text-white"
            : "text-graphite-300 hover:bg-graphite-700/50 hover:text-white",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Indicador dourado de item ativo. */}
          <span
            className={cn(
              "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gold-400 transition-opacity",
              isActive ? "opacity-100" : "opacity-0",
            )}
            aria-hidden
          />
          <Icon
            className={cn(
              "h-[18px] w-[18px] shrink-0 transition-colors",
              isActive ? "text-gold-400" : "text-graphite-400 group-hover:text-graphite-200",
            )}
            aria-hidden
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}
