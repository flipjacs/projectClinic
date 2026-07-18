import { Check, Package, Search, X } from "lucide-react";
import { useId, useState } from "react";

import { fieldBase } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/utils/cn";
import { CATEGORY_LABELS, UNIT_SHORT_LABELS } from "../constants";
import { useInventoryItems } from "../hooks/use-inventory";
import { formatQuantity } from "../utils/inventory-status";
import type { InventoryItem } from "../types/inventory";

interface ItemSelectProps {
  value: InventoryItem | null;
  onChange: (item: InventoryItem | null) => void;
  label?: string;
  error?: string;
}

/**
 * Busca + seleção de material ativo (debounce, sem carregar o catálogo inteiro).
 * Ao selecionar, mostra o saldo atual — apoia a decisão de quanto movimentar.
 */
export function ItemSelect({ value, onChange, label = "Material", error }: ItemSelectProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [query, setQuery] = useState("");
  const search = useDebounce(query.trim(), 300);

  const { data, isFetching } = useInventoryItems({
    search: search || undefined,
    page: 1,
    pageSize: 8,
  });

  const showResults = query.trim().length >= 2 && !value;
  const results = data?.items ?? [];

  if (value) {
    return (
      <div className="w-full">
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-gold-600" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{value.name}</span>
              <span className="block text-xs text-ink-mute">
                Saldo: {formatQuantity(value.current_quantity)}{" "}
                {UNIT_SHORT_LABELS[value.unit_of_measure]}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-mute transition-colors hover:bg-graphite-100 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Trocar
          </button>
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
          aria-hidden
        />
        <input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar material pelo nome…"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            fieldBase,
            "h-10 pl-9 pr-3",
            error ? "border-red-400" : "border-line hover:border-graphite-200",
          )}
        />

        {showResults && (
          <div className="absolute z-dropdown mt-1.5 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-elevated">
            {isFetching && results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-mute">Buscando…</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-mute">
                Nenhum material encontrado.
              </p>
            ) : (
              results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {item.name}
                    </span>
                    <span className="block text-xs text-ink-mute">
                      {CATEGORY_LABELS[item.category]} · Saldo{" "}
                      {formatQuantity(item.current_quantity)}{" "}
                      {UNIT_SHORT_LABELS[item.unit_of_measure]}
                    </span>
                  </span>
                  <Check className="h-4 w-4 shrink-0 text-transparent" aria-hidden />
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
      {!error && (
        <p className="mt-1 text-xs text-ink-mute">Digite ao menos 2 letras para buscar.</p>
      )}
    </div>
  );
}
