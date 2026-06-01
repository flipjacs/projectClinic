# Exemplos de uso — Fases 2 a 6 (Pacientes, Saúde, Prontuário, Agenda, Procedimentos, Financeiro e Estoque)

> Todos os endpoints estão sob `/api/v1`. Use `BASE=http://localhost:8000/api/v1`.

## 0. Login

```bash
BASE=http://localhost:8000/api/v1

TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=dra@clinic.com&password=senha-forte-123" \
  | python -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

echo "TOKEN=$TOKEN"
```

---

## 1. Criar paciente

Aceita CPF, telefone e CEP **com ou sem máscara** — o backend normaliza.

```bash
curl -X POST "$BASE/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Maria da Silva",
        "cpf": "529.982.247-25",
        "birth_date": "1985-03-12",
        "phone": "(62) 99999-8888",
        "email": "maria@example.com",
        "street": "Rua das Flores",
        "number": "123",
        "neighborhood": "Centro",
        "city": "Goiânia",
        "state": "GO",
        "zip_code": "74000-000"
      }'
```

Resposta (201):

```json
{
  "id": 1,
  "name": "Maria da Silva",
  "cpf": "52998224725",
  "birth_date": "1985-03-12",
  "phone": "62999998888",
  "email": "maria@example.com",
  "street": "Rua das Flores",
  "number": "123",
  "neighborhood": "Centro",
  "city": "Goiânia",
  "state": "GO",
  "zip_code": "74000000",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### Outro paciente para testes

```bash
curl -X POST "$BASE/patients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "João Pereira",
        "cpf": "390.533.447-05",
        "birth_date": "1972-11-02",
        "phone": "62988887777",
        "street": "Av. Brasil",
        "number": "500",
        "neighborhood": "Setor Oeste",
        "city": "Goiânia",
        "state": "GO",
        "zip_code": "74110010"
      }'
```

---

## 2. Listar e buscar

Apenas ativos por padrão, com paginação:

```bash
curl "$BASE/patients?page=1&page_size=10" -H "Authorization: Bearer $TOKEN"
```

Buscar por nome:

```bash
curl "$BASE/patients?search=Maria" -H "Authorization: Bearer $TOKEN"
```

Buscar por CPF (com ou sem máscara):

```bash
curl "$BASE/patients?search=529.982.247-25" -H "Authorization: Bearer $TOKEN"
```

Buscar por telefone (parcial):

```bash
curl "$BASE/patients?search=9999" -H "Authorization: Bearer $TOKEN"
```

Incluir inativos:

```bash
curl "$BASE/patients?include_inactive=true" -H "Authorization: Bearer $TOKEN"
```

---

## 3. Buscar por ID

```bash
curl "$BASE/patients/1" -H "Authorization: Bearer $TOKEN"
```

---

## 4. Atualizar paciente (qualquer campo cadastral)

```bash
curl -X PATCH "$BASE/patients/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "phone": "62977776666",
        "street": "Rua Nova",
        "number": "456"
      }'
```

---

## 5. Inativar / reativar

> Apenas **ADMIN** e **DENTIST** podem ativar/inativar.

```bash
curl -X PATCH "$BASE/patients/1/deactivate" -H "Authorization: Bearer $TOKEN"
curl -X PATCH "$BASE/patients/1/activate"   -H "Authorization: Bearer $TOKEN"
```

Em listagens, pacientes inativos só aparecem com `?include_inactive=true`.

---

## 6. Registrar informações de saúde

> Apenas **ADMIN** e **DENTIST**.

```bash
curl -X POST "$BASE/patients/1/health-info" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "has_disease": true,
        "disease_description": "Hipertensão controlada",
        "has_allergy": true,
        "allergy_description": "Penicilina",
        "uses_medication": true,
        "medication_description": "Losartana 50mg",
        "health_observations": "Trazer exames recentes na próxima consulta."
      }'
