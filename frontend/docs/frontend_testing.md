# Frontend Testing

Base de testes automatizados do frontend da clínica odontológica.

## Dependências

As dependências de teste ficam em `devDependencies`:

- `vitest`
- `jsdom`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `msw`
- `@vitest/coverage-v8`

Para reinstalar em outro ambiente:

```bash
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw @vitest/coverage-v8
```

## Comandos

```bash
npm test
npm run test:watch
npm run test:coverage
```

`npm test` roda a suíte uma vez. `test:watch` é para desenvolvimento. `test:coverage` gera relatório textual, HTML e LCOV.

## MSW

Os testes não devem chamar o backend real. O servidor MSW fica em `src/test/msw/server.ts`, os handlers em `src/test/msw/handlers.ts` e os dados fake em `src/test/msw/fixtures.ts`.

Use `server.use(...)` dentro do teste para sobrescrever um endpoint específico, por exemplo para simular `401`, `403`, `409`, `422` ou `500`. O setup global reseta os handlers após cada teste.

## Fixtures e factories

Factories ficam em `src/test/factories/`. Elas criam dados sintéticos e seguros para usuários, pacientes, prontuários, agenda, financeiro e estoque.

Regras:

- Não usar dados reais de pacientes.
- Não usar tokens reais.
- Não criar `password_hash` renderizável.
- Preferir pequenas variações via override em vez de duplicar objetos grandes.

## Render com providers

Use `renderWithProviders` para componentes isolados e `renderWithRouter` para telas com rotas.

Cada render cria um `QueryClient` novo por padrão, com retry desativado. Isso mantém os testes isolados e evita chamadas duplicadas que escondem falhas.

## Boas práticas

- Testar comportamento do usuário, não detalhes internos.
- Priorizar `getByRole`, `getByLabelText` e textos visíveis.
- Evitar snapshots grandes.
- Simular API com MSW, não com mocks soltos de Axios.
- Verificar mensagens amigáveis para erros.
- Verificar que links e ações respeitam RBAC.
- Limpar `localStorage` e `sessionStorage` entre testes.

## O que não fazer

- Não bater no backend real.
- Não salvar senha, token real ou dado clínico real em fixture.
- Não expor detalhes técnicos como stack trace no teste de UI.
- Não testar implementação frágil, como nomes de classes Tailwind.
- Não depender da ordem de execução.

## Cobertura

Meta inicial configurada:

- statements: 70%
- branches: 60%
- functions: 65%
- lines: 70%

Essa meta é deliberadamente moderada para a primeira fundação. A evolução recomendada é ampliar testes por módulo e depois subir gradualmente para 80% em statements/lines, mantendo branches em nível realista.

## Próximos testes recomendados

- Pacientes: listagem, busca, cadastro, edição e validação.
- Prontuários: criação/edição bloqueada para `RECEPTIONIST`.
- Agenda: conflito `409` com mensagem humana.
- Financeiro: pagamento acima do permitido e invalidação de cache.
- Estoque: entrada/saída, baixo estoque e item vencendo.
- Relatórios: filtros por data.
- Usuários: acesso somente `ADMIN`.
- Acessibilidade: foco visível, modais por teclado e erros associados aos campos.
