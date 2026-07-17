# Módulo de Configurações

Central de administração do OdontoPrime. Oito categorias, todas com a mesma
arquitetura, linguagem visual e comportamento.

## Estrutura

```
settings/
  components/
    form/            Kit genérico de formulário (provider, banner, diálogo, switch)
    clinic/          Cards da categoria Clínica
    security/        Cards de Segurança
    notifications/   Cards de Notificações (config declarativa)
    integrations/    Cards de Integrações
    appearance/      Seletores de tema/densidade/idioma + preferências
    system/          Painel de saúde e informações técnicas
    backup/          Status, histórico e zona de risco
    feature-card.tsx        Shell padrão de todo card (ícone + título + corpo)
    feature-unavailable.tsx Aviso inline de recurso ainda indisponível
    settings-*.tsx          Hub: card, busca, breadcrumb, header, page-shell, danger-zone
  pages/             Uma página por categoria + hub (todas lazy no router)
  hooks/             Um par use<X>/useUpdate<X> por categoria (TanStack Query)
  services/          Um client HTTP por categoria (DTO snake_case + mappers)
  schemas/           Zod: contrato de cada formulário
  types/             Tipos compartilhados do hub
  constants.ts       Registro central das categorias (ordem, ícone, estado, busca)
```

## Padrões adotados

- **Uma fonte de verdade por categoria.** `constants.ts` define rótulo, ícone,
  estado e termos de busca; adicionar categoria = uma entrada + uma página + uma
  rota lazy.
- **Cards por `FeatureCard`.** Todo card do módulo (todas as categorias) usa o
  mesmo shell: medalhão dourado + título + descrição + badge/ações + corpo.
  `SecurityCard`, `NotificationCard`, etc. são apenas re-exports nomeados dele.
- **Formulários por `SettingsFormProvider`.** Clínica, Segurança, Notificações e
  Aparência compartilham o mesmo provider (React Hook Form + Zod), com banner de
  alterações, guarda de navegação e diálogo de saída idênticos. Inputs não
  controlados: alterar um campo não re-renderiza o formulário.
- **Degradação honesta de backend.** Endpoints inexistentes respondem 404: o GET
  trata como "nada salvo" (abre com padrões), e escritas mostram um toast claro
  (`hooks/settings-feedback.ts`) sem parecer erro do usuário. Nenhum dado se perde.
- **Segurança na apresentação.** Chaves/segredos só chegam mascarados do backend;
  IP e dados de sessão remota só aparecem quando fornecidos; nenhuma stack trace
  na UI (`lib/api.ts` normaliza erros).
- **Ações destrutivas sempre confirmadas.** `SettingsDangerZone` exige diálogo;
  operações irreversíveis (backup) exigem confirmação dupla (checkbox).

## Prontidão para tema escuro e i18n

- **Tema escuro:** o módulo usa apenas tokens semânticos (`ink`, `canvas`,
  `line`, `gold`, `graphite`, `success/warning/danger/info`) — nunca hex cru. Um
  tema escuro futuro é uma troca de tokens no nível do app, sem tocar componente.
- **i18n:** as páginas orientadas a dados (notificações, integrações, aparência)
  já centralizam os textos em objetos de configuração, prontos para extração.
