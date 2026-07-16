import { m, type Variants } from "framer-motion";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { EASE } from "@/lib/motion";
import { SettingsCard, SettingsHeader, SettingsSearch } from "../components";
import { SETTINGS_CATEGORIES } from "../constants";
import { useSettingsSearch } from "../hooks/use-settings-search";

/** Entrada dos cards: fade + subida curta, em cascata discreta. */
const gridVariants: Variants = {
  animate: { transition: { staggerChildren: 0.04 } },
};
const cardVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
};

/**
 * Hub de Configurações — a central administrativa do sistema. Mostra as
 * categorias como cards navegáveis; a busca filtra instantaneamente e cada
 * card abre a própria página.
 */
export function SettingsPage() {
  const { query, setQuery, results } = useSettingsSearch(SETTINGS_CATEGORIES);

  return (
    <>
      <SettingsHeader
        title="Configurações"
        description="Preferências, segurança e administração da clínica em um só lugar."
        meta={
          <p className="hidden text-xs text-ink-mute lg:block">
            {SETTINGS_CATEGORIES.length} categorias
          </p>
        }
      />

      <div className="mb-6 max-w-xl">
        <SettingsSearch value={query} onChange={setQuery} resultCount={results.length} />
      </div>

      {results.length > 0 ? (
        <m.div
          variants={gridVariants}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {results.map((category) => (
            <m.div key={category.key} variants={cardVariants} className="h-full">
              <SettingsCard category={category} />
            </m.div>
          ))}
        </m.div>
      ) : (
        <EmptyState
          icon={SearchX}
          title="Nenhuma categoria encontrada"
          description={`Nada corresponde a "${query}". Tente outro termo, como "senha", "backup" ou "horário".`}
          action={
            <Button variant="secondary" onClick={() => setQuery("")}>
              Limpar busca
            </Button>
          }
        />
      )}
    </>
  );
}
