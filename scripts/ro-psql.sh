#!/usr/bin/env bash
#
# Read-only psql against the production database.
#
# The production credential lives only in the root clone's
# apps/backend/.env.production, never in a worktree
# (docs/guides/production-data-access.md). This finds that file from the root
# clone or any worktree, loads only DATABASE_URL, and runs your SQL inside one
# read-only transaction. It never prints the connection string.
#
# DATABASE_URL is the Supabase owner login. Nothing in the credential stops a
# write, so the guard is the transaction this script opens. Supabase's pooler
# ignores PGOPTIONS, so `-c default_transaction_read_only=on` does nothing
# there; BEGIN READ ONLY does.
#
# Usage, from inside a studio2stadium checkout or worktree:
#   scripts/ro-psql.sh -f query.sql          # or SQL on stdin
#   scripts/ro-psql.sh -At -f query.sql      # other psql output flags pass through
#   scripts/ro-psql.sh --describe org_events
#   scripts/ro-psql.sh --whoami
set -euo pipefail

common_dir=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || {
  echo "ro-psql: run this from inside a studio2stadium checkout or worktree." >&2
  exit 1
}
env_file="$(dirname "$common_dir")/apps/backend/.env.production"
if [ ! -f "$env_file" ]; then
  echo "ro-psql: $env_file is missing." >&2
  echo "ro-psql: the production credential lives only in the root clone; see docs/guides/production-data-access.md." >&2
  exit 1
fi

# Read the one DATABASE_URL line instead of sourcing the file, so no other
# secret in it enters this process. Strip one pair of surrounding quotes.
url=$(sed -n 's/^DATABASE_URL=//p' "$env_file" | head -n 1)
url=${url#\"}
url=${url%\"}
url=${url#\'}
url=${url%\'}
if [ -z "$url" ]; then
  echo "ro-psql: DATABASE_URL is not set in $env_file." >&2
  exit 1
fi

# Every statement runs in one transaction that opens READ ONLY. The first
# query takes a snapshot, after which Postgres refuses SET TRANSACTION READ
# WRITE. SET LOCAL keeps the timeouts on this transaction only, so nothing
# leaks onto the pooler's shared connections.
preamble="BEGIN READ ONLY;
SET LOCAL statement_timeout = '60s';
SET LOCAL lock_timeout = '1s';
SET LOCAL idle_in_transaction_session_timeout = '60s';
SELECT current_user AS \"user\", current_database() AS database,
       current_setting('transaction_read_only') AS read_only \\gset ro_
\\if :ro_read_only
\\else
\\echo 'ro-psql: the transaction is not read-only; nothing ran.'
SELECT 1 / 0;
\\endif"
whoami_sql="SELECT current_user AS \"user\", current_database() AS database,
       current_setting('transaction_read_only') AS read_only;"

# Refuse SQL that could end the read-only transaction or leave it: a statement
# that starts with COMMIT, ROLLBACK, BEGIN or END ends it and later statements
# would autocommit, and \connect, \include, \! and \gexec run SQL or commands
# this check never sees. Keywords count only at the start of a statement, so
# CASE ... END passes.
check_sql() {
  local hits
  hits=$(printf '%s\n' "$1" | grep -inE \
    '(^|;)[[:space:]]*(commit|rollback|begin|end|abort|start[[:space:]]+transaction|savepoint|release|prepare[[:space:]]+transaction|set[[:space:]]+(session|transaction)|reset|discard)([^a-z_]|$)|transaction_read_only|^[[:space:]]*\\(c|connect|i|ir|include|include_relative|!|gexec|o|out|w|write|copy)([^a-z]|$)' \
    || true)
  if [ -n "$hits" ]; then
    echo "ro-psql: refused. This SQL has transaction control or a psql command that could leave the read-only transaction:" >&2
    printf '%s\n' "$hits" >&2
    echo "ro-psql: a write needs the captain's explicit yes; see docs/guides/production-data-access.md." >&2
    exit 2
  fi
}

run() {
  # $1 is the SQL; the rest are psql flags.
  local sql=$1
  shift
  printf '%s\n%s\n;\nROLLBACK;\n' "$preamble" "$sql" |
    psql "$url" -X -q -v ON_ERROR_STOP=1 "$@"
}

case "${1:-}" in
  --whoami)
    run "$whoami_sql"
    exit
    ;;
  --describe)
    if [ $# -ne 2 ]; then
      echo "usage: ro-psql.sh --describe <table>" >&2
      exit 2
    fi
    if ! [[ $2 =~ ^[A-Za-z_][A-Za-z0-9_.]*$ ]]; then
      echo "ro-psql: $2 is not a table name." >&2
      exit 2
    fi
    run "SELECT to_regclass('$2') IS NOT NULL AS found \\gset ro_
\\if :ro_found
\\else
SELECT 'no table named $2. Similar: ' || coalesce(string_agg(table_schema || '.' || table_name, ', ' ORDER BY 1), 'none') AS missing
FROM information_schema.tables WHERE table_name ILIKE '%$2%';
\\quit
\\endif
SELECT a.attname AS column,
       format_type(a.atttypid, a.atttypmod) AS type,
       CASE WHEN a.attnotnull THEN 'not null' ELSE '' END AS nullable,
       coalesce(pg_get_expr(d.adbin, d.adrelid), '') AS \"default\"
FROM pg_attribute a
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE a.attrelid = to_regclass('$2')
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;"
    exit
    ;;
esac

# Collect the SQL from -f or stdin; pass every other flag to psql.
sql_file=""
psql_args=()
while [ $# -gt 0 ]; do
  case "$1" in
    -f | --file)
      sql_file=${2:?ro-psql: -f needs a file}
      shift 2
      ;;
    -c | --command | -1 | --single-transaction | -d | --dbname | -h | --host | -p | --port | -U | --username)
      echo "ro-psql: $1 is not supported. Pass SQL with -f <file> or on stdin; the script picks the database." >&2
      exit 2
      ;;
    *)
      psql_args+=("$1")
      shift
      ;;
  esac
done

if [ -n "$sql_file" ]; then
  sql=$(cat -- "$sql_file")
elif [ ! -t 0 ]; then
  sql=$(cat)
else
  echo "usage: ro-psql.sh [psql output flags] -f query.sql   (or SQL on stdin)" >&2
  exit 2
fi

check_sql "$sql"
# bash 3.2 (macOS) treats an empty array as unset under `set -u`.
run "$sql" ${psql_args[@]+"${psql_args[@]}"}
