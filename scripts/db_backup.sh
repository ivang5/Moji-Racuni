#!/usr/bin/env bash
# Backup MariaDB baze aplikacije u backups/<baza>_<timestamp>.sql.gz
#
# Upotreba:
#   scripts/db_backup.sh            # baza iz moji_racuni_be/.env (DB_NAME)
#   scripts/db_backup.sh <baza>     # druga baza sa istim kredencijalima
#
# Promenljive okruženja: ENV_FILE (podrazumevano moji_racuni_be/.env), BACKUP_DIR (podrazumevano backups/).
# Prvi red dump-a je komentar sa charset-om i collation-om baze; db_restore.sh ga koristi
# da bi ciljnu bazu napravio sa istim podešavanjima.

source "$(dirname "${BASH_SOURCE[0]}")/_db_common.sh"

case "${1:-}" in
    -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
esac

load_db_config
command -v mariadb-dump >/dev/null || die "nije pronađen 'mariadb-dump'"

DB="${1:-$DB_NAME}"
validate_db_name "$DB"
db_exists "$DB" || die "baza '$DB' ne postoji"

read -r CHARSET COLLATION < <(db_client -N -B -e \
    "SELECT DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$DB'")

mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/${DB}_${TIMESTAMP}.sql.gz"
TMP_OUT="$OUT.part"

umask 077
if ! {
    echo "-- moji-racuni-backup db=$DB charset=$CHARSET collation=$COLLATION created=$(date -Iseconds)"
    db_dump --single-transaction --routines --triggers --default-character-set=utf8mb4 "$DB"
} | gzip -c > "$TMP_OUT"; then
    rm -f "$TMP_OUT"
    die "backup baze '$DB' nije uspeo"
fi
mv "$TMP_OUT" "$OUT"

echo "Backup baze '$DB' ($(db_table_count "$DB") tabela, $CHARSET/$COLLATION): $OUT ($(du -h "$OUT" | cut -f1))"
