import { Palette } from "lucide-react";

import { SettingsGroup, SettingsPageShell, SettingsPlaceholder } from "../components";

export function AppearanceSettingsPage() {
  return (
    <SettingsPageShell categoryKey="appearance">
      <SettingsGroup>
        <SettingsPlaceholder
          icon={Palette}
          description="Personalização da interface por usuário — sem afetar o que os colegas veem."
          planned={[
            { title: "Tema", text: "Claro, escuro ou automático pelo sistema." },
            { title: "Densidade", text: "Espaçamento confortável ou compacto nas listas." },
            { title: "Idioma", text: "Português hoje; outros idiomas no futuro." },
            { title: "Acessibilidade", text: "Contraste elevado e redução de movimento." },
            { title: "Cores de destaque", text: "Ajuste fino da paleta dentro da identidade." },
          ]}
        />
      </SettingsGroup>
    </SettingsPageShell>
  );
}
