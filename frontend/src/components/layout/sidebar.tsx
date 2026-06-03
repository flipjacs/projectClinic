import type { Role } from "@/types/roles";
import { SidebarContent } from "./sidebar-content";

/** Sidebar fixa (desktop). */
export function Sidebar({ role }: { role: Role | undefined }) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <SidebarContent role={role} />
    </aside>
  );
}
