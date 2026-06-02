# Clinic Management API

API backend para gerenciamento de uma clínica odontológica, construída em **Python + FastAPI** com arquitetura modular inspirada em Clean Architecture leve.

> **Status atual:** Fase 6 — estoque de materiais com movimentações auditáveis e alertas, sobre catálogo + financeiro (Fase 5), agenda (Fase 4), prontuário (Fase 3), pacientes (Fase 2) e auth/RBAC (Fase 1).

---

## Stack

- **Linguagem:** Python 3.12
- **Framework:** FastAPI
- **ORM:** SQLAlchemy 2.x
- **Migrations:** Alembic
- **Banco:** MySQL 8 (preparado para PostgreSQL via `DB_DRIVER=postgresql`)
- **Validação:** Pydantic v2 + pydantic-settings
- **Autenticação:** JWT (`python-jose`) + OAuth2 Password Flow
- **Hash de senha:** argon2 por padrão; bcrypt suportado para hashes legados (`passlib`)
- **Containers:** Docker + Docker Compose

---

## Estrutura do projeto

```
backend/
├── app/
│   ├── main.py                # Bootstrap do FastAPI
│   ├── cli/                   # Scripts CLI (ex.: criar admin inicial)
│   ├── core/                  # Config, segurança, permissões
│   ├── database/              # Engine, sessão e Base do SQLAlchemy
│   ├── modules/               # Um diretório por módulo de negócio
│   │   ├── auth/
│   │   ├── users/
│   │   └── ...
│   └── shared/                # Utilitários compartilhados (exceptions, pagination)
├── alembic/                   # Configuração e migrations
├── tests/
├── docs/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── .env.example
```

Cada módulo segue o padrão `models / schemas / repository / service / routes` (`auth` ainda tem `dependencies.py` para os helpers de autorização).

---

## Pré-requisitos

- Docker >= 24 e Docker Compose v2.

Para rodar localmente sem Docker: Python 3.12+ e MySQL 8 (ou Postgres 16).

---

## Configuração

1. Copie o arquivo de exemplo e ajuste as variáveis:

   ```bash
   cp .env.example .env
   ```

2. Gere uma `SECRET_KEY` forte e cole no `.env`:

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(64))"
   ```

3. Ajuste, se desejar, as variáveis do admin inicial:

   ```env
   INITIAL_ADMIN_NAME=Dra. Fulana
   INITIAL_ADMIN_EMAIL=dra@clinic.com
   INITIAL_ADMIN_PASSWORD=senha-forte-123
   ```

---

## Executando com Docker

```bash
docker compose up --build
```

Disponível em:

- Swagger UI: http://localhost:8000/docs
- Redoc:      http://localhost:8000/redoc
- Health:     http://localhost:8000/health

Logs / parar / reset:

```bash
docker compose logs -f api
docker compose down
docker compose down -v   # zera o volume do MySQL
```

---

## Migrations

As migrations criam todo o schema, incluindo usuários, pacientes, prontuários,
agenda, financeiro, estoque, audit log e índices de busca.

```bash
docker compose exec api alembic upgrade head           # aplicar
docker compose exec api alembic downgrade -1           # reverter última
docker compose exec api alembic history                # histórico
docker compose exec api alembic revision --autogenerate -m "desc"
```

---

## Criando o primeiro admin

O script CLI é **idempotente** — se já existir algum admin, ele encerra sem alterar nada.

### Opção 1 — usando variáveis de ambiente

Defina `INITIAL_ADMIN_*` no `.env` e rode:

```bash
docker compose exec api python -m app.cli.create_admin
```

### Opção 2 — passando argumentos

```bash
docker compose exec api python -m app.cli.create_admin \
  --name "Dra. Fulana" \
  --email "dra@clinic.com" \
  --password "senha-forte-123"
