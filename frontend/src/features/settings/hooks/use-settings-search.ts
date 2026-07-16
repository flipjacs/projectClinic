import { useMemo, useState } from "react";

import type { SettingsCategory } from "../types/settings";

/** Remove acentos e baixa a caixa — busca tolerante a "seguranca"/"Segurança". */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtro instantâneo das categorias do hub. Compara o termo (normalizado)
 * contra rótulo, descrição e keywords de cada categoria. Sem debounce de
 * propósito: a lista é pequena e o feedback imediato é parte da experiência.
 */
export function useSettingsSearch(categories: SettingsCategory[]) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = normalize(query);
    if (!term) return categories;
    return categories.filter((category) => {
      const haystack = [category.label, category.description, ...category.keywords]
        .map(normalize)
        .join(" ");
      return haystack.includes(term);
    });
  }, [categories, query]);

  return { query, setQuery, results };
}
