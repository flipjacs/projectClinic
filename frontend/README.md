# Clínica · Frontend

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

## Estrutura de pastas

```
src/
├── app/                  # providers globais + router
│   ├── providers.tsx
│   └── router.tsx
├── assets/
├── components/
│   ├── ui/               # Button, Input, Select, Textarea, Card, Badge
│   ├── layout/           # AppLayout, Sidebar, Header, NavItem, MobileSidebar, PageHeader
│   ├── feedback/         # Loading, EmptyState, ErrorState, Unauthorized, Placeholder
│   └── auth/             # ProtectedRoute, RoleGuard
├── config/
│   └── env.ts            # leitura da VITE_API_URL
├── features/
│   ├── auth/             # login, /auth/me, hook de sessão
│   ├── dashboard/        # painel inicial (GET /dashboard)
│   ├── users/ patients/ medical-records/ appointments/
│   ├── procedures/ finance/ inventory/ reports/   (próximas fases)
├── hooks/
├── lib/
│   ├── api.ts            # Axios + interceptors (Bearer, 401)
│   ├── query-client.ts   # TanStack Query
│   └── permissions.ts    # navegação por perfil + RoleGuard helpers
├── stores/
│   └── auth-store.ts     # token (Zustand + persist)
├── types/
│   ├── api.ts
│   └── roles.ts
├── utils/                # cn, formatação pt-BR
├── main.tsx
└── index.css
```

## Autenticação

- Login em `POST /auth/login` (form-urlencoded; e-mail no campo `username`).
- O **token** é guardado no Zustand (persistido em `localStorage`); a **senha
  nunca** é salva e o token não é exibido em tela.
- O **usuário logado** é buscado em `GET /auth/me` via TanStack Query (cache,
  sem refetch em foco) — evita chamadas repetidas.
- O interceptor do Axios injeta `Authorization: Bearer <token>` e, ao receber
  **401**, limpa a sessão e redireciona para `/login`.
- `ProtectedRoute` exige sessão; `RoleGuard` restringe por perfil; sem permissão
  → `/unauthorized`.

> A ocultação de menus por perfil é apenas UX. A proteção **real** de dados é o
> RBAC do backend.

## Navegação por perfil

| Item | ADMIN | DENTIST | RECEPTIONIST |
|------|:----:|:-------:|:------------:|
| Dashboard, Pacientes, Agenda, Estoque | ✅ | ✅ | ✅ |
| Prontuários, Procedimentos, Relatórios | ✅ | ✅ | — |
| Financeiro, Usuários, Configurações | ✅ | — | — |

## Decisões visuais

- **Dourado** (`gold-*`) para ação principal, item ativo, foco e destaques.
- **Branco/off-white** como fundo; **preto/grafite** (`ink`) para texto.
- Cinzas neutros para equilíbrio. Sem gradientes pesados nem excesso de animação.
- Ícones simples (Lucide), espaçamento confortável, layout responsivo.

## Rotas

`/login`, `/dashboard`, `/unauthorized` e os módulos
(`/patients`, `/appointments`, `/medical-records`, `/procedures`, `/finance`,
`/inventory`, `/reports`, `/users`, `/settings`) — estes últimos já protegidos e
com páginas placeholder até serem implementados nas próximas fases.
