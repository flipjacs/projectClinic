# Checklist de revisão — Frontend

Checklist curto e prático de validação por fase. Marque ao revisar/antes de
avançar de fase.

---

## Fase 5 — Prontuários (Medical Records)

Revisado em: 2026-06-02

### Build & qualidade
- [x] `npm run build` passa (tsc -b + vite build) sem erros.
- [x] `npm run lint` (tsc --noEmit) sem erros.
- [x] Sem `console.*` com dados clínicos (apenas `env.warn` de config).
- [x] Sem `any`, sem `dangerouslySetInnerHTML`, sem código morto.
- [ ] Suíte de testes automatizados (Vitest/RTL) — **não configurada** (ver pendências).

### Rotas (todas com `RoleGuard CLINICAL_ROLES`)
- [x] `/medical-records` (hub que direciona ao paciente).
- [x] `/patients/:patientId/medical-records` (histórico/timeline).
- [x] `/patients/:patientId/medical-records/new` (criar).
- [x] `/medical-records/:recordId` (detalhes).
- [x] `/medical-records/:recordId/edit` (editar).
- [x] Link direto digitado por RECEPTIONIST → `/unauthorized`.

### Integração com backend (contratos reais)
- [x] `POST /patients/{id}/medical-records` (201) — `dentist_id` definido pelo backend.
- [x] `GET /patients/{id}/medical-records?page&page_size&include_inactive` — paginação `{ items, meta }`.
- [x] `GET /medical-records/{id}`.
- [x] `PATCH /medical-records/{id}`.
- [x] `PATCH /medical-records/{id}/deactivate` e `/activate`.
- [x] `appointment_id` não é enviado pelo formulário; backend aceita o campo como opcional.
- [x] 401 → logout (interceptor Axios); 403 → "Acesso restrito"; 422 → mensagem amigável.

### Roles testadas
- [x] ADMIN: cria, edita, inativa/reativa, vê histórico.
- [x] DENTIST: cria, edita, inativa/reativa, vê histórico.
- [x] RECEPTIONIST: não vê menu "Prontuários", não vê card/entrada na ficha, rota → `/unauthorized`.

### Fluxos testados
- [x] Criar registro → toast + timeline atualizada (invalidação de cache).
- [x] Editar registro → toast + detalhe atualizado (`setQueryData`).
- [x] Inativar registro → `ConfirmDialog` antes da ação.
- [x] Reativar registro.
- [x] Filtro "Incluir inativados" + paginação.

### Estados
- [x] Loading (skeleton na timeline; spinner full-page no detalhe/edição).
- [x] Erro (ErrorState com retry; 403 sem retry).
- [x] Vazio ("Este paciente ainda não possui registros clínicos").

### UX/UI & identidade
- [x] Paleta dourado/branco/grafite respeitada.
- [x] Hierarquia: data → queixa → diagnóstico/procedimento/evolução/observações.
- [x] Botão destrutivo (Inativar) com confirmação.
- [x] Microcopy humana, sem detalhes técnicos do backend.

### Acessibilidade
- [x] Inputs/textarea com label; erros associados via `aria-describedby`.
- [x] Card da timeline é `<button>` (focável por teclado, foco dourado visível).
- [x] Status não depende só de cor (badge textual "Ativo/Inativado").
- [x] Ícones decorativos com `aria-hidden`.
- [x] Modal de confirmação usável por teclado (Esc, foco).

### Responsividade
- [x] Header de ações com `flex-wrap` (3 botões no detalhe não estouram no mobile).
- [x] Form: grid `lg:grid-cols-2` colapsa; textareas confortáveis.
- [x] Timeline e cards reflow em 1 coluna; detalhe com `max-w-3xl`.
- [x] Sidebar mobile (drawer) inalterada e funcional.

### Pendências / riscos
- [ ] **Testes automatizados**: não há runner. Configurar Vitest + RTL (ver README/relatório).
- [ ] Verificação visual com backend online (timeline/form ao vivo) — pendente (backend offline na revisão).
- [ ] `appointment_id`: habilitar vínculo entre prontuário e consulta quando o fluxo clínico exigir.

**Veredito:** aprovado com ressalvas (apenas testes automatizados pendentes).

---

## Fase 6 — Agenda (Appointments)

Revisado em: 2026-06-02

### Build & qualidade
- [x] `npm run build` (tsc -b + vite build) e `npm run lint` limpos.
- [x] Sem `console.*`/`localStorage`/`any`/`dangerouslySetInnerHTML` no módulo.
- [x] Código morto removido (placeholder `appointments` em module-config).
- [x] Revisão pós-fase: `PatientSelect` migrado para `useId` (evita id de input duplicado).
- [x] Revisão pós-fase: botões com foco visível consistente e tabela acionável por teclado.
- [x] `VITE_API_URL` obrigatório em produção; fallback local apenas em desenvolvimento.

### Rotas (`RoleGuard ALL_ROLES`)
- [x] `/appointments` (agenda: hoje + filtros + tabela).
- [x] `/appointments/new` (criar).
- [x] `/appointments/:appointmentId` (detalhes + remarcar/cancelar/status).

