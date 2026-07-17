# OdontoPrime — Design System

Fonte única de verdade visual do produto. Todo componente novo deve consumir
estes tokens e seguir estas convenções. Nada de `px`, `#hex`, sombra ou duração
soltos quando existe token.

## Tokens (definidos em `tailwind.config.js` e `src/lib/motion.ts`)

### Cor (semântica, nunca cor crua)
- **Marca / ação:** `gold-50…900` — `gold-500` é o mínimo com contraste AA sobre branco.
- **Superfícies escuras / contraste:** `graphite-50…950` (sidebar usa 800/900).
- **Texto:** `ink` (DEFAULT / `soft` / `mute`) — nunca `text-gray-*`.
- **Papel e borda:** `canvas` (fundo das telas), `line` (borda quente discreta).
- **Estado:** `success` / `warning` / `danger` / `info` (50…800). Componentes
  falam a intenção (`success`), nunca a paleta (`emerald`).
- **Erro de formulário:** `red-*` é a convenção dos controles base (Input,
  Textarea, Select) — mantida por toda a app para campos inválidos.

### Elevação (`boxShadow`)
`shadow-card` (padrão de cartões e tabelas) · `shadow-soft` · `shadow-elevated`
(diálogos/overlays) · `shadow-lift` (hover de cartão interativo) ·
`shadow-gold-glow` (hover da ação primária). Sem drop-shadow cru.

### Raio
`rounded-lg` (controles) · `rounded-xl` (0.875rem) · `rounded-2xl` (1.125rem,
cartões/tabelas) · `rounded-full` (pílulas/badges/avatares).

### Z-index (escala semântica, nunca 999)
`dropdown → sticky → drawer → modal-backdrop → modal → toast → tooltip`.

### Tipografia
Família única **Inter** (`font-sans`). Título de página:
`text-2xl font-semibold tracking-tight text-ink` (via `PageHeader` /
`ReportShell` / `SettingsPageShell`). Cabeçalho de tabela:
`text-xs font-medium uppercase tracking-wide text-ink-mute`.

## Motion (`src/lib/motion.ts`)

Curva única **`EASE = [0.22, 1, 0.36, 1]`** (out-quint), espelhada no CSS por
`ease-out-quint`. Entradas curtas, saídas mais curtas. Variantes prontas:
`pageVariants`, `overlayVariants`, `panelVariants`, `sheetVariants`,
`toastVariants`. Interações comuns (hover/focus/switch) usam transições CSS de
150–200 ms. `prefers-reduced-motion` é respeitado globalmente via
`<MotionConfig reducedMotion="user">`. Nada acima de ~280 ms, reservado à
transição de página.

## Componentes compartilhados (`src/components`)

- **UI:** `Button`, `Input`, `Select`, `Textarea`, `Switch`, `Checkbox`,
  `Badge`, `Card`, `Modal`, `Tooltip`, `IconButton`, `Skeleton`, `StatCard`.
- **Feedback:** `EmptyState`, `ErrorState`, `Loading`, `ConfirmDialog`,
  `Toaster` (auto-dismiss 4s).
- **Layout:** `AppLayout`, `Sidebar`, `Header`, `Breadcrumbs`, `PageHeader`.
- **Command palette:** `CommandPalette` (Cmd/Ctrl+K), busca via
  `utils/text.ts::normalizeText` (mesma normalização acento/caixa da busca de
  Configurações).

### Convenções de tabela (todas as 10 tabelas de dados seguem)
- Wrapper: `rounded-2xl border border-line bg-white shadow-card`.
- Cabeçalho: `<thead className="bg-graphite-50">` + `tr` com
  `text-left text-xs font-medium uppercase tracking-wide text-ink-mute`.
- Células: `px-5 py-3`; corpo com `divide-y divide-line`; linha clicável com
  `hover:bg-canvas/60`.
- Ordenação: cabeçalho com `<button>` + `aria-sort`; o rótulo leva `uppercase`
  explícito (o Preflight do Tailwind zera `text-transform` em `<button>`).
- Tabelas dentro de um `Card` não repetem `shadow-card` (o cartão já eleva).
- Mobile: lista de cartões como fallback do `<table>` (mesmo dado, sem scroll
  horizontal).

### Diálogos
Sempre via `<Modal>` (foco preso, Escape fecha, vira bottom-sheet no mobile) ou
`ConfirmDialog`. Toda ação destrutiva confirma; irreversíveis exigem
confirmação dupla (`SettingsDangerZone`).

### Estados
`Loading` → `Skeleton` com a forma do conteúdo (nunca spinner solto);
`EmptyState` e `ErrorState` compartilhados; feedback de sucesso/erro por `toast`.

## Prontidão futura

- **Tema escuro:** todos os tokens são semânticos; ligar o tema é uma troca no
  nível do app (tokens), sem tocar componente. Não implementado.
- **i18n:** páginas orientadas a dados centralizam textos em objetos de config;
  `normalizeText` já dá base para busca internacionalizada.
