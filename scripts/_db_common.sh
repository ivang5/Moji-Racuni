# shellcheck shell=bash
# Zajedničke funkcije za db_*.sh skripte. Ne pokreće se samostalno (source).
#
# Kredencijali se čitaju iz moji_racuni_be/.env (ključevi DB_NAME, DB_USER, DB_PASSWORD,
# DB_HOST, DB_PORT); već postavljene env varijable imaju prednost, kao i u settings.py.
# Klijentu (mariadb, mariadb-dump) se prosleđuju kroz privremeni --defaults-extra-file
# (chmod 600), tako da se lozinka nikad ne pojavljuje na komandnoj liniji, u `ps` ni u logu.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/moji_racuni_be/.env}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"

die() {
    echo "GREŠKA: $*" >&2
    exit 1
}

# Čita jednu vrednost iz .env fajla (bez izvršavanja fajla kao shell skripte).
_env_file_value() {
    local key="$1"
    [[ -f "$ENV_FILE" ]] || return 0
    local line value
    line="$(grep -E "^[[:space:]]*${key}[[:space:]]*=" "$ENV_FILE" | tail -n 1 || true)"
    [[ -n "$line" ]] || return 0
    value="${line#*=}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    if [[ ${#value} -ge 2 && ( ( "${value:0:1}" == '"' && "${value: -1}" == '"' ) || ( "${value:0:1}" == "'" && "${value: -1}" == "'" ) ) ]]; then
        value="${value:1:${#value}-2}"
    fi
    printf '%s' "$value"
}

# Postavlja DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT (env > .env > podrazumevano iz settings.py).
load_db_config() {
    local key default
    for key in DB_NAME DB_USER DB_PASSWORD DB_HOST DB_PORT; do
        if [[ -z "${!key:-}" ]]; then
            printf -v "$key" '%s' "$(_env_file_value "$key")"
        fi
    done
    DB_NAME="${DB_NAME:-moji_racuni}"
    DB_USER="${DB_USER:-root}"
    DB_PASSWORD="${DB_PASSWORD:-root}"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-3306}"

    command -v mariadb >/dev/null || die "nije pronađen 'mariadb' klijent"

    MYCNF="$(mktemp)"
    chmod 600 "$MYCNF"
    trap 'rm -f "$MYCNF"' EXIT
    {
        echo "[client]"
        echo "user=$DB_USER"
        echo "password=$DB_PASSWORD"
        echo "host=$DB_HOST"
        echo "port=$DB_PORT"
    } > "$MYCNF"
}

# mariadb klijent sa kredencijalima iz .env; dodatni argumenti se prosleđuju.
db_client() {
    mariadb --defaults-extra-file="$MYCNF" "$@"
}

db_dump() {
    mariadb-dump --defaults-extra-file="$MYCNF" "$@"
}

# Ime baze sme da sadrži samo slova, cifre i '_' (koristi se u SQL-u bez escape-ovanja).
validate_db_name() {
    [[ "$1" =~ ^[A-Za-z0-9_]{1,64}$ ]] || die "nevalidno ime baze: '$1' (dozvoljeno: slova, cifre, _)"
}

db_exists() {
    [[ -n "$(db_client -N -B -e "SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = '$1'")" ]]
}

db_table_count() {
    db_client -N -B -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$1' AND TABLE_TYPE = 'BASE TABLE'"
}

# Tačan broj redova (COUNT(*)) po tabeli; information_schema.TABLE_ROWS je za InnoDB samo procena.
db_row_counts() {
    local db="$1" table
    for table in $(db_client -N -B -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$db' AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"); do
        printf '%s\t%s\n' "$table" "$(db_client -N -B -e "SELECT COUNT(*) FROM \`$db\`.\`$table\`")"
    done
}
