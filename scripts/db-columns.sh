#!/usr/bin/env bash
#
# Print a table's columns from this worktree's own local database, so SQL uses
# real column names instead of guessed ones.
#
# Usage, from inside a studio2stadium checkout or worktree:
#   scripts/db-columns.sh org_events           # columns, types, nullability, defaults
#   scripts/db-columns.sh org_events schools   # several tables
#   scripts/db-columns.sh                      # list every table
#
# The database is DATABASE_URL in apps/backend/.env, the worktree's private
# copy written by the run-dev-server skill (postgres on localhost:5432). When
# that database does not exist yet, it falls back to the shared before
# server's database, which carries main's schema, and says so. It only
# ever connects to localhost and runs every query read-only; production
# columns are the same as main's, so this answers production questions too.
set -euo pipefail

die() {
  printf 'db-columns: %s\n' "$*" >&2
  exit 1
}

root=$(git rev-parse --show-toplevel 2>/dev/null) || die "run this from inside a studio2stadium checkout or worktree"
env_file="$root/apps/backend/.env"
fallback_url=postgresql://postgres:postgres@localhost:5432/s2s_before_server_main

url=""
if [ -f "$env_file" ]; then
  while IFS= read -r line; do
    case "$line" in DATABASE_URL=*) url=${line#DATABASE_URL=} ;; esac
  done <"$env_file"
  url=${url#[\"\']}
  url=${url%[\"\']}
fi
local_url='^postgres(ql)?://([^@/]*@)?(localhost|127\.0\.0\.1)(:[0-9]+)?/'
if [ -z "$url" ]; then
  echo "db-columns: $env_file has no DATABASE_URL; showing main's schema from s2s_before_server_main." >&2
  echo "db-columns: give this worktree its own database with .agents/skills/run-dev-server/scripts/up.sh." >&2
  url=$fallback_url
elif ! [[ $url =~ $local_url ]]; then
  die "DATABASE_URL in $env_file is not a localhost database; this script reads only local ones (up.sh in the run-dev-server skill gives this worktree its own)"
fi

export PGOPTIONS="-c default_transaction_read_only=on -c statement_timeout=10s"
export PGCONNECT_TIMEOUT=5

psql_ro() {
  psql "$url" -X -q -v ON_ERROR_STOP=1 "$@"
}

if ! err=$(psql_ro -At -c 'SELECT 1' 2>&1 >/dev/null); then
  if [ "$url" != "$fallback_url" ] && [[ $err == *"does not exist"* ]]; then
    echo "db-columns: this worktree's database does not exist yet; showing main's schema from s2s_before_server_main." >&2
    echo "db-columns: create yours with .agents/skills/run-dev-server/scripts/up.sh." >&2
    url=$fallback_url
    err=$(psql_ro -At -c 'SELECT 1' 2>&1 >/dev/null) || die "cannot reach local postgres: $err"
  else
    die "cannot reach local postgres (docker compose up -d db starts it on localhost:5432): $err"
  fi
fi

if [ $# -eq 0 ]; then
  psql_ro -At <<'SQL'
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY 1;
SQL
  exit
fi

status=0
for table in "$@"; do
  found=$(psql_ro -At -v table="$table" <<'SQL'
SELECT to_regclass(:'table') IS NOT NULL;
SQL
  )
  if [ "$found" != "t" ]; then
    echo "db-columns: no table named $table. Tables with a similar name:" >&2
    psql_ro -At -v table="$table" <<'SQL' >&2
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name ILIKE '%' || :'table' || '%' OR :'table' ILIKE table_name || '%')
ORDER BY 1;
SQL
    status=1
    continue
  fi
  psql_ro -v table="$table" <<'SQL'
\pset footer off
\pset title :table
SELECT a.attname AS column,
       format_type(a.atttypid, a.atttypmod) AS type,
       CASE WHEN a.attnotnull THEN 'not null' ELSE '' END AS nullable,
       coalesce(pg_get_expr(d.adbin, d.adrelid), '') AS "default"
FROM pg_attribute a
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
WHERE a.attrelid = to_regclass(:'table')
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;
SQL
done
exit "$status"
