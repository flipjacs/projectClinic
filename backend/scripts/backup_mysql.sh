#!/usr/bin/env bash
#
# Backup lógico do MySQL via mysqldump.
#
# Uso:
#   export DB_HOST=... DB_PORT=3306 DB_USER=... DB_PASSWORD=... DB_NAME=clinic_db
#   export BACKUP_DIR=/caminho/seguro/backups        # opcional (default: ./backups)
#   ./scripts/backup_mysql.sh
#
# Segurança:
#   * NUNCA coloque senha hardcoded aqui — tudo vem de variáveis de ambiente.
#   * A senha é passada via MYSQL_PWD para não aparecer na lista de processos.
#   * Backups contêm DADOS SENSÍVEIS de pacientes/prontuários: armazene
#     criptografado, com acesso restrito, e NUNCA versione no Git.
#
set -euo pipefail

: "${DB_HOST:?defina DB_HOST}"
: "${DB_USER:?defina DB_USER}"
: "${DB_NAME:?defina DB_NAME}"
: "${DB_PASSWORD:?defina DB_PASSWORD}"
DB_PORT="${DB_PORT:-3306}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" || true

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUTFILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Gerando backup de '${DB_NAME}' em ${OUTFILE} ..."

# --single-transaction: backup consistente sem travar tabelas InnoDB.
# --routines/--triggers/--events: inclui objetos de schema.
MYSQL_PWD="$DB_PASSWORD" mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  "$DB_NAME" \
  | gzip -c > "$OUTFILE"

chmod 600 "$OUTFILE" || true
echo "Backup concluído: ${OUTFILE}"
echo "Lembre-se: armazene de forma criptografada e fora do repositório."
