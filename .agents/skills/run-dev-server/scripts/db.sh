#!/usr/bin/env bash
# Create and migrate this branch's own databases, s2s_<slug> for the server
# and s2s_<slug>_test for the backend tests, and point the private
# apps/backend/.env at the first. A new database is a copy of the schema
# template the global dev-loop skill's db-template.sh keeps, built once per
# migration head (.agents/dev-loop.sh configures it). Without that skill, or
# with RUN_DEV_SERVER_NO_TEMPLATE=1, it creates an empty database and migrates
# it. A database that already holds every migration on disk skips the
# migrate. There is no seed: sign-in.sh creates the users it signs in as.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

[ $# = 0 ] || die "db.sh takes no options"

db_exists() { [ "$(psql "$pg_admin" -Atc "select 1 from pg_database where datname = '$1'")" = 1 ]; }

# Each migration on disk as "<folder time in ms><TAB><sha256 of
# migration.sql>", sorted. drizzle-kit applies every folder that holds a
# migration.sql and records the same pair in drizzle.__drizzle_migrations
# (created_at, hash).
migrations_dir=apps/backend/app/database/drizzle
disk_migrations() {
  local -a files names
  local f stamps hashes
  shopt -s nullglob
  files=("$migrations_dir"/*/migration.sql)
  shopt -u nullglob
  [ ${#files[@]} -gt 0 ] || return 0
  for f in "${files[@]}"; do
    f=${f%/migration.sql}
    names+=("${f##*/}")
  done
  # One date and one sha256sum for every folder, in folder order.
  # shellcheck disable=SC2016 # sd's capture groups, not shell variables
  stamps=$(printf '%s\n' "${names[@]}" \
    | sd '^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})_.*$' '$1-$2-$3 $4:$5:$6 UTC' \
    | date -f - +%s000) || return 1
  hashes=$(sha256sum "${files[@]}" | cut -d' ' -f1) || return 1
  paste <(printf '%s\n' "$stamps") <(printf '%s\n' "$hashes") | LC_ALL=C sort
}
disk=$(disk_migrations) || die "could not read the migrations in $migrations_dir"

# True only when the database provably holds every migration on disk and
# nothing else: the same times and hashes, row for row. Anything else,
# including a missing table or a drizzle config that moves the folder,
# returns false, and db.sh runs the migrate.
migrations_up_to_date() {
  local config=apps/backend/drizzle.config.ts applied
  rg -qF 'out: "./app/database/drizzle"' "$config" || return 1
  [ -n "$disk" ] || return 1
  applied=$(psql "$pg_base/$1" -AtF $'\t' -v ON_ERROR_STOP=1 \
    -c 'select created_at, hash from drizzle.__drizzle_migrations' 2>/dev/null \
    | LC_ALL=C sort) || return 1
  [ "$disk" = "$applied" ]
}

# Usage: ensure_db NAME. Prints reused, new, or "copied <template>".
ensure_db() {
  local name=$1 global=$HOME/.agents/skills/dev-loop/scripts/db-template.sh copied
  if db_exists "$name"; then
    echo reused
    return
  fi
  if [ -z "${RUN_DEV_SERVER_NO_TEMPLATE:-}" ] && [ -x "$global" ]; then
    copied=$("$global" --db "$name" --kind schema) || die "$global failed (above)"
    printf '%s\n' "$copied" | rg -v '^db-template-ok ' >&2 || true
    printf '%s\n' "$copied" | rg -o '^db-template-ok \S+ \((copied \S+)\)$' -r '$1'
    return
  fi
  psql "$pg_admin" -qc "create database $name" >/dev/null || die "could not create $name"
  # Supabase ships citext; the migrations use it without creating it.
  psql "$pg_base/$name" -q -c "set client_min_messages = warning" -c "create extension if not exists citext" \
    || die "could not create the citext extension in $name"
  echo new
}

state=$(ensure_db "$db")
test_state=$(ensure_db "$test_db")

# The root clone's DATABASE_URL may name Cameron's database; this copy must
# only ever reach its own.
set_env_var DATABASE_URL "$db_url"
rg -qxF "DATABASE_URL=$db_url" "$env_file" || die "could not set DATABASE_URL in $env_file"

# drizzle-kit reads DATABASE_URL through dotenv from apps/backend/.env, and a
# shell variable beats the file. drizzle-kit takes seconds even with nothing
# to apply; reading the table takes a fraction of one.
log="$out_dir/run-dev-server-db-$slug.log"
: >"$log"
migrate() {
  local name=$1
  if migrations_up_to_date "$name"; then
    echo "migrate skipped: all $(printf '%s\n' "$disk" | wc -l) migrations already applied to $name" >>"$log"
    echo skipped
    return
  fi
  (cd apps/backend && DATABASE_URL=$pg_base/$name pnpm db:migrate) >>"$log" 2>&1 \
    || die "migrate failed on $name: read $log"
  echo migrated
}
migrate_state=$(migrate "$db")
test_migrate_state=$(migrate "$test_db")
tables=$(psql "$db_url" -Atc "select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'users'")
[ "$tables" = 1 ] || die "$db has no users table after migrating: read $log"

echo "DATABASE_URL=$db_url"
echo "TEST_DATABASE_URL=$test_db_url"
echo "db-ok $db ($state, $migrate_state) $test_db ($test_state, $test_migrate_state)"
