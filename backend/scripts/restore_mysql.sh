#!/usr/bin/env bash
#
# Restore de um backup lógico gerado por backup_mysql.sh.
#
# Uso:
#   export DB_HOST=... DB_PORT=3306 DB_USER=... DB_PASSWORD=... DB_NAME=clinic_db
#   ./scripts/restore_mysql.sh /caminho/backup.sql.gz
#
# ATENÇÃO:
#   * Isso SOBRESCREVE o conteúdo do banco de destino. Confirme o DB_NAME.
#   * Restaure SEMPRE primeiro em um banco de teste antes de tocar produção.
#   * O arquivo de backup contém dados sensíveis: trate com o mesmo cuidado.
#
set -euo pipefail

: "${DB_HOST:?defina DB_HOST}"
: "${DB_USER:?defina DB_USER}"
: "${DB_NAME:?defina DB_NAME}"
: "${DB_PASSWORD:?defina DB_PASSWORD}"
DB_PORT="${DB_PORT:-3306}"

BACKUP_FILE="${1:?informe o arquivo de backup (.sql ou .sql.gz)}"
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Arquivo não encontrado: $BACKUP_FILE" >&2
  exit 1
fi

echo "ATENÇÃO: o restore vai sobrescrever o banco '${DB_NAME}' em ${DB_HOST}:${DB_PORT}."
read -r -p "Digite o nome do banco para confirmar: " CONFIRM
if [[ "$CONFIRM" != "$DB_NAME" ]]; then
  echo "Confirmação não confere. Abortando." >&2
  exit 1
fi

echo "Restaurando ${BACKUP_FILE} em '${DB_NAME}' ..."

if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" \
    | MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME"
else
  MYSQL_PWD="$DB_PASSWORD" mysql --host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME" < "$BACKUP_FILE"
fi

echo "Restore concluído."
