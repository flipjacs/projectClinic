import { Menu } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";

interface HeaderProps {
  title?: string;
  onOpenMenu: () => void;
}

export function Header({ title, onOpenMenu }: HeaderProps) {
  return (
    <header className="sticky top-0 z-sticky flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-graphite-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Marca compacta só no mobile (a sidebar fica escondida). */}
      <LogoMark size={30} className="lg:hidden" />

      {title && (
        <h1 className="truncate text-base font-semibold tracking-tight text-ink">
          {title}
        </h1>
      )}
    </header>
  );
}