```

### Opção 3 — modo interativo

```bash
docker compose exec -it api python -m app.cli.create_admin
# pedirá nome, email e senha
```

> Após o primeiro admin, novos usuários (de qualquer role) devem ser criados pelo endpoint `POST /api/v1/users` por um admin autenticado.

> ⚠️ O e-mail precisa ter um TLD público válido (`.com`, `.com.br`, …). TLDs
> reservados como `.local` / `.test` são **rejeitados** pelo validador de e-mail.
> O `.env.example` já traz um valor válido (`admin@clinic.com.br`). A senha é
> sempre armazenada como hash argon2.

### Proteção do último ADMIN

O sistema garante que **nunca fique sem nenhum ADMIN ativo**:

- um ADMIN **não pode** inativar a si próprio nem rebaixar o próprio role;
- o último ADMIN ativo **não pode** ser inativado nem rebaixado para outro role
  (guarda de defesa em profundidade no `UserService`, com `count_active_admins`);
- outro ADMIN **pode** ser inativado/rebaixado normalmente desde que ainda reste
  ao menos um ADMIN ativo.

Na prática, a única forma de remover o "último" admin via HTTP seria a
auto-inativação/auto-rebaixamento — ambos bloqueados primeiro. A guarda do último
admin é, portanto, defesa em profundidade; ela é testada diretamente no serviço
(`tests/integration/test_users.py`), e o lado positivo (inativar/rebaixar um
admin não-último) é testado via HTTP.

### Audit log

Toda mutação sensível grava um registro em `audit_logs` com `actor_user_id`,
`action`, `entity_type`, `entity_id`, `changed_fields`, `masked_before`,
`masked_after`, `ip_address` e `user_agent` (IP/User-Agent capturados por
middleware). O diff é **mascarado** antes de gravar (`app/shared/masking.py`):

- senha e `password_hash` **nunca** são registrados (removidos por completo);
- CPF, telefone, e-mail e CEP são ofuscados;
- conteúdo clínico livre (diagnóstico, queixa, observações) é apenas marcado como
  alterado, sem expor o texto.

Cobertura em `tests/integration/test_audit.py` (inclui a garantia de que nenhum
hash de senha jamais aparece em nenhuma coluna do audit).

---

## Testes

Suíte de testes de integração que exercita o stack real da aplicação contra um
banco de teste isolado (SQLite por padrão; MySQL via `TEST_DATABASE_URL`). Cobre
autenticação, RBAC, invariantes financeiras, estoque, agenda, prontuário,
privacidade de pacientes, audit log mascarado, concorrência (MySQL) e o smoke de
migrations Alembic.

```bash
# rápido, sem dependências externas (SQLite)
pytest                                       # tudo
pytest tests/integration                     # apenas integração
pytest --cov=app --cov-report=term-missing --cov-fail-under=80   # com gate de cobertura

# dentro do container
docker compose exec api pytest
```

### Testes reais contra MySQL

Os testes de concorrência (`SELECT ... FOR UPDATE`) e o smoke de Alembic só são
fiéis no MySQL — estão marcados como `mysql_only` e são **pulados** no SQLite.

```bash
# sobe um MySQL descartável (porta 3307, dados em RAM)
docker compose -f docker-compose.test.yml up -d        # aguarde "healthy"

export TEST_DATABASE_URL="mysql+pymysql://clinic:clinic_password@127.0.0.1:3307/clinic_test"
pytest                  # suíte completa, incluindo mysql_only
pytest -m mysql_only    # apenas os testes específicos de MySQL

docker compose -f docker-compose.test.yml down -v       # limpa quando terminar
```

> ⚠️ Os testes **nunca** rodam contra o banco de produção/desenvolvimento. Cada
> teste cria seu próprio banco descartável e sobrescreve `get_db`; além disso, a
> suíte **recusa** rodar se `TEST_DATABASE_URL` não parecer um banco de teste
> (o nome do schema precisa conter `test`, não pode conter `prod`/`live` e não
> pode ser igual ao `DATABASE_URL` da aplicação).

Detalhes completos (estratégia de banco, diferenças SQLite × MySQL, smoke de
Alembic, marcador `mysql_only`, cobertura e instalação no Python 3.14) em
[`docs/testing.md`](docs/testing.md).

---

## Integração contínua (CI)

`.github/workflows/backend-ci.yml` roda em cada push/PR:

| Job | O que faz |
|-----|-----------|
| `sqlite-tests` | instala dependências e roda a suíte rápida com **gate de cobertura ≥ 80%** |
| `mysql-tests` | sobe **MySQL 8** como service, valida `alembic upgrade head` + `downgrade base`, e roda a suíte completa (incluindo `mysql_only`, concorrência e smoke de Alembic) com gate de 80% |
| `dependency-audit` | roda `pip-audit` (consultivo, não bloqueia) |

O CI **falha** se as migrations quebrarem ou se a cobertura cair abaixo de 80%.
Segredos reais nunca vão para o workflow — os valores de `SECRET_KEY`/DB são
apenas de teste. Para rodar localmente os mesmos comandos do CI:

```bash
# job sqlite
pytest --cov=app --cov-report=term-missing --cov-fail-under=80

