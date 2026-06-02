import type { Role } from "@/types/roles";
import { BrandMark, SidebarNav } from "./sidebar-nav";

/** Sidebar fixa (desktop). */
export function Sidebar({ role }: { role: Role | undefined }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
      <BrandMark />
      <div className="scrollbar-thin flex-1 overflow-y-auto pb-4">
        <SidebarNav role={role} />
      </div>
    </aside>
  );
}