```

> Regra: quando um `has_*` for `true`, o campo de descrição correspondente é obrigatório.

---

## 7. Buscar / atualizar informações de saúde

```bash
curl "$BASE/patients/1/health-info" -H "Authorization: Bearer $TOKEN"

curl -X PATCH "$BASE/patients/1/health-info" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "health_observations": "Paciente relatou dor leve em molar inferior direito." }'
```

---

## 8. Resumo consolidado

```bash
curl "$BASE/patients/1/summary" -H "Authorization: Bearer $TOKEN"
```

Resposta:

```json
{
  "patient": { ... },
  "health_info": { ... }   // null se ainda não cadastrado
}
```

---

## 9. Prontuários — criar e listar (cronológico)

> Apenas **ADMIN** e **DENTIST**. O `dentist_id` é sempre derivado do token; não é aceito no body.

### Criar prontuário

```bash
curl -X POST "$BASE/patients/1/medical-records" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "visit_date": "2026-05-31",
        "main_complaint": "Dor em molar inferior direito ao mastigar.",
        "diagnosis": "Suspeita de fratura no 46 — solicitar radiografia periapical.",
        "performed_procedure": "Exame clínico; orientação para evitar mastigação no lado afetado.",
        "clinical_evolution": "Sensibilidade ao frio reduzida desde a última consulta.",
        "observations": "Paciente relatou alergia a penicilina — anotado na ficha de saúde."
      }'
```

Resposta (201):

```json
{
  "id": 1,
  "patient_id": 1,
  "dentist_id": 1,
  "appointment_id": null,
  "visit_date": "2026-05-31",
  "main_complaint": "Dor em molar inferior direito ao mastigar.",
  "diagnosis": "Suspeita de fratura no 46 — solicitar radiografia periapical.",
  "performed_procedure": "Exame clínico; orientação para evitar mastigação no lado afetado.",
  "clinical_evolution": "Sensibilidade ao frio reduzida desde a última consulta.",
  "observations": "Paciente relatou alergia a penicilina — anotado na ficha de saúde.",
  "is_active": true,
  "created_at": "...",
  "updated_at": "...",
  "dentist": { "id": 1, "name": "Dra. Fulana" }
}
```

### Histórico paginado (mais recente → mais antigo)

```bash
curl "$BASE/patients/1/medical-records?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"
```

Incluir prontuários inativos:

```bash
curl "$BASE/patients/1/medical-records?include_inactive=true" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 10. Prontuários — buscar, editar, inativar

### Buscar por ID

```bash
curl "$BASE/medical-records/1" -H "Authorization: Bearer $TOKEN"
```

### Editar (parcial)

```bash
curl -X PATCH "$BASE/medical-records/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "diagnosis": "Fratura confirmada no 46. Indicação de coroa total.",
        "performed_procedure": "Ajuste oclusal; aguardando confecção da coroa."
      }'
```

> Prontuário **inativo** não pode ser editado — reative antes (422 se tentar).

### Inativar (cancelar) e reativar

```bash
curl -X PATCH "$BASE/medical-records/1/deactivate" \
  -H "Authorization: Bearer $TOKEN"

curl -X PATCH "$BASE/medical-records/1/activate" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 11. Casos esperados de erro (Fase 3)

| Cenário | Status | Detail |
| ------- | ------ | ------ |
| Paciente não existe ao criar prontuário | 404 | `Paciente não encontrado` |
| Paciente inativo e usuário não é ADMIN | 422 | `Paciente inativo. Apenas ADMIN pode registrar prontuário nesta condição` |
| `visit_date` no futuro | 422 | `A data do atendimento não pode ser futura` |
| `main_complaint` vazia | 422 | `Queixa principal não pode estar vazia` |
| RECEPTIONIST tentando qualquer rota de prontuário | 403 | `Acesso negado para este recurso` |
| Editar prontuário inativo | 422 | `Prontuário inativo. Reative antes de editar` |
| Body de PATCH sem nenhum campo | 422 | `Informe ao menos um campo para atualizar` |
| Prontuário não existe | 404 | `Prontuário não encontrado` |

---

## 12. Consultas — agendar

> **Todas as datas precisam vir com timezone** (ex.: `-03:00`). Inputs sem offset retornam 422.

```bash
curl -X POST "$BASE/appointments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "patient_id": 1,
        "dentist_id": 1,
        "scheduled_start": "2026-06-02T10:00:00-03:00",
        "scheduled_end":   "2026-06-02T10:45:00-03:00",
        "reason": "Avaliação inicial e profilaxia"
      }'
