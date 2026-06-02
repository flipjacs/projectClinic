# Checklist pré-serviço (antes de usar com dados reais)

Lista de verificação para colocar o backend em **piloto controlado**. Marque cada
item antes de cadastrar qualquer dado real de paciente.

> Regra de ouro: **nenhum dado real** entra no sistema antes que TODOS os itens
> de segurança abaixo estejam verdes.

---

## 1. Testes

### SQLite (rápido)
```bash
cd backend
pytest                                              # tudo
pytest --cov=app --cov-report=term-missing --cov-fail-under=80   # com gate de 80%
```

### MySQL real (fidelidade total: concorrência + Alembic smoke + mysql_only)
```bash
cd backend
docker compose -f docker-compose.test.yml up -d      # aguarde "healthy"
export TEST_DATABASE_URL="mysql+pymysql://clinic:clinic_password@127.0.0.1:3307/clinic_test"
pytest
docker compose -f docker-compose.test.yml down -v
```
- [ ] Suíte SQLite passa com cobertura ≥ 80%.
- [ ] Suíte MySQL passa (inclui `mysql_only`, concorrência e smoke de migrations).

## 2. Migrations
```bash
export DATABASE_URL="mysql+pymysql://USER:PWD@HOST:3306/clinic_db"
alembic upgrade head          # aplica o schema
alembic current               # confirma a revisão atual
```
- [ ] `alembic upgrade head` roda sem erros no banco de produção/piloto.
- [ ] `alembic downgrade base` validado em banco de teste (não em produção).

## 3. Admin inicial
```bash
python -m app.cli.create_admin            # lê INITIAL_ADMIN_* do .env
# ou
python -m app.cli.create_admin --name "Dra. Chefe" --email "chefe@clinic.com.br" --password '<forte>'
```
- [ ] Admin criado; e-mail com TLD válido (`.com`/`.com.br`); senha em hash argon2.
- [ ] CLI é idempotente (não duplica admin).

## 4. Configuração `.env`
- [ ] Copiado de `.env.example` e **todos** os placeholders trocados.
- [ ] `APP_ENV=production` no ambiente real.
- [ ] `APP_DEBUG=false`.
- [ ] Nenhum segredo real versionado no Git (`.env` está no `.gitignore`).

## 5. CORS
- [ ] `CORS_ORIGINS` lista **apenas** as origens reais do front (sem `*`).
- [ ] Em produção, a app **recusa subir** com `*` ou lista vazia (validação em
      `app/core/config.py`).

## 6. SECRET_KEY
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```
- [ ] `SECRET_KEY` forte (≥ 32 chars), única, fora do repositório.
- [ ] Não é o placeholder do `.env.example` (a app recusa subir em produção).

## 7. Conexão com o banco
- [ ] `DATABASE_URL` (ou `DB_*`) aponta para o MySQL de produção, com usuário
      dedicado e senha forte (não `clinic_password`).
- [ ] `GET /ready` retorna `200 {"status":"ready","database":"up"}`.
- [ ] `GET /health` retorna `200 {"status":"ok"}`.

## 8. Backups
- [ ] `scripts/backup_mysql.sh` agendado (cron diário) — ver `docs/backup.md`.
- [ ] Backup **criptografado** e armazenado fora do servidor de app.
- [ ] **Restore testado** em banco de teste com sucesso.

## 9. Permissões (RBAC)
- [ ] Recepcionista **não** acessa prontuários, finanças nem export de pacientes.
- [ ] Dentista **não** gerencia usuários nem faz ajuste de estoque.
- [ ] Apenas ADMIN cria usuários e exporta dados com CPF.
- [ ] Sistema **nunca** fica sem um ADMIN ativo (proteção do último admin).

## 10. Audit log
- [ ] Mutações sensíveis (paciente, prontuário, pagamento, orçamento, estoque)
      geram registro em `audit_logs` com `actor_user_id`, `ip_address`,
      `user_agent` e diff **mascarado**.
- [ ] `password_hash`, senha e tokens **nunca** aparecem no audit (teste cobre).
- [ ] CPF/telefone/e-mail e conteúdo clínico aparecem mascarados.

## 11. Financeiro
- [ ] Total de orçamento calculado no backend (ignora valor do cliente).
- [ ] Soma de pagamentos não-cancelados **nunca** ultrapassa o total (testado sob
      concorrência no MySQL).
- [ ] Apenas pagamentos `PAID` contam como receita.

## 12. Estoque
- [ ] Saída não deixa saldo negativo (testado sob concorrência).
- [ ] Toda movimentação válida gera histórico imutável; inválida não altera saldo.
- [ ] Ajuste manual restrito ao ADMIN.

## 13. Agenda
- [ ] Conflito de horário do mesmo dentista é bloqueado; adjacentes permitidos.
- [ ] Datas normalizadas em segundos (sem flakiness de microssegundos no MySQL).
- [ ] Não permite agendar no passado; paciente/dentista inativos bloqueados.

## 14. Prontuário
- [ ] Dentista só lê os próprios prontuários; ADMIN lê todos; recepção não acessa.
- [ ] `dentist_id` vem do token (spoofing ignorado).
- [ ] Conteúdo clínico não vaza em logs nem no audit.

## 15. Observabilidade / operação
- [ ] Logs técnicos com `request_id` e **sem** dados sensíveis (scrubber ativo).
- [ ] Erros inesperados retornam mensagem genérica (sem stack trace ao cliente).
- [ ] CI verde (SQLite + MySQL + Alembic + cobertura).
- [ ] `pip-audit` revisado (ver `docs/testing.md` / `requirements-dev.txt`).

---

## Antes de liberar para dados reais — resumo

- [ ] Itens 4–10 (segurança) **todos** verdes.
- [ ] Backup automatizado **e** restore testado.
- [ ] Admin inicial criado e demais usuários cadastrados por ele.
- [ ] `/health` e `/ready` monitorados externamente.