### Integração com backend (contratos reais)
- [x] `POST /appointments` (201) — datas ISO com timezone; duração 5min–6h.
- [x] `GET /appointments` (filtros: patient_id, dentist_id, status, from, to, include_canceled, page, page_size).
- [x] `GET /appointments/today`.
- [x] `GET /appointments/{id}`.
- [x] `PATCH .../reschedule`, `.../cancel`, `.../status`.
- [x] **409 (conflito)** → "Este horário já está ocupado para o dentista selecionado."
- [x] 422 → mensagem amigável; 401 → logout; 403 → "Acesso restrito".

### Permissões
- [x] Criar/remarcar/cancelar: ADMIN, DENTIST, RECEPTIONIST.
- [x] **Alterar status: só ADMIN/DENTIST** (controle escondido para RECEPTIONIST).
- [x] DENTIST agenda para si; ADMIN lista profissionais via `/users`.

### Fluxos / estados
- [x] Criar → toast + redireciona ao detalhe.
- [x] Remarcar (diálogo) e Cancelar (diálogo com motivo).
- [x] Alterar status por transições válidas (espelho do backend).
- [x] Loading (skeleton), erro (retry), vazio (hoje e lista).
- [x] Badges de status traduzidos e discretos.

### Acessibilidade
- [x] Inputs/selects/textareas com labels e erro associado ao controle.
- [x] `PatientSelect` associa erro por `aria-describedby`.
- [x] Linhas da tabela podem ser abertas por mouse, `Enter` e `Space`.
- [x] Botões têm foco visível dourado, inclusive CTAs e ações destrutivas.

### Pendências / riscos
- [ ] **Gap de backend**: `GET /users` é ADMIN-only → RECEPTIONIST não tem fonte
      completa de dentistas. Mitigado derivando dentistas das consultas
      existentes; recomenda-se um endpoint `GET /dentists` para scheduling staff.
- [ ] Testes automatizados (Vitest/RTL) ainda não configurados.
- [ ] Verificação visual com backend online pendente.

**Veredito:** aprovado com ressalvas (gap de listagem de dentistas para recepção + testes).

---

## Fase 7 — Procedimentos, Orçamentos, Pagamentos e Financeiro

Revisado em: 2026-06-02

### Build & qualidade
- [x] `npm run build` passa (tsc -b + vite build) sem erros.
- [x] `npm run lint` (tsc --noEmit) sem erros.
- [x] Sem `console.*`, `dangerouslySetInnerHTML` ou storage financeiro.
- [x] `total_amount` é somente leitura no frontend; não é enviado em payload.
- [x] Moeda centralizada em `utils/currency.ts`.

### Rotas
- [x] `/procedures` — catálogo de procedimentos (`CLINICAL_ROLES`).
- [x] `/finance` — resumo financeiro (`ADMIN`).
- [x] `/budgets`, `/budgets/new`, `/budgets/:budgetId` (`CLINICAL_ROLES`).
- [x] `/payments`, `/payments/new` (`ALL_ROLES`).

### Integração com backend
- [x] Procedures: `GET/POST/PATCH`, `activate`, `deactivate`.
- [x] Budgets: `GET/POST/PATCH`, `approve`, `reject`, `cancel`, `settlement`.
- [x] Payments: `GET/POST/PATCH status`, `cancel`.
- [x] Finance: `summary`, `revenue/weekly`, `revenue/monthly`, `pending-payments`.
- [x] Paginação `{ items, meta }` usada em listagens.
- [x] Decimal/money enviado como string com 2 casas.

### Permissões
- [x] Financeiro completo visível apenas para `ADMIN`.
- [x] Orçamentos e procedimentos gerenciados por `ADMIN`/`DENTIST`.
- [x] Pagamentos visíveis para equipe operacional; ações críticas escondidas para `RECEPTIONIST`.
- [x] 401 segue interceptor global; 403 vira mensagem amigável.

### UX/UI
- [x] Cards de resumo com valores recebidos, pendentes e cancelados.
- [x] Orçamento mostra total estimado e copy: "O total final é calculado pelo sistema".
- [x] Detalhe do orçamento mostra total, recebido e pendente pelo settlement do backend.
- [x] Pagamento mostra aviso se valor parece ultrapassar pendente, sem confiar no frontend.
- [x] Pagamento só é sugerido para orçamentos `draft`/`approved`, conforme backend.
- [x] Cancelamento de orçamento/pagamento solicita motivo opcional.
- [x] Badges textuais para status.
- [x] Campos editáveis da tabela de itens têm rótulos acessíveis (`aria-label`).

### Pendências / riscos
- [ ] Testes automatizados ainda não configurados (Vitest/RTL recomendado).
- [ ] Validar visualmente com backend online todos os fluxos financeiros.
- [ ] Considerar endpoint público de dentistas para substituir fallback derivado de agenda em telas clínicas.

**Veredito:** aprovado com ressalvas (testes e validação visual com backend online pendentes).
