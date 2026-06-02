import { X } from "lucide-react";

import type { Role } from "@/types/roles";
import { BrandMark, SidebarNav } from "./sidebar-nav";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  role: Role | undefined;
}

/** Sidebar deslizante para telas pequenas. */
export function MobileSidebar({ open, onClose, role }: MobileSidebarProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      {/* Painel */}
      <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between pr-3">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto pb-4">
          <SidebarNav role={role} onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