```

Resposta (201):

```json
{
  "id": 1,
  "patient_id": 1,
  "dentist_id": 1,
  "scheduled_start": "2026-06-02T13:00:00+00:00",
  "scheduled_end":   "2026-06-02T13:45:00+00:00",
  "status": "scheduled",
  "reason": "Avaliação inicial e profilaxia",
  "notes": null,
  "rescheduled_count": 0,
  "original_start": null,
  "canceled_at": null,
  "cancellation_reason": null,
  "created_at": "...",
  "updated_at": "...",
  "patient": { "id": 1, "name": "Maria da Silva" },
  "dentist": { "id": 1, "name": "Dra. Fulana" }
}
```

> Tentar agendar **na mesma janela** para o mesmo dentista retorna **409**:
> `Conflito de horário: o dentista já possui consulta nesta janela`.

---

## 13. Consultas — listar e filtrar

```bash
# Tudo (oculta canceladas por padrão)
curl "$BASE/appointments?page=1&page_size=20" -H "Authorization: Bearer $TOKEN"

# Por paciente
curl "$BASE/appointments?patient_id=1" -H "Authorization: Bearer $TOKEN"

# Agenda do dentista numa janela específica
curl "$BASE/appointments?dentist_id=1&from=2026-06-01T00:00:00-03:00&to=2026-06-08T00:00:00-03:00" \
  -H "Authorization: Bearer $TOKEN"

# Apenas em determinado status
curl "$BASE/appointments?status=confirmed" -H "Authorization: Bearer $TOKEN"

# Incluir canceladas
curl "$BASE/appointments?include_canceled=true" -H "Authorization: Bearer $TOKEN"

# Consultas do dia da clínica (timezone America/Sao_Paulo)
curl "$BASE/appointments/today" -H "Authorization: Bearer $TOKEN"

# Consultas de hoje para um dentista específico
curl "$BASE/appointments/today?dentist_id=1" -H "Authorization: Bearer $TOKEN"
```

---

## 14. Consultas — buscar e editar

```bash
curl "$BASE/appointments/1" -H "Authorization: Bearer $TOKEN"

# Só ajusta motivo e/ou notas — datas têm endpoint próprio.
curl -X PATCH "$BASE/appointments/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "notes": "Paciente prefere atendimento pela manhã." }'
```

---

## 15. Consultas — remarcar

```bash
curl -X PATCH "$BASE/appointments/1/reschedule" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "scheduled_start": "2026-06-03T15:00:00-03:00",
        "scheduled_end":   "2026-06-03T15:45:00-03:00",
        "reason": "Paciente pediu para mudar para a tarde"
      }'
```

A resposta passa a ter `rescheduled_count: 1` e `original_start` com o horário inicial.

---

## 16. Consultas — alterar status (apenas ADMIN / DENTIST)

```bash
curl -X PATCH "$BASE/appointments/1/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "confirmed" }'

curl -X PATCH "$BASE/appointments/1/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'

