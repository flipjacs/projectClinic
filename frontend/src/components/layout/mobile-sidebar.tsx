import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useFocusTrap } from "@/hooks/use-focus-trap";
import type { Role } from "@/types/roles";
import { SidebarContent } from "./sidebar-content";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  role: Role | undefined;
}

/** Sidebar deslizante para telas pequenas (drawer acessível). */
export function MobileSidebar({ open, onClose, role }: MobileSidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  // Fecha no Escape e trava o scroll do body enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-drawer lg:hidden">
      <div
        className="absolute inset-0 animate-fade-in bg-graphite-950/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        tabIndex={-1}
        className="absolute left-0 top-0 h-full w-72 max-w-[85vw] animate-slide-in-left shadow-elevated outline-none"
      >
        <SidebarContent role={role} onNavigate={onClose} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="absolute right-3 top-4 rounded-lg p-2 text-graphite-300 transition-colors hover:bg-graphite-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
