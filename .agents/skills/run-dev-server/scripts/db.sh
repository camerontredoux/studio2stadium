#!/usr/bin/env bash
# Create and migrate this branch's own databases, s2s_<slug> for the server
# and s2s_<slug>_test for the backend tests, and point the private
# apps/backend/.env at the first. There is no seed: sign-in.sh creates the
# users it signs in as.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

[ $# = 0 ] || die "db.sh takes no options"

ensure_db() {
  if [ "$(psql "$pg_admin" -Atc "select 1 from pg_database where datname = '$1'")" = 1 ]; then
    echo reused
  else
    psql "$pg_admin" -qc "create database $1" >/dev/null || die "could not create $1"
    echo new
  fi
  # Supabase ships citext; the migrations use it without creating it.
  psql "$pg_base/$1" -q -c "set client_min_messages = warning" -c "create extension if not exists citext" \
    || die "could not create the citext extension in $1"
}

state=$(ensure_db "$db")
ensure_db "$test_db" >/dev/null

# The root clone's DATABASE_URL may name Cameron's database; this copy must
# only ever reach its own.
set_env_var DATABASE_URL "$db_url"
rg -qxF "DATABASE_URL=$db_url" "$env_file" || die "could not set DATABASE_URL in $env_file"

# drizzle-kit reads DATABASE_URL through dotenv from apps/backend/.env, and a
# shell variable beats the file, so unset it for the dev database and set it
# for the test one.
log="$out_dir/run-dev-server-db-$slug.log"
(cd apps/backend && env -u DATABASE_URL pnpm db:migrate) >"$log" 2>&1 \
  || die "migrate failed on $db: read $log"
(cd apps/backend && DATABASE_URL=$test_db_url pnpm db:migrate) >>"$log" 2>&1 \
  || die "migrate failed on $test_db: read $log"
tables=$(psql "$db_url" -Atc "select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'users'")
[ "$tables" = 1 ] || die "$db has no users table after migrating: read $log"

echo "DATABASE_URL=$db_url"
echo "TEST_DATABASE_URL=$test_db_url"
echo "db-ok $db ($state)"