curl -X PATCH "$BASE/appointments/1/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "completed" }'
```

> Recepção (`RECEPTIONIST`) recebe **403** ao chamar `/status`. Para cancelar/marcar falta sem precisar de papel clínico, use `/cancel` ou um workflow que envolva o corpo clínico.

---

## 17. Consultas — cancelar

```bash
curl -X PATCH "$BASE/appointments/1/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "cancellation_reason": "Paciente desmarcou por telefone." }'
```

Define `status=canceled`, registra `canceled_at` e libera o horário para um novo agendamento.

---

## 18. Casos esperados de erro (Fase 4)

| Cenário | Status | Detail |
| ------- | ------ | ------ |
| Conflito de horário do mesmo dentista | 409 | `Conflito de horário: o dentista já possui consulta nesta janela` |
| Paciente inativo no agendamento | 422 | `Paciente inativo. Reative antes de agendar` |
| Dentista inativo / sem papel clínico | 422 | `Dentista inativo...` ou `não possui papel clínico (dentist ou admin)` |
| Janela inválida (`end <= start`) | 422 | `scheduled_end deve ser maior que scheduled_start` |
| Duração fora de 5min..6h | 422 | `Duração mínima/máxima da consulta...` |
| Datetime sem timezone | 422 | `Use datetime com timezone (...)` |
| Horário no passado | 422 | `Horário de início deve ser no futuro` |
| Transição inválida (ex.: `completed → scheduled`) | 422 | `Transição inválida: completed → scheduled` |
| Edição de consulta terminal | 422 | `Consulta em estado terminal (...); não é possível editar campos` |
| RECEPTIONIST chamando `/status` | 403 | `Acesso negado para este recurso` |
| Consulta não existe | 404 | `Consulta não encontrada` |

---

## 19. Procedimentos

> Catálogo técnico. ADMIN/DENTIST mexem. RECEPTIONIST só lista/visualiza.

```bash
# Criar
curl -X POST "$BASE/procedures" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Limpeza completa",
        "description": "Profilaxia + raspagem supragengival",
        "base_price": 180.00,
        "estimated_duration_minutes": 45
      }'

# Listar com busca
curl "$BASE/procedures?search=limpeza&page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"

# Incluir inativos
curl "$BASE/procedures?include_inactive=true" \
  -H "Authorization: Bearer $TOKEN"

# Atualizar
curl -X PATCH "$BASE/procedures/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "base_price": 200.00 }'

# Inativar / reativar
curl -X PATCH "$BASE/procedures/1/deactivate" -H "Authorization: Bearer $TOKEN"
curl -X PATCH "$BASE/procedures/1/activate"   -H "Authorization: Bearer $TOKEN"
```

---

## 20. Orçamentos

### Criar (somente ADMIN/DENTIST). O backend calcula `total_amount`.

```bash
curl -X POST "$BASE/budgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "patient_id": 1,
        "dentist_id": 1,
        "notes": "Plano de tratamento sugerido na avaliação.",
        "items": [
          { "procedure_id": 1, "quantity": 1 },
          { "procedure_id": 2, "quantity": 2, "unit_price": 350.00 }
        ]
      }'
```

> Se `unit_price` for omitido, o backend usa `procedure.base_price` no momento da criação. `total_amount` = soma de `quantity * unit_price` de todos os itens.

### Listar / filtrar

```bash
curl "$BASE/budgets?page=1&page_size=20" -H "Authorization: Bearer $TOKEN"
curl "$BASE/budgets?status=draft" -H "Authorization: Bearer $TOKEN"
curl "$BASE/patients/1/budgets" -H "Authorization: Bearer $TOKEN"
```

### Editar (notas + itens, só em DRAFT)

```bash
curl -X PATCH "$BASE/budgets/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "notes": "Ajustado após nova avaliação.",
        "items": [
          { "procedure_id": 1, "quantity": 1 },
          { "procedure_id": 3, "quantity": 1, "unit_price": 800.00 }
        ]
      }'
