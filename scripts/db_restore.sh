#!/usr/bin/env bash
# Restore backup-a (napravljenog sa db_backup.sh) u zadatu bazu.
#
# Upotreba:
#   scripts/db_restore.sh <fajl.sql.gz|fajl.sql> <ciljna_baza> [--replace]
#   scripts/db_restore.sh <fajl.sql.gz|fajl.sql>                 # glavna baza iz .env (traži potvrdu)
#
# Pravila:
#   - ciljna baza ne postoji      -> pravi se sa charset-om/collation-om iz backup-a;
#   - postoji, ali je prazna      -> restore u nju;
#   - postoji i ima tabele        -> odbija se bez --replace; sa --replace se prvo napravi
#                                    backup te baze (db_backup.sh), pa se ona briše i pravi ponovo;
#   - ciljna baza je glavna (DB_NAME iz .env) -> uvek traži eksplicitnu potvrdu: ukucati ime
#                                    baze, ili za neinteraktivno pokretanje --confirm <ime_baze>.

source "$(dirname "${BASH_SOURCE[0]}")/_db_common.sh"

usage() { sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; }

FILE=""
TARGET=""
REPLACE=0
CONFIRM=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help) usage; exit 0 ;;
        --replace) REPLACE=1 ;;
        --confirm) shift; CONFIRM="${1:-}" ;;
        -*) die "nepoznata opcija: $1" ;;
        *)
            if [[ -z "$FILE" ]]; then FILE="$1"
            elif [[ -z "$TARGET" ]]; then TARGET="$1"
            else die "previše argumenata"
            fi ;;
    esac
    shift
done

[[ -n "$FILE" ]] || { usage; exit 1; }
[[ -f "$FILE" ]] || die "fajl '$FILE' ne postoji"

load_db_config
TARGET="${TARGET:-$DB_NAME}"
validate_db_name "$TARGET"

case "$FILE" in
    *.gz) read_dump() { gzip -dc "$FILE"; } ;;
    *)    read_dump() { cat "$FILE"; } ;;
esac

if [[ "$TARGET" == "$DB_NAME" ]]; then
    echo "PAŽNJA: ciljna baza '$TARGET' je GLAVNA baza aplikacije (DB_NAME iz .env)."
    if [[ "$CONFIRM" != "$TARGET" ]]; then
        [[ -t 0 ]] || die "neinteraktivno pokretanje: za restore u glavnu bazu dodati --confirm $TARGET"
        read -r -p "Za nastavak ukucajte ime baze ($TARGET): " ANSWER
        [[ "$ANSWER" == "$TARGET" ]] || die "potvrda se ne poklapa, restore je otkazan"
    fi
fi

# Charset/collation iz prvog reda backup-a (vidi db_backup.sh)
HEADER="$(read_dump | head -n 1 || true)"
CHARSET="$(sed -nE 's/.*charset=([A-Za-z0-9_]+).*/\1/p' <<< "$HEADER")"
COLLATION="$(sed -nE 's/.*collation=([A-Za-z0-9_]+).*/\1/p' <<< "$HEADER")"
if [[ -n "$CHARSET" && -n "$COLLATION" ]]; then
    CREATE_SQL="CREATE DATABASE \`$TARGET\` CHARACTER SET $CHARSET COLLATE $COLLATION"
else
    echo "Upozorenje: backup nema zaglavlje sa charset-om; baza se pravi sa podrazumevanim charset-om servera." >&2
    CREATE_SQL="CREATE DATABASE \`$TARGET\`"
fi

if db_exists "$TARGET"; then
    if [[ "$(db_table_count "$TARGET")" -gt 0 ]]; then
        [[ "$REPLACE" -eq 1 ]] || die "baza '$TARGET' već ima tabele; za zamenu dodati --replace (pre brisanja se pravi backup)"
        echo "Backup postojeće baze '$TARGET' pre zamene..."
        ENV_FILE="$ENV_FILE" BACKUP_DIR="$BACKUP_DIR" "$(dirname "${BASH_SOURCE[0]}")/db_backup.sh" "$TARGET"
        db_client -e "DROP DATABASE \`$TARGET\`"
        db_client -e "$CREATE_SQL"
    fi
else
    db_client -e "$CREATE_SQL"
fi

echo "Restore '$FILE' -> '$TARGET'..."
read_dump | db_client --default-character-set=utf8mb4 "$TARGET"

echo "Gotovo. Broj redova po tabeli u '$TARGET':"
db_row_counts "$TARGET"
