import { Search, X } from "lucide-react";

import { Card, CardBody } from "@/components/ui/card";
import { fieldBase } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../constants";
import type { InventoryCategory } from "../types/inventory";

export type InventoryStatusFilter = "" | "low" | "inactive";

export interface InventoryFiltersValue {
  search: string;
  category: InventoryCategory | "";
  status: InventoryStatusFilter;
}

interface InventoryFiltersProps {
  value: InventoryFiltersValue;
  onChange: (next: Partial<InventoryFiltersValue>) => void;
}

const categoryOptions = [
  { value: "", label: "Todas as categorias" },
  ...CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
];

const statusOptions: { value: InventoryStatusFilter; label: string }[] = [
  { value: "", label: "Todos os ativos" },
  { value: "low", label: "Estoque baixo" },
  { value: "inactive", label: "Inativos" },
];

/** Busca instantânea + filtros de categoria e status para a lista de itens. */
export function InventoryFilters({ value, onChange }: InventoryFiltersProps) {
  return (
    <Card className="mb-4">
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute"
            aria-hidden
          />
          <input
            type="search"
            value={value.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Buscar por nome do material…"
            aria-label="Buscar material"
            className={cn(fieldBase, "h-10 pl-9 pr-9 border-line hover:border-graphite-200")}
          />
          {value.search && (
            <button
              type="button"
              onClick={() => onChange({ search: "" })}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-mute transition-colors hover:bg-graphite-100 hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          aria-label="Filtrar por categoria"
          options={categoryOptions}
          value={value.category}
          onChange={(e) => onChange({ category: e.target.value as InventoryCategory | "" })}
        />
        <Select
          aria-label="Filtrar por status"
          options={statusOptions}
          value={value.status}
          onChange={(e) => onChange({ status: e.target.value as InventoryStatusFilter })}
        />
      </CardBody>
    </Card>
  );
}
