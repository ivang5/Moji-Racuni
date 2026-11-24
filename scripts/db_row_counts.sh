#!/usr/bin/env bash
# Ispisuje tačan broj redova (COUNT(*)) po tabeli, npr. za poređenje baze pre/posle restore-a ili migracije.
#
# Upotreba:
#   scripts/db_row_counts.sh               # baza iz moji_racuni_be/.env (DB_NAME)
#   scripts/db_row_counts.sh <baza>
#   diff <(scripts/db_row_counts.sh moji_racuni) <(scripts/db_row_counts.sh moji_racuni_copy)

source "$(dirname "${BASH_SOURCE[0]}")/_db_common.sh"

case "${1:-}" in
    -h|--help) sed -n '2,7p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
esac

load_db_config
DB="${1:-$DB_NAME}"
validate_db_name "$DB"
db_exists "$DB" || die "baza '$DB' ne postoji"
db_row_counts "$DB"
