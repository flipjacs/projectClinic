import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";

interface NavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}

export function NavItem({ to, label, icon: Icon, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-gold-50 text-gold-800"
            : "text-gray-600 hover:bg-gray-100 hover:text-ink",
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Indicador dourado de item ativo. */}
          <span
            className={cn(
              "h-5 w-0.5 rounded-full",
              isActive ? "bg-gold-500" : "bg-transparent",
            )}
            aria-hidden
          />
          <Icon className="h-[18px] w-[18px]" aria-hidden />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}
