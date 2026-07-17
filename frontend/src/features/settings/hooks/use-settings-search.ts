import { useMemo, useState } from "react";

import { normalizeText } from "@/utils/text";
import type { SettingsCategory } from "../types/settings";

/**
 * Filtro instantâneo das categorias do hub. Compara o termo (normalizado)
 * contra rótulo, descrição e keywords de cada categoria. Sem debounce de
 * propósito: a lista é pequena e o feedback imediato é parte da experiência.
 */
export function useSettingsSearch(categories: SettingsCategory[]) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return categories;
    return categories.filter((category) => {
      const haystack = [category.label, category.description, ...category.keywords]
        .map(normalizeText)
        .join(" ");
      return haystack.includes(term);
    });
  }, [categories, query]);

  return { query, setQuery, results };
}
