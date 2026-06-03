import { ArrowRight } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODULE_PLACEHOLDERS } from "./module-config";

/**
 * Tela de um módulo que ainda será construído. Não é um "em construção"
 * genérico: mostra, de forma concreta, o que aquela área fará — mantendo a
 * navegação, os guards de rota e a linguagem visual do produto desde já.
 */
export function PlaceholderPage({ moduleKey }: { moduleKey: string }) {
  const config = MODULE_PLACEHOLDERS[moduleKey];

  // Fallback defensivo caso uma rota aponte para uma chave inexistente.
  if (!config) {
    return (
      <PageHeader
        title="Em breve"
        description="Este módulo será implementado nas próximas fases."
      />
    );
  }

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            <Badge tone="gold">Em breve</Badge>
            <Button disabled title="Disponível em breve">
              {config.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      />

      <section aria-label="Funcionalidades planejadas">
        <h2 className="mb-3 text-sm font-medium text-ink-mute">
          O que esta área vai oferecer
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {config.features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-line bg-white p-5 shadow-card"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-inset ring-gold-100">
                <feature.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-ink">{feature.title}</h3>
              <p className="mt-1 text-sm text-ink-mute">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-6 text-xs text-ink-mute">
        A navegação e as permissões deste módulo já estão prontas. As ações ficam
        disponíveis assim que o módulo entrar no ar.
      </p>
    </>
  );
}
