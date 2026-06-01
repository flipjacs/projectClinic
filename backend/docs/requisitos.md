# Requisitos — Sistema de Gerenciamento de Clínica Odontológica

## 1. Objetivo do sistema

Substituir o controle manual de fichas de pacientes e prontuários por um sistema web simples, intuitivo e seguro, focado em:

- centralizar o cadastro de pacientes;
- registrar prontuários odontológicos em formato **textual** (sem odontograma interativo nesta fase);
- organizar a agenda de atendimentos da clínica;
- preparar o terreno para controle financeiro e de estoque no futuro.

O sistema deve ser **objetivo**, eliminando funcionalidades supérfluas e priorizando o que realmente é usado no dia a dia da clínica.

---

## 2. Usuários do sistema

| Perfil          | Descrição                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------- |
| **Admin**       | Dono(a) da clínica. Gerencia usuários, configurações gerais e tem acesso total.                 |
| **Dentista**    | Profissional que atende pacientes. Cria/edita prontuários, consulta histórico e gerencia sua agenda. |
| **Recepcionista** | Faz cadastros de pacientes, agendamentos e operações administrativas básicas (a partir da Fase 2). |

> Na fase inicial, o uso será apenas pela dentista. Os perfis `recepcionista` e `dentista` adicional ganham relevância nas fases seguintes.

---

## 3. Módulos previstos

| Módulo            | Descrição                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| `auth`            | Login, refresh token, logout, recuperação de senha.                                                    |
| `users`           | CRUD de usuários do sistema, com papéis (admin, dentista, recepcionista).                              |
| `patients`        | Cadastro completo de pacientes (dados pessoais, contato, anamnese básica).                             |
| `medical_records` | Prontuário odontológico **textual** com histórico clínico cronológico, evoluções e anexos textuais.     |
| `appointments`    | Agenda de atendimentos com status (agendado, confirmado, realizado, cancelado, falta).                  |
| `finance`         | Lançamentos de receitas e despesas, vínculo com atendimentos, formas de pagamento.                     |
| `inventory`       | Controle simples de materiais e insumos (estoque, entrada, saída, alerta de mínimo).                   |
| `reports`         | Relatórios operacionais e gerenciais (atendimentos por período, faturamento, pacientes ativos etc.).   |

---

## 4. MVP inicial

O MVP foca em **eliminar as fichas de papel** e dar autonomia operacional para a dentista. Inclui:

1. **Autenticação** com JWT (login / refresh / logout).
2. **Cadastro de usuários** (apenas admin no início).
3. **Cadastro de pacientes** com dados pessoais e anamnese textual.
4. **Prontuário odontológico textual**, com:
   - histórico clínico cronológico,
   - evolução por atendimento,
   - observações clínicas em texto livre.
5. **Listagem e busca de pacientes** (por nome, CPF, telefone).
6. **Health check** e documentação Swagger.

> **Fora do MVP:** odontograma interativo, controle financeiro, integração com Google Agenda, anexos de imagens, recepcionista e múltiplos dentistas.

---

## 5. Fases do projeto

### Fase 0 — Fundação ✅
- Estrutura do projeto, Docker, banco MySQL, Alembic, FastAPI, health check.
- Documentação inicial.

### Fase 1 — Autenticação e usuários ✅
- Módulos `auth` e `users` com JWT, RBAC e admin inicial via CLI.

### Fase 2 — Pacientes e informações de saúde ✅
- Módulo `patients` com CPF validado, busca, soft delete e ficha de saúde básica (1:1).

### Fase 3 — Prontuário odontológico textual ✅
- Módulo `medical_records` com histórico cronológico, vínculo paciente↔dentista e soft delete.
- Coluna `appointment_id` reservada para integração futura.

### Fase 4 — Agenda ✅
- Módulo `appointments`: criação, remarcação, cancelamento, ciclo de status (`scheduled`, `confirmed`, `in_progress`, `completed`, `canceled`, `no_show`), detecção de conflito no service.
- Endpoint `/today` com janela em `America/Sao_Paulo`.

