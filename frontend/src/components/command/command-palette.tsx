import {
  ArrowRight,
  CalendarPlus,
  CornerDownLeft,
  FilePlus2,
  Search,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { overlayVariants, panelVariants } from "@/lib/motion";
import { navSectionsForRole } from "@/lib/permissions";
import { ROLES } from "@/types/roles";
import { cn } from "@/utils/cn";

interface Command {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  path: string;
  /** Termos extras para busca (sinônimos). */
  keywords?: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useFocusTrap(panelRef, open);

  const commands = useMemo<Command[]>(() => {
    const role = user?.role;
    const isClinical = role === ROLES.ADMIN || role === ROLES.DENTIST;

    // Ações rápidas (criação) — apenas rotas dedicadas, respeitando papéis.
    const actions: Command[] = [
      {
        id: "new-patient",
        label: "Novo paciente",
        group: "Ações rápidas",
        icon: UserPlus,
        path: "/patients/new",
        keywords: "cadastrar criar paciente",
      },
      {
        id: "new-appointment",
        label: "Nova consulta",
        group: "Ações rápidas",
        icon: CalendarPlus,
        path: "/appointments/new",
        keywords: "agendar agenda marcar",
      },
      {
        id: "new-payment",
        label: "Registrar pagamento",
        group: "Ações rápidas",
        icon: Wallet,
        path: "/payments/new",
        keywords: "receber financeiro cobrar",
      },
    ];
    if (isClinical) {
      actions.push({
        id: "new-budget",
        label: "Novo orçamento",
        group: "Ações rápidas",
        icon: FilePlus2,
        path: "/budgets/new",
        keywords: "orcamento proposta",
      });
    }

    // Navegação — reusa a config filtrada por papel (nunca mostra rota proibida).
    const nav: Command[] = navSectionsForRole(role).flatMap((section) =>
      section.items.map((item) => ({
        id: `nav-${item.key}`,
        label: item.label,
        group: "Ir para",
        icon: item.icon,
        path: item.path,
      })),
    );

    return [...actions, ...nav];
  }, [user?.role]);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return commands;
    return commands
      .map((c) => {
        const haystack = normalize(`${c.label} ${c.keywords ?? ""}`);
        const idx = haystack.indexOf(q);
        return { c, idx };
      })
      .filter((r) => r.idx >= 0)
      .sort((a, b) => a.idx - b.idx)
      .map((r) => r.c);
  }, [commands, query]);

  // Agrupa preservando a ordem dos grupos.
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of results) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    return Array.from(map.entries());
  }, [results]);

  // Reset ao abrir; foca o input.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Foco após a montagem/animação.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  // Mantém o item ativo visível.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function run(cmd: Command | undefined) {
    if (!cmd) return;
    onClose();
    navigate(cmd.path);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal flex items-start justify-center p-4 pt-[12vh]">
          <m.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 bg-graphite-950/50"
            onClick={onClose}
            aria-hidden
          />
          <m.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Paleta de comandos"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-white shadow-elevated outline-none"
          >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-5 w-5 shrink-0 text-ink-mute" aria-hidden />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar telas e ações…"
            className="h-14 w-full bg-transparent text-sm text-ink placeholder:text-ink-mute focus:outline-none"
          />
        </div>

        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          className="scrollbar-thin max-h-[52vh] overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-ink-mute">
              Nada encontrado para “{query}”.
            </p>
          ) : (
            groups.map(([group, items]) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-ink-mute">
                  {group}
                </p>
                {items.map((cmd) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const isActive = index === active;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      id={`cmd-${cmd.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-index={index}
                      onMouseMove={() => setActive(index)}
                      onClick={() => run(cmd)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        isActive ? "bg-gold-50 text-ink" : "text-ink-soft hover:bg-graphite-50",
                      )}
                    >
                      <Icon
                        className={cn("h-4 w-4 shrink-0", isActive ? "text-gold-700" : "text-ink-mute")}
                        aria-hidden
                      />
                      <span className="flex-1 truncate">{cmd.label}</span>
                      {isActive && (
                        <ArrowRight className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-mute">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            navegar
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>
              <CornerDownLeft className="h-3 w-3" />
            </Kbd>
            abrir
            <span className="mx-1 text-line">·</span>
            <Kbd>esc</Kbd>
            fechar
          </span>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.25rem] items-center justify-center rounded border border-line bg-graphite-50 px-1 py-0.5 font-sans text-[11px] font-medium text-ink-soft">
      {children}
    </kbd>
  );
}
