import { Hammer } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "./empty-state";

/**
 * Página temporária para os módulos que serão construídos nas próximas fases.
 * Mantém a navegação e os guards de rota funcionando desde já.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="Este módulo será implementado nas próximas fases." />
      <EmptyState
        icon={Hammer}
        title="Em construção"
        description="A funcionalidade ainda não está disponível, mas a navegação e as permissões já estão prontas."
      />
    </>
  );
}
