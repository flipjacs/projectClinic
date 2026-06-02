import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { NAV_ITEMS } from "@/lib/permissions";
import { Header } from "./header";
import { MobileSidebar } from "./mobile-sidebar";
import { Sidebar } from "./sidebar";

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Título da página a partir da rota atual (sem cálculos pesados).
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar role={user?.role} />
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role={user?.role}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={current?.label} onOpenMenu={() => setMobileOpen(true)} />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