```

### Aprovar / rejeitar / cancelar

```bash
curl -X PATCH "$BASE/budgets/1/approve" -H "Authorization: Bearer $TOKEN"
# ou
curl -X PATCH "$BASE/budgets/1/reject"  -H "Authorization: Bearer $TOKEN"
# ou
curl -X PATCH "$BASE/budgets/1/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "reason": "Paciente desistiu" }'
```

### Quanto já pagou × quanto falta

```bash
curl "$BASE/budgets/1/settlement" -H "Authorization: Bearer $TOKEN"
```

Resposta:

```json
{
  "budget_id": 1,
  "total_amount": "880.00",
  "total_paid": "300.00",
  "total_pending": "580.00"
}
```

---

## 21. Pagamentos

> Recepção (`RECEPTIONIST`) pode registrar e cancelar. `amount > 0`. Use `Decimal` no client (envie como número).

### Registrar pagamento parcial vinculado a orçamento

```bash
curl -X POST "$BASE/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "patient_id": 1,
        "budget_id": 1,
        "amount": 300.00,
        "payment_method": "pix",
        "status": "paid",
        "paid_at": "2026-05-31T14:00:00-03:00",
        "notes": "Entrada"
      }'
```

> Mandar `status="paid"` sem `paid_at` faz o backend assumir o instante atual.

### Pagamento futuro (a receber)

```bash
curl -X POST "$BASE/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "patient_id": 1,
        "budget_id": 1,
        "amount": 580.00,
        "payment_method": "credit_card",
        "status": "pending",
        "due_date": "2026-06-30"
      }'
```

### Pagamento avulso (sem orçamento)

```bash
curl -X POST "$BASE/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "patient_id": 1,
        "amount": 60.00,
        "payment_method": "cash",
        "status": "paid"
      }'
```

### Listar e filtrar

```bash
# Por paciente
curl "$BASE/patients/1/payments" -H "Authorization: Bearer $TOKEN"

# Por orçamento
curl "$BASE/budgets/1/payments" -H "Authorization: Bearer $TOKEN"

# Por status + intervalo de paid_at
curl "$BASE/payments?status=paid&from=2026-05-01T00:00:00-03:00&to=2026-06-01T00:00:00-03:00" \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por created_at em vez de paid_at
curl "$BASE/payments?status=pending&date_field=created_at" \
  -H "Authorization: Bearer $TOKEN"
```

### Atualizar / mudar status / cancelar

```bash
# Editar notas e due_date (não muda amount nem status)
curl -X PATCH "$BASE/payments/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "due_date": "2026-07-05", "notes": "Reagendado." }'

# Marcar como pago (pode mandar paid_at)
curl -X PATCH "$BASE/payments/2/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "paid", "paid_at": "2026-06-30T10:00:00-03:00" }'

# Cancelar
curl -X PATCH "$BASE/payments/2/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "cancellation_reason": "Cobrança duplicada" }'
```

---

## 22. Relatórios financeiros

```bash
# Receita do mês corrente (timezone America/Sao_Paulo)
curl "$BASE/finance/revenue/monthly" -H "Authorization: Bearer $TOKEN"

# Receita da semana corrente (segunda → segunda)
curl "$BASE/finance/revenue/weekly" -H "Authorization: Bearer $TOKEN"

# Receita num intervalo qualquer
curl "$BASE/finance/revenue?from=2026-04-01T00:00:00-03:00&to=2026-05-01T00:00:00-03:00" \
  -H "Authorization: Bearer $TOKEN"

# Lista de pendências (paginada). Aceita filtro por due_date
curl "$BASE/finance/pending-payments?from=2026-06-01T00:00:00-03:00&to=2026-07-01T00:00:00-03:00" \
  -H "Authorization: Bearer $TOKEN"

