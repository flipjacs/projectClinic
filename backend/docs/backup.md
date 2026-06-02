# Backup e restore (MySQL)

Estratégia mínima de backup para o piloto controlado. Os dados são **sensíveis**
(pacientes, prontuários, financeiro) — trate os backups com o mesmo rigor do
banco de produção.

## Scripts

Ambos usam **variáveis de ambiente** (sem senha hardcoded) e a senha é passada
via `MYSQL_PWD` (não aparece na lista de processos):

```bash
export DB_HOST=127.0.0.1 DB_PORT=3306 DB_USER=clinic DB_PASSWORD='***' DB_NAME=clinic_db
export BACKUP_DIR=/var/backups/clinic          # local seguro, fora do repo

# backup (gera ./backups/clinic_db_YYYYMMDD_HHMMSS.sql.gz)
./scripts/backup_mysql.sh

# restore (pede confirmação do nome do banco antes de sobrescrever)
./scripts/restore_mysql.sh /var/backups/clinic/clinic_db_20260601_030000.sql.gz
```

O backup usa `mysqldump --single-transaction` (consistente, sem travar tabelas
InnoDB) e inclui rotinas/triggers/events.

## Frequência recomendada (piloto)

- **Diário**, em horário de baixo uso (ex.: madrugada).
- Retenção sugerida: 7 diários + 4 semanais + alguns mensais.
- Automatize com `cron` chamando `scripts/backup_mysql.sh`.

Exemplo de cron (03:00 todo dia):

```cron
0 3 * * *  cd /opt/clinic/backend && DB_HOST=... DB_USER=... DB_PASSWORD=... DB_NAME=clinic_db BACKUP_DIR=/var/backups/clinic ./scripts/backup_mysql.sh >> /var/log/clinic_backup.log 2>&1
```

## Cuidados com dados sensíveis

- **Criptografe** os backups em repouso (ex.: `age`, `gpg`, ou disco/bucket
  criptografado). Restrinja acesso (`chmod 600`, ACLs).
- **Nunca** versione backups no Git — já bloqueado no `.gitignore`
  (`backups/`, `*.sql`, `*.sql.gz`, `*.dump`).
- Armazenamento **fora do servidor de aplicação** (outro host/bucket) para
  sobreviver à perda da máquina.
- Considere a LGPD: minimize cópias, registre acessos e defina retenção.

## Teste periódico de restore

Backup que nunca foi restaurado **não é** backup. Mensalmente:

1. Suba um MySQL descartável (ou use `docker-compose.test.yml`).
2. Restaure o backup mais recente em um `DB_NAME` de teste.
3. Rode `alembic current` e uma verificação simples (contagem de tabelas,
   `SELECT COUNT(*)` em pacientes/pagamentos) para validar integridade.
4. Documente data e resultado do teste.
