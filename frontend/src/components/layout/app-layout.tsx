import { AnimatePresence, motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { CommandPalette } from "@/components/command/command-palette";
import { Loading } from "@/components/feedback/loading";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { pageVariants } from "@/lib/motion";
import { NAV_ITEMS } from "@/lib/permissions";
import { Header } from "./header";
import { MobileSidebar } from "./mobile-sidebar";
import { Sidebar } from "./sidebar";

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Título da página a partir da rota atual (sem cálculos pesados).
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));

  // Atalho global: Cmd/Ctrl+K alterna a paleta de comandos.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar role={user?.role} />
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        role={user?.role}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={current?.label}
          onOpenMenu={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto w-full max-w-7xl"
            >
              <Suspense fallback={<Loading fullPage label="Carregando…" />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