# job mysql
docker compose -f docker-compose.test.yml up -d
export TEST_DATABASE_URL="mysql+pymysql://clinic:clinic_password@127.0.0.1:3307/clinic_test"
export DATABASE_URL="$TEST_DATABASE_URL"
alembic upgrade head && alembic downgrade base
pytest --cov=app --cov-report=term-missing --cov-fail-under=80
docker compose -f docker-compose.test.yml down -v
```

---

## Saúde e observabilidade

- `GET /health` — *liveness*: a aplicação está de pé (não toca o banco).
- `GET /ready` — *readiness*: executa `SELECT 1`; retorna `503` se o banco
  estiver indisponível. Leve e sem dados sensíveis.

Logs técnicos (stdout) carregam um `request_id` por requisição (devolvido também
no header `X-Request-ID`) e passam por um *scrubber* que redige senha, token,
hash e CPF — defesa em profundidade para que PII **não** vaze em log. Erros
inesperados retornam mensagem genérica (sem stack trace ao cliente) e são
logados no servidor com o `request_id`. Detalhes em
[`docs/architecture.md`](docs/architecture.md).

---

## Backup e go-live

- **Backup/restore MySQL:** scripts em `scripts/backup_mysql.sh` /
  `scripts/restore_mysql.sh` (usam variáveis de ambiente, sem senha hardcoded) e
  estratégia em [`docs/backup.md`](docs/backup.md).
- **Antes de usar com dados reais:** siga o
  [`docs/pre_service_checklist.md`](docs/pre_service_checklist.md).
- **Auditoria de dependências:** `pip-audit` (ver `requirements-dev.txt`).

---

## Controle de permissões (RBAC)

Papéis disponíveis (`app/core/permissions.py`):

| Role           | Acesso pretendido                                                                 |
| -------------- | ---------------------------------------------------------------------------------- |
| `ADMIN`        | Tudo, incluindo gestão de usuários, relatórios sensíveis e auditoria.              |
| `DENTIST`      | Fluxos clínicos. Em prontuários, fica restrito aos registros próprios.             |
| `RECEPTIONIST` | Cadastro básico, agenda e registro inicial de pagamentos. **Não** altera prontuário clínico nem status/cancelamento financeiro. |

A autorização é aplicada por dependência:

- `require_roles(Role.ADMIN, Role.DENTIST)` — protege a rota e exige token JWT válido + uma das roles indicadas.
- `get_current_user` — apenas valida o token e retorna o usuário (qualquer role).

O JWT carrega claims `sub` (id do usuário), `role` e `email`, com expiração configurável via `ACCESS_TOKEN_EXPIRE_MINUTES`. Usuários inativos não conseguem autenticar.

---

## Endpoints disponíveis

Todos sob o prefixo `/api/v1`.

### Health (público)

| Método | Rota      |
| ------ | --------- |
| GET    | `/`       |
| GET    | `/health` |

### Auth

| Método | Rota                  | Quem pode | Descrição |
| ------ | --------------------- | --------- | --------- |
| POST   | `/api/v1/auth/login`  | Público   | Login com email/senha (form-urlencoded). Retorna JWT. |
| GET    | `/api/v1/auth/me`     | Autenticado | Retorna o usuário do token. |

### Users (apenas ADMIN)

| Método | Rota                                   | Descrição              |
| ------ | -------------------------------------- | ---------------------- |
| POST   | `/api/v1/users`                        | Criar usuário.         |
| GET    | `/api/v1/users`                        | Listar (paginado).     |
| GET    | `/api/v1/users/{user_id}`              | Buscar por ID.         |
| PATCH  | `/api/v1/users/{user_id}`              | Editar (parcial).      |
| PATCH  | `/api/v1/users/{user_id}/activate`     | Ativar.                |
| PATCH  | `/api/v1/users/{user_id}/deactivate`   | Inativar (não pode ser o próprio nem o último ADMIN ativo). |

### Patients

| Método | Rota                                            | Quem pode               | Descrição |
| ------ | ----------------------------------------------- | ----------------------- | --------- |
| POST   | `/api/v1/patients`                              | ADMIN / DENTIST / RECEPTIONIST | Cadastrar paciente. |
| GET    | `/api/v1/patients`                              | ADMIN / DENTIST / RECEPTIONIST | Listar com paginação e busca (`?search=`, `?include_inactive=`). Retorna visão enxuta, sem CPF/endereço. |
| GET    | `/api/v1/patients/{id}`                         | ADMIN / DENTIST / RECEPTIONIST | Buscar paciente por ID. |
| PATCH  | `/api/v1/patients/{id}`                         | ADMIN / DENTIST / RECEPTIONIST | Editar dados cadastrais (parcial). |
| PATCH  | `/api/v1/patients/{id}/activate`                | ADMIN / DENTIST         | Reativar. |
| PATCH  | `/api/v1/patients/{id}/deactivate`              | ADMIN / DENTIST         | Soft delete. |
| GET    | `/api/v1/patients/{id}/summary`                 | ADMIN / DENTIST         | Paciente + dados de saúde consolidados. |

### Patient Health Info (apenas ADMIN / DENTIST)

| Método | Rota                                            | Descrição |
| ------ | ----------------------------------------------- | --------- |
| POST   | `/api/v1/patients/{id}/health-info`             | Cadastrar informações de saúde. |
| GET    | `/api/v1/patients/{id}/health-info`             | Visualizar informações de saúde. |
| PATCH  | `/api/v1/patients/{id}/health-info`             | Atualizar informações de saúde. |

### Medical Records (apenas ADMIN / DENTIST)

| Método | Rota                                                       | Descrição |
| ------ | ---------------------------------------------------------- | --------- |
| POST   | `/api/v1/patients/{patient_id}/medical-records`            | Criar novo prontuário para o paciente. O `dentist_id` é derivado do token. |
| GET    | `/api/v1/patients/{patient_id}/medical-records`            | Histórico paginado. DENTIST vê apenas registros próprios; ADMIN vê todos. |
| GET    | `/api/v1/medical-records/{record_id}`                      | Buscar prontuário por ID, respeitando escopo clínico. |
| PATCH  | `/api/v1/medical-records/{record_id}`                      | Editar campos clínicos (parcial). Bloqueado se o prontuário estiver inativo. |
| PATCH  | `/api/v1/medical-records/{record_id}/deactivate`           | Soft delete (cancelar prontuário). |
| PATCH  | `/api/v1/medical-records/{record_id}/activate`             | Reativar prontuário. |

> Regra adicional: pacientes inativos **só** podem receber novo prontuário se a chamada for feita por um `ADMIN`.

### Appointments

| Método | Rota                                                       | Quem pode | Descrição |
| ------ | ---------------------------------------------------------- | --------- | --------- |
| POST   | `/api/v1/appointments`                                     | ADMIN / DENTIST / RECEPTIONIST | Criar consulta. Valida paciente/dentista ativos, janela e conflito. |
| GET    | `/api/v1/appointments`                                     | ADMIN / DENTIST / RECEPTIONIST | Lista com filtros `patient_id`, `dentist_id`, `status`, `from`, `to`, `include_canceled`. |
| GET    | `/api/v1/appointments/today`                               | ADMIN / DENTIST / RECEPTIONIST | Consultas do dia (timezone `America/Sao_Paulo`). |
| GET    | `/api/v1/appointments/{id}`                                | ADMIN / DENTIST / RECEPTIONIST | Buscar por ID. |
| PATCH  | `/api/v1/appointments/{id}`                                | ADMIN / DENTIST / RECEPTIONIST | Edita apenas `reason` e `notes`. |
| PATCH  | `/api/v1/appointments/{id}/reschedule`                     | ADMIN / DENTIST / RECEPTIONIST | Remarca: valida janela, conflito; incrementa `rescheduled_count`. |
| PATCH  | `/api/v1/appointments/{id}/cancel`                         | ADMIN / DENTIST / RECEPTIONIST | Cancela. `status=canceled` + `canceled_at` + `cancellation_reason`. |
| PATCH  | `/api/v1/appointments/{id}/status`                         | ADMIN / DENTIST                | Altera status clínico (`in_progress`, `completed`, `no_show`...). |

#### Status e transições

`SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED` é o caminho feliz. `CANCELED` e `NO_SHOW` são alcançáveis a partir de qualquer estado não-terminal. `COMPLETED`, `CANCELED` e `NO_SHOW` são terminais (nenhuma transição parte deles).

Status que **ocupam horário** (bloqueiam conflito): `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`.
Status que **liberam o horário**: `CANCELED`, `NO_SHOW`.

#### Timezone

Todos os campos de data/hora são `DateTime(timezone=True)` (UTC no banco). A API exige ISO 8601 **com offset** (ex.: `2026-06-01T10:00:00-03:00`); inputs sem timezone são rejeitados em 422. O endpoint `/today` calcula o dia a partir de `America/Sao_Paulo`.

### Procedures

| Método | Rota                                                | Quem pode               | Descrição |
| ------ | --------------------------------------------------- | ----------------------- | --------- |
| POST   | `/api/v1/procedures`                                | ADMIN / DENTIST         | Cadastrar procedimento. `base_price >= 0`. |
| GET    | `/api/v1/procedures`                                | ADMIN / DENTIST / RECEPTIONIST | Lista paginada com `?search=` e `?include_inactive=`. |
| GET    | `/api/v1/procedures/{id}`                           | ADMIN / DENTIST / RECEPTIONIST | Buscar por ID. |
| PATCH  | `/api/v1/procedures/{id}`                           | ADMIN / DENTIST         | Atualização parcial. |
| PATCH  | `/api/v1/procedures/{id}/activate`                  | ADMIN / DENTIST         | Reativar. |
| PATCH  | `/api/v1/procedures/{id}/deactivate`                | ADMIN / DENTIST         | Soft delete. |

### Budgets

| Método | Rota                                                | Quem pode               | Descrição |
| ------ | --------------------------------------------------- | ----------------------- | --------- |
| POST   | `/api/v1/budgets`                                   | ADMIN / DENTIST         | Cria orçamento (status `DRAFT`). Calcula `total_amount` no backend. |
| GET    | `/api/v1/budgets`                                   | ADMIN / DENTIST / RECEPTIONIST | Lista paginada com filtros `patient_id`, `dentist_id`, `status`, `include_canceled`. |
| GET    | `/api/v1/budgets/{id}`                              | ADMIN / DENTIST / RECEPTIONIST | Buscar por ID com itens embutidos. |
| GET    | `/api/v1/patients/{patient_id}/budgets`             | ADMIN / DENTIST / RECEPTIONIST | Orçamentos de um paciente. |
| PATCH  | `/api/v1/budgets/{id}`                              | ADMIN / DENTIST         | Edita `notes` (qualquer estado não-terminal) e `items` (apenas `DRAFT`). Recalcula total. |
| PATCH  | `/api/v1/budgets/{id}/status`                       | ADMIN / DENTIST         | Mudança genérica de status, valida transições. |
| PATCH  | `/api/v1/budgets/{id}/approve`                      | ADMIN / DENTIST         | `DRAFT → APPROVED`. |
| PATCH  | `/api/v1/budgets/{id}/reject`                       | ADMIN / DENTIST         | `DRAFT → REJECTED`. |
| PATCH  | `/api/v1/budgets/{id}/cancel`                       | ADMIN / DENTIST         | Cancela (`DRAFT` ou `APPROVED`). Anexa motivo às notas. |
| GET    | `/api/v1/budgets/{id}/settlement`                   | ADMIN / DENTIST / RECEPTIONIST | Quanto já foi pago x quanto falta. |

**Transições de orçamento**: `DRAFT → APPROVED|REJECTED|CANCELED`; `APPROVED → CANCELED`; `REJECTED` e `CANCELED` são terminais. Pagamentos só podem ser vinculados a orçamentos `DRAFT` ou `APPROVED`.
Pagamentos não cancelados vinculados ao orçamento não podem ultrapassar `total_amount`.

### Payments

| Método | Rota                                                | Quem pode               | Descrição |
| ------ | --------------------------------------------------- | ----------------------- | --------- |
| POST   | `/api/v1/payments`                                  | ADMIN / DENTIST / RECEPTIONIST | Registrar pagamento. `amount > 0`. |
| GET    | `/api/v1/payments`                                  | ADMIN / DENTIST / RECEPTIONIST | Lista com `patient_id`, `budget_id`, `status`, `from`, `to`, `date_field=paid_at|created_at`. |
| GET    | `/api/v1/payments/{id}`                             | ADMIN / DENTIST / RECEPTIONIST | Buscar por ID. |
| GET    | `/api/v1/patients/{patient_id}/payments`            | ADMIN / DENTIST / RECEPTIONIST | Pagamentos do paciente. |
| GET    | `/api/v1/budgets/{budget_id}/payments`              | ADMIN / DENTIST / RECEPTIONIST | Pagamentos do orçamento. |
| PATCH  | `/api/v1/payments/{id}`                             | ADMIN / DENTIST         | Atualiza `payment_method`, `paid_at`, `due_date`, `notes`. |
| PATCH  | `/api/v1/payments/{id}/status`                      | ADMIN / DENTIST         | Transita status com validação. |
| PATCH  | `/api/v1/payments/{id}/cancel`                      | ADMIN / DENTIST         | Cancela com motivo (sem deletar). |

**Métodos**: `cash`, `pix`, `credit_card`, `debit_card`, `bank_transfer`, `other`.
**Transições de status**: `PENDING → PARTIALLY_PAID | PAID | CANCELED`; `PARTIALLY_PAID → PAID | CANCELED`; `PAID → CANCELED`; `CANCELED` é terminal.
RECEPTIONIST pode registrar e consultar pagamentos, mas não pode alterar dados, status ou cancelamento depois da criação.

### Finance Reports

| Método | Rota                                                | Quem pode               | Descrição |
| ------ | --------------------------------------------------- | ----------------------- | --------- |
| GET    | `/api/v1/finance/revenue?from=...&to=...`           | ADMIN / DENTIST         | Receita realizada num intervalo arbitrário. |
| GET    | `/api/v1/finance/revenue/weekly`                    | ADMIN / DENTIST         | Receita da semana corrente (segunda → segunda em `America/Sao_Paulo`). |
| GET    | `/api/v1/finance/revenue/monthly`                   | ADMIN / DENTIST         | Receita do mês corrente. |
| GET    | `/api/v1/finance/pending-payments`                  | ADMIN / DENTIST / RECEPTIONIST | Lista paginada de pagamentos `PENDING`/`PARTIALLY_PAID`. |
| GET    | `/api/v1/finance/summary`                           | ADMIN / DENTIST         | Painel resumido (mês corrente, semana corrente, totais pendente/cancelado). |

> Todos os valores monetários trafegam como JSON número decimal com 2 casas. No banco são `NUMERIC(10,2)` e nunca `FLOAT`. Cálculos ficam no service (`_money()` + `Decimal.quantize`).

### Reports & Dashboard

| Método | Rota                                                | Quem pode               | Descrição |
| ------ | --------------------------------------------------- | ----------------------- | --------- |
| GET    | `/api/v1/dashboard`                                 | ADMIN / DENTIST / RECEPTIONIST | Painel operacional com snapshots enxutos, sem CPF/endereço. |
| GET    | `/api/v1/reports/patients`                          | ADMIN                   | Relatório de pacientes. |
| GET    | `/api/v1/reports/patients/export`                   | ADMIN                   | Export CSV de pacientes. |
| GET    | `/api/v1/reports/appointments`                      | ADMIN / DENTIST / RECEPTIONIST | Relatório de agenda. DENTIST é limitado ao próprio `dentist_id`. |
| GET    | `/api/v1/reports/finance`                           | ADMIN / DENTIST         | Relatório financeiro. |
| GET    | `/api/v1/reports/medical-records`                   | ADMIN / DENTIST         | Metadados de prontuários, sem conteúdo clínico livre. DENTIST é limitado aos próprios registros. |

### Inventory — Items

| Método | Rota                                                | Quem pode               | Descrição |
| ------ | --------------------------------------------------- | ----------------------- | --------- |
| POST   | `/api/v1/inventory/items`                           | ADMIN / RECEPTIONIST    | Cadastrar item com saldo inicial. |
| GET    | `/api/v1/inventory/items`                           | ADMIN / DENTIST / RECEPTIONIST | Lista com filtros `search`, `category`, `include_inactive`, `only_inactive`, `low_stock`. |
| GET    | `/api/v1/inventory/items/{id}`                      | ADMIN / DENTIST / RECEPTIONIST | Buscar por ID. |
| PATCH  | `/api/v1/inventory/items/{id}`                      | ADMIN / RECEPTIONIST    | Edição parcial. **NÃO** edita `current_quantity` — use movimentações. |
| PATCH  | `/api/v1/inventory/items/{id}/activate`             | ADMIN                   | Reativar item. |
| PATCH  | `/api/v1/inventory/items/{id}/deactivate`           | ADMIN                   | Soft delete. |

### Inventory — Movements

| Método | Rota                                                | Quem pode               | Descrição |
| ------ | --------------------------------------------------- | ----------------------- | --------- |
| POST   | `/api/v1/inventory/items/{id}/movements/in`         | ADMIN / RECEPTIONIST    | Entrada: soma à `current_quantity`. |
| POST   | `/api/v1/inventory/items/{id}/movements/out`        | ADMIN / RECEPTIONIST    | Saída: subtrai. Bloqueada se `quantity > current_quantity`. |
| POST   | `/api/v1/inventory/items/{id}/movements/adjustment` | ADMIN                   | Define o saldo final (`quantity` é absoluto, não delta). Motivo obrigatório. |
| GET    | `/api/v1/inventory/items/{id}/movements`            | ADMIN / DENTIST / RECEPTIONIST | Histórico do item, ordem cronológica reversa. |
| GET    | `/api/v1/inventory/movements`                       | ADMIN / DENTIST / RECEPTIONIST | Histórico geral com filtros `item_id`, `type`, `user_id`, `from`, `to`. |

> Toda movimentação grava `resulting_quantity` (saldo logo após a operação) + `created_by_user_id` (audit trail). Movimentações são **imutáveis**: não há `PATCH` nem `DELETE` — para corrigir, gere uma compensação (entrada/saída inversa) ou um `adjustment`.

### Inventory — Alerts & Summary

| Método | Rota                                                | Descrição |
| ------ | --------------------------------------------------- | --------- |
| GET    | `/api/v1/inventory/alerts/low-stock`                | Itens com `current_quantity ≤ minimum_quantity` (apenas ativos). |
| GET    | `/api/v1/inventory/alerts/expiring?days=30`         | Itens com `expiration_date` em até N dias a partir de hoje (`America/Sao_Paulo`). Default 30. |
| GET    | `/api/v1/inventory/summary`                         | Painel com totais ativo/inativo, alertas, movimentações do mês corrente. |

#### Concorrência e integridade

Toda movimentação roda em **uma única transação** que faz `SELECT ... FOR UPDATE` no item, calcula o novo saldo em `Decimal`, grava o `inventory_movements` e atualiza `inventory_items.current_quantity`. Se qualquer passo falhar, o `rollback` desfaz **as duas operações** juntas — saldo e histórico nunca ficam dessincronizados.

> Para exemplos completos de uso (curl), veja [`docs/exemplos.md`](docs/exemplos.md).

---

## Exemplos de uso

> Use `BASE=http://localhost:8000/api/v1` nos exemplos.