### Fase 5 — Procedimentos e financeiro ✅
- Módulo `procedures`: catálogo técnico com `base_price` em `NUMERIC(10,2)`, busca por nome e soft delete.
- Módulo `finance`:
  - `budgets` + `budget_items`: orçamentos com cálculo de total no backend, ciclo `DRAFT → APPROVED|REJECTED|CANCELED`.
  - `payments`: parcelas, status (`pending`, `partially_paid`, `paid`, `canceled`) e métodos (`cash`, `pix`, `credit_card`, `debit_card`, `bank_transfer`, `other`).
  - Relatórios: receita semanal, mensal, por intervalo arbitrário, pendências e painel resumido.
- Todo dinheiro em `Decimal` no Python e `NUMERIC(10,2)` no MySQL — nenhum `float`.

### Fase 6 — Estoque ✅
- Módulo `inventory`:
  - `inventory_items`: catálogo de materiais com `current_quantity`, `minimum_quantity`, `unit_of_measure`, `category`, `supplier`, `unit_price`, `expiration_date`, soft delete.
  - `inventory_movements`: histórico imutável de entradas (`IN`), saídas (`OUT`) e ajustes (`ADJUSTMENT`), com `resulting_quantity` e `created_by_user_id` para auditoria.
  - Lock pessimista (`SELECT ... FOR UPDATE`) no service + transação única protegem `current_quantity` de race conditions.
  - Alertas: estoque baixo (`current_quantity ≤ minimum_quantity`) e vencimento próximo (janela configurável, default 30 dias em `America/Sao_Paulo`).
  - `ADJUSTMENT` restrito a `ADMIN`; `IN`/`OUT` aceitos por `ADMIN`/`RECEPTIONIST`.

### Fase 7 — Relatórios e refinamentos (planejada)
- Módulo `reports`: indicadores operacionais cruzados (atendimentos × receita × procedimentos mais comuns).
- Notificações (lembrete de consulta, aniversário etc.).
- Despesas (`expenses`) para fechar o ciclo do fluxo de caixa.
- Auditoria estruturada básica em `audit_logs` para ações sensíveis. Próxima evolução: diff mascarado, IP, user-agent e política de retenção.
- Possível odontograma interativo (avaliar necessidade real).
- Integração futura com Google Agenda (fora do MVP).

---

## 6. Regras gerais de desenvolvimento

### Arquitetura
- **Monólito modular**. Um diretório por módulo, com `models / schemas / repository / service / routes`.
- **Routes** apenas orquestram: validação de entrada, chamada ao service, formatação da resposta.
- **Services** concentram regras de negócio.
- **Repositories** isolam o acesso ao banco. Nenhuma query SQLAlchemy fora deles.
- **Schemas** Pydantic separados para entrada e saída (`*Create`, `*Update`, `*Read`).

### Banco e migrations
- Toda mudança de schema passa por **migration Alembic versionada**.
- Migrations devem ser revisadas manualmente após `--autogenerate`.
- Convenção de nomes de constraints definida em `app/database/base.py`.

### Segurança
- Variáveis sensíveis **somente** em `.env`. Nunca versionado.
- `SECRET_KEY` exigida com no mínimo 32 caracteres.
- Senhas armazenadas com hash (`argon2` por padrão; `bcrypt` suportado para hashes legados).
- JWT com expiração curta para access token e refresh token separado.
- Login protegido com rate limit por IP + email. Em produção horizontal, trocar o armazenamento em memória por Redis.
- Endpoints protegidos por dependência de autenticação.
- Controle de acesso baseado em papéis (`Role` em `app/core/permissions.py`).
- Listagens e dashboard usam respostas enxutas para reduzir exposição de CPF, endereço e dados financeiros.
- CORS restrito por ambiente.
- Documentação Swagger desligada em produção.

### Qualidade
- Código limpo, com nomes descritivos.
- Tipagem estática consistente (`from __future__ import annotations` quando útil).
- Testes automatizados para as regras críticas (services).
- Audit log transacional para operações sensíveis; logs de aplicação não devem carregar CPF, senha, prontuário ou payload financeiro completo.

### Versionamento
- `.gitignore` cobre `.env`, dados de banco, caches e ambientes virtuais.
- Commits pequenos e descritivos.
- Migrations sempre acompanham o PR que altera modelos.

### Deploy
- Imagem Docker reprodutível.
- Variáveis de ambiente injetadas pelo orquestrador (Compose, Kubernetes ou similar).
- Healthcheck em `/health` para orquestração.
