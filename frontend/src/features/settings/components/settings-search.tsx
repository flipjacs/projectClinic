import { Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { fieldBase } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface SettingsSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Total de resultados — anunciado a leitores de tela a cada filtragem. */
  resultCount: number;
}

/** O alvo do evento é um campo editável? (não roubar o "/" de outros inputs) */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * Busca do hub de Configurações. Filtra as categorias enquanto digita;
 * a tecla "/" foca o campo de qualquer lugar da página e Esc limpa/solta o foco.
 */
export function SettingsSearch({ value, onChange, resultCount }: SettingsSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="text"
        role="searchbox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            if (value) onChange("");
            else event.currentTarget.blur();
          }
        }}
        placeholder="Buscar configurações…"
        aria-label="Buscar configurações"
        className={cn(fieldBase, "h-11 border-line pl-10 pr-20 hover:border-graphite-200")}
      />
      <div className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Limpar busca"
            className="rounded-md p-1 text-ink-mute transition-colors hover:bg-graphite-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <kbd
            aria-hidden
            className="hidden rounded-md border border-line bg-graphite-50 px-1.5 py-0.5 text-[11px] font-medium text-ink-mute sm:block"
          >
            /
          </kbd>
        )}
      </div>
      {/* Anúncio discreto do resultado para leitores de tela. */}
      <p className="sr-only" role="status" aria-live="polite">
        {value
          ? `${resultCount} ${resultCount === 1 ? "categoria encontrada" : "categorias encontradas"}`
          : ""}
      </p>
    </div>
  );
}
