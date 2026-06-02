# Decisões de arquitetura

Documento curto com decisões transversais que afetam vários módulos.

## Padronização de datas/horas (precisão de segundos)

**Decisão:** todo `datetime` de domínio é armazenado e comparado em **UTC com
precisão de segundos** (`microsecond = 0`).

**Motivo:** as colunas `DATETIME` do MySQL têm precisão fracionária `fsp=0` por
padrão e **arredondam os microssegundos** ao gravar. Se mantivéssemos a fração,
o valor em memória (recém-enviado) divergiria do valor lido do banco, gerando
bugs sutis — o caso concreto foi a detecção de conflito de agenda no limite
exato (fim de uma consulta == início da próxima), que falhava de forma
intermitente conforme a fração de segundo do `now()`.

**Como é aplicado (ponto único):** `app/shared/timezone.py`
- `now_utc()` → retorna o instante atual em UTC truncado em segundos;
- `ensure_aware_utc()` / `ensure_optional_aware_utc()` → exigem timezone,
  convertem para UTC e truncam em segundos;
- `normalize_precision()` → helper explícito quando necessário.

Como todo datetime de entrada passa por `ensure_aware_utc` (validadores de
schema) e todo timestamp gerado internamente passa por `now_utc`, a regra vale
de ponta a ponta.

**Cobertura por módulo:**

| Módulo | Campos de data/hora | Tratamento |
|--------|---------------------|------------|
| `appointments` | `scheduled_start/end`, `canceled_at`, `original_start` | entrada via `_ensure_tz_aware` → `ensure_aware_utc`; `now_utc` |
| `payments` | `paid_at`, `canceled_at` | entrada via `ensure_aware_utc`; `now_utc`. `due_date` é `date` (sem hora) |
| `budgets` | apenas `created_at/updated_at` (server) | `func.now()` no banco (fsp=0) |
| `inventory_movements` | apenas `created_at` (server) | `func.now()` no banco (fsp=0) |
| `medical_records` | `visit_date` é `date` (sem hora) | sem normalização de hora necessária |
| `audit` | `created_at` (server) | `func.now()` no banco (fsp=0) |
| `reports` | filtros de janela (`from/to`) | `ensure_optional_aware_utc` / `date_range_window` |

**Datas puras (`date`)** — `due_date`, `visit_date`, `expiration_date` — não têm
componente de hora e não precisam de normalização.

## Audit log × logs técnicos

São coisas **diferentes** e não devem se misturar:

- **Audit log de negócio** (`audit_logs`): fonte de verdade de "quem fez o quê",
  com diff **mascarado** (`app/shared/masking.py`). Nunca grava senha/hash; CPF,
  telefone, e-mail e conteúdo clínico são ofuscados.
- **Logs técnicos** (`app/core/logging.py`): stdout, correlacionados por
  `request_id`, com um *scrubber* de defesa em profundidade que redige
  senha/token/hash/CPF caso escapem para uma mensagem de log.

## Saúde da aplicação

- `GET /health` — *liveness*: a aplicação está de pé (não toca o banco).
- `GET /ready` — *readiness*: executa `SELECT 1`; retorna `503` se o banco
  estiver indisponível. Leve e sem dados sensíveis.
