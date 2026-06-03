import { navSectionsForRole, NAV_SECTION_LABELS } from "@/lib/permissions";
import type { Role } from "@/types/roles";
import { NavItem } from "./nav-item";

/** Navegação agrupada por seção — compartilhada entre a sidebar fixa e a mobile. */
export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role | undefined;
  onNavigate?: () => void;
}) {
  const groups = navSectionsForRole(role);

  return (
    <nav className="flex flex-col gap-6 px-3">
      {groups.map((group) => (
        <div key={group.section} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-graphite-400">
            {NAV_SECTION_LABELS[group.section]}
          </p>
          {group.items.map((item) => (
            <NavItem
              key={item.key}
              to={item.path}
              label={item.label}
              icon={item.icon}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
