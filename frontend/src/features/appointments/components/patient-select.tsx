import { Check, Search, X } from "lucide-react";
import { useId, useState } from "react";

import { usePatientsList } from "@/features/patients/hooks/use-patients";
import { useDebounce } from "@/hooks/use-debounce";
import { fieldBase } from "@/components/ui/input";
import { cn } from "@/utils/cn";

interface PatientSelectProps {
  value: number | null;
  selectedLabel?: string | null;
  onChange: (patient: { id: number; name: string } | null) => void;
  label?: string;
  error?: string;
}

/** Busca + seleção de paciente (debounce, sem carregar todos os pacientes). */
export function PatientSelect({
  value,
  selectedLabel,
  onChange,
  label = "Paciente",
  error,
}: PatientSelectProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const [query, setQuery] = useState("");
  const [name, setName] = useState(selectedLabel ?? "");
  const search = useDebounce(query.trim(), 350);

  const { data, isFetching } = usePatientsList({
    search,
    page: 1,
    pageSize: 8,
  });

  const showResults = query.trim().length >= 2 && !value;

  if (value) {
    return (
      <div className="w-full">
        <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2">
          <span className="truncate text-sm font-medium text-ink">{name || "Paciente selecionado"}</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setName("");
              setQuery("");
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-ink-mute transition-colors hover:bg-graphite-100 hover:text-ink"
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
          placeholder="Buscar por nome, CPF ou telefone…"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            fieldBase,
            "h-10 pl-9 pr-3",
            error ? "border-red-400" : "border-line hover:border-graphite-200",
          )}
        />
      </div>

      {showResults && (
        <ul className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-soft">
          {isFetching && (!data || data.items.length === 0) ? (
            <li className="px-3 py-2 text-sm text-ink-mute">Buscando…</li>
          ) : !data || data.items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-mute">Nenhum paciente encontrado.</li>
          ) : (
            data.items.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange({ id: p.id, name: p.name });
                    setName(p.name);
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-gold-50"
                >
                  <span className="truncate">{p.name}</span>
                  <Check className="h-4 w-4 shrink-0 text-gold-600 opacity-0" aria-hidden />
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
