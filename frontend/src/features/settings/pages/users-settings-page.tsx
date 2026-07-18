import { ArrowRight, Check, KeyRound, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { SettingsPageShell } from "../components";
import { FeatureCard } from "../components/feature-card";
import { FeatureUnavailable } from "../components/feature-unavailable";
import { SettingsItem } from "../components/settings-item";

const PLANNED_ACCESS = [
  "Permissões por módulo: defina o que cada perfil vê e edita",
  "Perfis personalizados: crie papéis além dos três padrões",
];

/**
 * Configurações → Usuários e permissões. O cadastro em si vive no módulo de
 * Usuários; esta página resume o estado e aponta para lá, no mesmo padrão de
 * cards (FeatureCard) das demais categorias.
 */
export function UsersSettingsPage() {
  return (
    <SettingsPageShell categoryKey="users">
      <div className="max-w-3xl space-y-6">
        <FeatureCard
          icon={UsersRound}
          title="Equipe"
          description="Cadastro e perfis de acesso, gerenciados no módulo de Usuários."
          actions={
            <Link
              to="/users"
              className="inline-flex h-9 select-none items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink shadow-sm transition-colors duration-150 ease-out-quint hover:bg-surface-muted active:bg-graphite-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
            >
              Abrir usuários
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
          flush
        >
          <SettingsItem
            label="Gerenciar usuários"
            description="Adicionar, editar e desativar dentistas, recepção e administradores."
            control={<Badge tone="success">Ativo</Badge>}
          />
          <SettingsItem
            label="Perfis de acesso"
            description="Hoje o sistema opera com três perfis fixos."
            control={
              <div className="flex flex-wrap justify-end gap-1.5">
                <Badge tone="gold">Administrador</Badge>
                <Badge tone="neutral">Dentista</Badge>
                <Badge tone="neutral">Recepção</Badge>
              </div>
            }
          />
        </FeatureCard>

        <FeatureCard
          icon={KeyRound}
          title="Controle de acesso avançado"
          description="Permissões finas por funcionalidade, além dos perfis padrão."
          badge={<Badge tone="gold">Em breve</Badge>}
        >
          <ul className="space-y-2.5">
            {PLANNED_ACCESS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-50 ring-1 ring-inset ring-success-200"
                >
                  <Check className="h-3 w-3 text-success-600" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <FeatureUnavailable description="O controle de acesso granular chega em uma próxima fase, junto com a trilha de auditoria." />
          </div>
        </FeatureCard>
      </div>
    </SettingsPageShell>
  );
}
