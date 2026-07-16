import { useRef, type KeyboardEvent } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/utils/cn";

export interface UserTab<T extends string = string> {
  key: T;
  label: string;
  icon: LucideIcon;
}

interface UserTabsProps<T extends string> {
  tabs: UserTab<T>[];
  active: T;
  onChange: (key: T) => void;
  /** Base para os ids de tab/painel (associação ARIA). */
  idBase: string;
}

/** Ids estáveis para associar cada aba ao seu painel (aria-controls / labelledby). */
export function tabId(base: string, key: string): string {
  return `${base}-tab-${key}`;
}
export function panelId(base: string, key: string): string {
  return `${base}-panel-${key}`;
}

/**
 * Abas internas do perfil, acessíveis por teclado: as setas ←/→ (e Home/End)
 * movem entre abas com roving tabindex, e cada aba controla seu painel via
 * aria-controls. Segue o padrão WAI-ARIA de tablist com ativação automática.
 */
export function UserTabs<T extends string>({
  tabs,
  active,
  onChange,
  idBase,
}: UserTabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].key);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label="Seções do perfil"
      className="-mx-1 overflow-x-auto border-b border-line"
    >
      <div className="flex min-w-max gap-1 px-1">
        {tabs.map((tab, i) => {
          const isActive = tab.key === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              ref={(el) => (refs.current[i] = el)}
              role="tab"
              type="button"
              id={tabId(idBase, tab.key)}
              aria-selected={isActive}
              aria-controls={panelId(idBase, tab.key)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "relative inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-1 focus-visible:rounded-md",
                isActive
                  ? "text-ink after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:bg-gold-500"
                  : "text-ink-mute hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