# Painel resumido (mês + semana + pendente + cancelado)
curl "$BASE/finance/summary" -H "Authorization: Bearer $TOKEN"
```

Resposta de `/finance/summary`:

```json
{
  "total_paid_current_month": "1280.00",
  "total_paid_current_week": "300.00",
  "total_pending": "640.00",
  "total_canceled": "120.00",
  "number_of_paid_payments": 5,
  "number_of_pending_payments": 2
}
```

---

## 23. Casos esperados de erro (Fase 5)

| Cenário | Status | Detail |
| ------- | ------ | ------ |
| Procedimento com `base_price` negativo | 422 | validação Pydantic |
| Orçamento sem itens | 422 | `Orçamento precisa ter ao menos 1 item` |
| Item referenciando procedimento inativo (sem ser ADMIN) | 422 | `Procedimento '...' está inativo. Somente ADMIN...` |
| Editar itens fora de DRAFT | 422 | `Itens só podem ser alterados enquanto o orçamento está em DRAFT` |
| Transição inválida de orçamento (ex.: `rejected → approved`) | 422 | `Transição inválida: rejected → approved` |
| Pagamento amarrado a orçamento `CANCELED`/`REJECTED` | 422 | `Orçamento com status '...' não pode receber pagamentos` |
| Pagamento de outro paciente em orçamento errado | 422 | `Orçamento informado pertence a outro paciente` |
| `amount <= 0` | 422 | validação Pydantic (`gt=0`) |
| `paid_at` sem timezone | 422 | `Use datetime com timezone em paid_at (...)` |
| Editar pagamento cancelado | 422 | `Pagamento cancelado não pode ser editado` |
| Transição inválida de pagamento (ex.: `canceled → paid`) | 422 | `Transição inválida: canceled → paid` |
| Criar pagamento já `canceled` | 422 | `Não é possível criar pagamento já cancelado...` |

---

## 24. Estoque — cadastrar item

> `current_quantity` pode ser informado **só na criação**. Depois, **toda alteração de saldo passa por movimentação**.

```bash
curl -X POST "$BASE/inventory/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Luva de procedimento P",
        "category": "protective_equipment",
        "unit_of_measure": "box",
        "current_quantity": 12,
        "minimum_quantity": 4,
        "supplier": "Distribuidora ACME",
        "unit_price": 39.90,
        "expiration_date": "2027-12-31",
        "notes": "Caixa com 100 unidades"
      }'
```

Listar com filtros:

```bash
# Por categoria
curl "$BASE/inventory/items?category=anesthetic" -H "Authorization: Bearer $TOKEN"

# Busca por nome
curl "$BASE/inventory/items?search=luva" -H "Authorization: Bearer $TOKEN"

# Só inativos
curl "$BASE/inventory/items?only_inactive=true" -H "Authorization: Bearer $TOKEN"

# Estoque baixo direto pelo filtro de itens
curl "$BASE/inventory/items?low_stock=true" -H "Authorization: Bearer $TOKEN"
```

Atualizar (não muda `current_quantity`):

```bash
curl -X PATCH "$BASE/inventory/items/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "minimum_quantity": 6, "supplier": "Nova Distribuidora" }'
```

Soft delete:

```bash
curl -X PATCH "$BASE/inventory/items/1/deactivate" -H "Authorization: Bearer $TOKEN"
curl -X PATCH "$BASE/inventory/items/1/activate"   -H "Authorization: Bearer $TOKEN"
```

---

## 25. Estoque — entrada

```bash
curl -X POST "$BASE/inventory/items/1/movements/in" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 5, "reason": "Compra NF 12345" }'
```

Resposta (201):

```json
{
  "id": 1,
  "inventory_item_id": 1,
  "movement_type": "in",
  "quantity": "5.000",
  "resulting_quantity": "17.000",
  "reason": "Compra NF 12345",
  "created_by_user_id": 1,
  "created_at": "...",
  "created_by": { "id": 1, "name": "Dra. Fulana" }
}
```

---

## 26. Estoque — saída

```bash
curl -X POST "$BASE/inventory/items/1/movements/out" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 2, "reason": "Atendimento paciente Maria da Silva" }'
```

> Tentar tirar mais do que tem em estoque retorna 422:
> `Saída (X) maior que o saldo atual (Y)`.

---

## 27. Estoque — ajuste (apenas ADMIN)

Define o **saldo final desejado** (não é delta). Use após contagem física.

```bash
curl -X POST "$BASE/inventory/items/1/movements/adjustment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "quantity": 10, "reason": "Contagem física do mês fechou em 10 caixas" }'
```

> Recepção e dentista recebem 403. Justificativa é obrigatória (min 3 chars).

---

## 28. Estoque — histórico de movimentações

```bash
# Histórico do item
curl "$BASE/inventory/items/1/movements?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN"

