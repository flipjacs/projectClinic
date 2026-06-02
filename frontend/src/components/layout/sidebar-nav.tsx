import { navItemsForRole } from "@/lib/permissions";
import type { Role } from "@/types/roles";
import { NavItem } from "./nav-item";

/** Lista de navegação compartilhada entre a sidebar fixa e a mobile. */
export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role | undefined;
  onNavigate?: () => void;
}) {
  const items = navItemsForRole(role);

  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map((item) => (
        <NavItem
          key={item.key}
          to={item.path}
          label={item.label}
          icon={item.icon}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink">
        <span className="text-base font-semibold text-gold-400">C</span>
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-ink">Clínica</p>
        <p className="text-xs text-gray-400">Gestão odontológica</p>
      </div>
    </div>
  );
}