### Login (obter token)

```bash
curl -X POST "$BASE/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=dra@clinic.com&password=senha-forte-123"
```

Resposta:

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Exporte para os próximos comandos:

```bash
TOKEN="eyJhbGciOi..."
```

### Quem sou eu

```bash
curl "$BASE/auth/me" -H "Authorization: Bearer $TOKEN"
```

### Criar usuário (admin)

```bash
curl -X POST "$BASE/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Recepção 1",
        "email": "recep1@clinic.com",
        "role": "receptionist",
        "password": "senha-forte-123"
      }'
```

### Listar usuários (paginado)

```bash
curl "$BASE/users?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Buscar por ID

```bash
curl "$BASE/users/2" -H "Authorization: Bearer $TOKEN"
```

### Editar usuário

```bash
curl -X PATCH "$BASE/users/2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "name": "Recepção Atualizada" }'
```

### Ativar / Inativar

```bash
curl -X PATCH "$BASE/users/2/deactivate" \
  -H "Authorization: Bearer $TOKEN"

curl -X PATCH "$BASE/users/2/activate" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Boas práticas adotadas

- `password_hash` **nunca** retornado (schema `UserRead` não o expõe).
- Login retorna mensagem genérica (`Credenciais inválidas`) para senha errada, email inexistente **ou** usuário inativo — evita enumeração de contas.
- Login possui rate limit por IP + email (`LOGIN_RATE_LIMIT_ATTEMPTS` em `LOGIN_RATE_LIMIT_WINDOW_SECONDS`). Em produção multi-réplica, use Redis para compartilhar esse estado.
- Senha exigida com **mínimo 8 caracteres** + letras + números no schema.
- `SECRET_KEY` obrigatória com no mínimo 32 caracteres.
- JWT inclui `type=access` validado em `get_current_user`.
- Admin não pode inativar o próprio usuário, alterar o próprio role ou remover o último ADMIN ativo.
- Ações sensíveis gravam `audit_logs` com ator, ação, entidade, timestamp e metadados mínimos, sem copiar payload clínico completo.
- Email normalizado para lowercase antes de persistir/comparar.
- Suporte a rehash transparente quando o esquema/parametros do hash mudam.
- Documentação Swagger desligada em produção (`APP_ENV=production`).
- Em produção, a aplicação falha ao iniciar com `SECRET_KEY` placeholder, `APP_DEBUG=true` ou `CORS_ORIGINS=*`. Use `CORS_ORIGINS` como lista JSON no `.env`.
- Filtros e payloads com `datetime` exigem timezone explícito e são normalizados para UTC antes de persistir/consultar.
- Exports CSV escapam células iniciadas por caracteres de fórmula para reduzir risco de CSV injection.
- Usuário não-root no container.
- `.env` fora do versionamento, `.env.example` mantido seguro.

---

## Próximos passos (Fase 7+)

- Expor endpoints administrativos de leitura do audit log apenas para ADMIN, com filtros e retenção.
- Integração `appointments` ↔ `medical_records` (abrir prontuário ao mover consulta para `in_progress`, preenchendo `appointment_id`).
- Integração `appointments` ↔ `budgets`/`payments` (cobrar pagamento a partir de uma consulta concluída).
- Vincular consumo de estoque a procedimentos/consultas (rastreabilidade clínico-logística).
- Melhorar auditoria com diff mascarado, IP, user-agent e política de retenção.
- Despesas (`expenses`) para fechar o ciclo do fluxo de caixa.
- Notificações / e-mail / WhatsApp (lembrete de consulta, aviso de vencimento de estoque, aniversário etc.).
- Integração futura com Google Agenda (fora do MVP).

Consulte [`docs/requisitos.md`](docs/requisitos.md) para o detalhamento das fases.