# Todas as movimentações de um tipo num período
curl "$BASE/inventory/movements?type=out&from=2026-05-01T00:00:00-03:00&to=2026-06-01T00:00:00-03:00" \
  -H "Authorization: Bearer $TOKEN"

# Movimentações feitas por um usuário específico
curl "$BASE/inventory/movements?user_id=2" -H "Authorization: Bearer $TOKEN"
```

---

## 29. Estoque — alertas e painel

```bash
# Itens em estoque baixo (current_quantity <= minimum_quantity)
curl "$BASE/inventory/alerts/low-stock" -H "Authorization: Bearer $TOKEN"

# Itens vencendo nos próximos 30 dias (default)
curl "$BASE/inventory/alerts/expiring" -H "Authorization: Bearer $TOKEN"

# Janela customizada (próximos 60 dias)
curl "$BASE/inventory/alerts/expiring?days=60" -H "Authorization: Bearer $TOKEN"

# Painel resumido
curl "$BASE/inventory/summary" -H "Authorization: Bearer $TOKEN"
```

Resposta de `/inventory/summary`:

```json
{
  "total_active_items": 42,
  "total_inactive_items": 3,
  "low_stock_items_count": 5,
  "expiring_items_count": 2,
  "total_movements_current_month": 87
}
```

`/inventory/alerts/expiring` enriquece cada item com `days_until_expiration`:

```json
{
  "items": [
    {
      "id": 7,
      "name": "Anestésico lidocaína",
      "expiration_date": "2026-06-15",
      "days_until_expiration": 15,
      "current_quantity": "8.000",
      "...": "..."
    }
  ],
  "meta": { "page": 1, "page_size": 20, "total": 1, "total_pages": 1 }
}
```

---

## 30. Casos esperados de erro (Fase 6)

| Cenário | Status | Detail |
| ------- | ------ | ------ |
| Saída maior que saldo | 422 | `Saída (X) maior que o saldo atual (Y)` |
| Quantidade <= 0 em IN/OUT | 422 | validação Pydantic (`gt=0`) |
| Ajuste com saldo alvo negativo | 422 | `Saldo alvo não pode ser negativo` |
| Ajuste por DENTIST ou RECEPTIONIST | 403 | `Acesso negado para este recurso` |
| Movimento em item inativo (não-ADMIN) | 422 | `Item inativo. Somente ADMIN pode movimentar item desativado.` |
| Tentar editar `current_quantity` via PATCH | (ignorado) | campo não existe no schema; ignorado silenciosamente |
| Item não existe | 404 | `Item de estoque não encontrado` |
| Ajuste sem motivo (< 3 chars) | 422 | `Justificativa do ajuste é obrigatória` |
| Filtro de expiração com `days` negativo | 422 | `Parâmetro 'days' deve ser >= 0` |

---

## CPFs válidos para testes

CPFs reais não são distribuídos aqui por privacidade. Os exemplos abaixo são **CPFs sintéticos válidos** (passam no algoritmo de DV) usados apenas em ambiente de desenvolvimento:

- `529.982.247-25`
- `390.533.447-05`
- `111.444.777-35`
- `123.456.789-09`
- `987.654.321-00`

---

## Códigos de status esperados

| Situação                                 | Status |
| ---------------------------------------- | ------ |
| Sucesso                                  | 200    |
| Recurso criado                           | 201    |
| CPF inválido / payload inválido          | 422    |
| Sem autenticação                         | 401    |
| Sem permissão para a rota                | 403    |
| Paciente / saúde não encontrado          | 404    |
| CPF já existente / saúde já cadastrada   | 409    |
