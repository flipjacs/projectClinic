# OdontoPrime · Frontend

Frontend do sistema de gestão para clínica odontológica. SPA em **React + Vite +
TypeScript**, com **Tailwind CSS**, **React Router**, **TanStack Query**,
**Axios**, **React Hook Form + Zod**, **Zustand** e **Lucide React**.

Backend: API FastAPI com autenticação JWT e perfis **ADMIN / DENTIST /
RECEPTIONIST**.

## Pré-requisitos

- Node.js 18+ (testado com Node 22)
- Backend rodando (por padrão em `http://localhost:8000`)

## Instalação e execução

```bash
cd frontend
cp .env.example .env        # ajuste VITE_API_URL se necessário
npm install
npm run dev                 # http://localhost:5173
```

Outros comandos:

```bash
npm run build     # type-check (tsc -b) + build de produção
npm run preview   # serve o build localmente
npm run lint      # apenas type-check (tsc --noEmit)
```

## Configuração

A URL base da API vem **somente** de variável de ambiente:

```
VITE_API_URL=http://localhost:8000/api/v1
```

Nada de URL ou token hardcoded no código.

## Identidade visual — "OdontoPrime"

Sistema de design próprio, pensado para uma clínica odontológica premium: calmo,
confiável e organizado, sem cara de template genérico de dashboard.

**Paleta** (definida em `tailwind.config.js`):

| Token | Uso |
|-------|-----|
| `gold-*` | Cor principal: ação, item ativo, foco, destaques. `gold-500` é a ação. |
| `graphite-*` | Superfícies escuras (sidebar) e contraste. `graphite-900` é a sidebar. |
| `ink` / `ink-soft` / `ink-mute` | Texto: títulos, corpo e apoio. |
| `canvas` | Fundo das telas (branco quente, papel calmo). |
| `line` | Bordas discretas sobre o papel. |
| `emerald / amber / red / sky` | **Apenas** status e alertas, de forma discreta. |

**Princípios**

- Dourado é destaque, não decoração: usado em ação, seleção e foco.
- Sidebar grafite com marca dourada; conteúdo em papel quente com cards brancos.
- Tipografia **Inter** (carregada via Google Fonts), uma família só, hierarquia
  por escala + peso.
- Sombras leves, espaçamento generoso, cantos arredondados consistentes.
- Movimento curto e intencional (150–280 ms) e com respeito a
  `prefers-reduced-motion`.
- Foco sempre visível (anel dourado) e status nunca dependem só de cor.

## Design system (`components/ui`)

- **Button** — variantes `primary | secondary | outline | ghost | danger`,
  tamanhos `sm | md | lg`, estado `isLoading`.
- **Badge** — tons `gold | neutral | success | warning | danger | info`.
- **Card** — variantes `default | elevated | interactive` (+ `CardHeader`,
  `CardBody`, `CardTitle`).
- **Input / Select / Textarea** — label, erro, dica, `aria-describedby`,
  estados de foco/erro/disabled padronizados.
- **Modal** — acessível (`role="dialog"`, Esc, scroll-lock), com `ConfirmDialog`.
- **StatCard** — métrica do painel (número grande + dica, destaque dourado).
- **FormField**, **Skeleton** — apoio a formulários e carregamento.
- **Feedback** — `Loading`, `EmptyState`, `ErrorState`, `RouteFallback`,
  `UnauthorizedPage` e `PlaceholderPage` (telas planejadas dos módulos futuros).

## Estrutura de pastas

```
src/
├── app/                  # providers globais + router (lazy/code splitting)
├── components/
│   ├── brand/            # Logo / LogoMark (marca OdontoPrime)
│   ├── ui/               # Button, Input, Select, Textarea, Card, Badge,
│   │                     #   Modal, StatCard, FormField, Skeleton
│   ├── layout/           # AppLayout, Sidebar (grafite), Header, NavItem,
│   │                     #   MobileSidebar, SidebarContent, PageHeader
│   ├── feedback/         # Loading, EmptyState, ErrorState, RouteFallback,
│   │                     #   Unauthorized, Placeholder (+ module-config)
│   └── auth/             # ProtectedRoute, RoleGuard
├── config/               # env.ts (VITE_API_URL)
├── features/
│   ├── auth/             # login, /auth/me, hook de sessão
│   ├── dashboard/        # painel inicial (GET /dashboard)
│   ├── patients/         # CRUD de pacientes + ficha de saúde
│   └── medical-records/ appointments/ procedures/ finance/
│       inventory/ reports/ users/        (próximas fases)
├── hooks/
├── lib/                  # api (Axios + interceptors), query-client, permissions
├── stores/               # auth-store (token, Zustand + persist), toast-store
├── types/                # api, roles
├── utils/                # cn, formatação pt-BR, masks
├── main.tsx
└── index.css
```

## Autenticação e segurança

- Login em `POST /auth/login` (form-urlencoded; e-mail no campo `username`).
- O **token** é guardado no Zustand (persistido em `localStorage`); a **senha
  nunca** é salva e o token não é exibido em tela.
- O **usuário logado** é buscado em `GET /auth/me` via TanStack Query (cache,
  sem refetch em foco), evitando chamadas repetidas. Dados clínicos não vão para
  o `localStorage`.
- O interceptor do Axios injeta `Authorization: Bearer <token>` e, ao receber
  **401**, limpa a sessão e redireciona para `/login`. **403** mostra acesso
  restrito.
- `ProtectedRoute` exige sessão; `RoleGuard` restringe por perfil; sem permissão
  vai para `/unauthorized`.

> A ocultação de menus por perfil é apenas UX. A proteção **real** de dados é o
> RBAC do backend.

## Navegação por perfil

| Item | ADMIN | DENTIST | RECEPTIONIST |
|------|:----:|:-------:|:------------:|
| Dashboard, Pacientes, Agenda, Estoque | ✅ | ✅ | ✅ |
| Prontuários, Procedimentos, Relatórios | ✅ | ✅ | — |
| Financeiro, Usuários, Configurações | ✅ | — | — |

## Performance

- **Code splitting por rota**: cada página (`React.lazy`) vira um chunk próprio;
  o bundle inicial fica enxuto e cada tela só chega quando é acessada.
- `Suspense` com `RouteFallback` (tela cheia) no primeiro acesso e `Loading`
  dentro do `AppLayout` ao trocar de rota (a sidebar/header permanecem).
- Cache do TanStack Query e `staleTime` curto no painel.

## Rotas

`/login`, `/dashboard`, `/unauthorized` e os módulos
(`/patients`, `/appointments`, `/medical-records`, `/procedures`, `/finance`,
`/inventory`, `/reports`, `/users`, `/settings`). Os módulos ainda não
implementados têm **telas planejadas** (descrição + funcionalidades futuras),
já protegidas por perfil, até serem construídos nas próximas fases.
