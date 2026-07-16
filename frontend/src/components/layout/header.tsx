import { Menu, Search } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";

interface HeaderProps {
  title?: string;
  onOpenMenu: () => void;
  onOpenPalette: () => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function Header({ title, onOpenMenu, onOpenPalette }: HeaderProps) {
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

      {/* Gatilho da paleta de comandos (busca + ações rápidas). */}
      <button
        type="button"
        onClick={onOpenPalette}
        aria-label="Abrir busca e ações rápidas"
        className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-2.5 text-ink-mute shadow-sm transition-colors hover:border-graphite-200 hover:text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 sm:w-64"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden text-sm sm:inline">Buscar ou navegar…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded border border-line bg-graphite-50 px-1.5 py-0.5 font-sans text-[11px] font-medium text-ink-mute sm:inline-flex">
          {isMac ? "⌘" : "Ctrl"} K
        </kbd>
      </button>
    </header>
  );
}
