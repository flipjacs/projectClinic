import { ArrowRight, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import {
  SettingsGroup,
  SettingsItem,
  SettingsPageShell,
  SettingsPlaceholder,
  SettingsSection,
} from "../components";

export function UsersSettingsPage() {
  return (
    <SettingsPageShell categoryKey="users">
      <SettingsGroup>
        <SettingsSection
          title="Equipe"
          description="O cadastro de usuários já está ativo no módulo de Usuários."
        >
          <SettingsItem
            label="Gerenciar usuários"
            description="Adicionar, editar e desativar dentistas, recepção e administradores."
            control={
              <Link
                to="/users"
                className="inline-flex h-9 select-none items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-medium text-ink shadow-sm transition-colors duration-150 ease-out-quint hover:bg-graphite-50 active:bg-graphite-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2"
              >
                Abrir usuários
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            }
          />
          <SettingsItem
            label="Perfis de acesso"
            description="Hoje o sistema opera com três perfis: administrador, dentista e recepção."
            control={
              <div className="flex flex-wrap gap-1.5">
                <Badge tone="gold">Administrador</Badge>
                <Badge tone="neutral">Dentista</Badge>
                <Badge tone="neutral">Recepção</Badge>
              </div>
            }
          />
        </SettingsSection>

        <SettingsPlaceholder
          icon={KeyRound}
          title="Controle de acesso avançado"
          description="Permissões finas por funcionalidade chegam em uma próxima fase."
          planned={[
            { title: "Permissões por módulo", text: "Defina o que cada perfil vê e edita." },
            { title: "Perfis personalizados", text: "Crie papéis além dos três padrões." },
          ]}
        />
      </SettingsGroup>
    </SettingsPageShell>
  );
}
