import { Breadcrumbs } from "@/components/layout/breadcrumbs";

/**
 * Trilha padrão das páginas internas de Configurações:
 * Configurações › <categoria atual>.
 */
export function SettingsBreadcrumb({ current }: { current: string }) {
  return (
    <Breadcrumbs
      items={[{ label: "Configurações", to: "/settings" }, { label: current }]}
    />
  );
}
