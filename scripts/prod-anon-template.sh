#!/usr/bin/env bash
#
# Build the local template database s2s_prod_anon: a copy of production with
# every email address replaced and every credential cleared. db.sh
# (run-dev-server) copies each worktree's database, and the shared before
# server's, from it.
#
# Usage, from the root clone or any worktree:
#   scripts/prod-anon-template.sh
#
# It reads production with the DATABASE_URL line of the root clone's
# apps/backend/.env.production, the credential scripts/ro-psql.sh uses, and
# never prints it or passes it on a command line. Steps:
#
#   1. Dump schemas public and drizzle into a private mktemp directory, through
#      Supabase's session pooler (port 5432 on the pooler host): pg_dump needs
#      one session, which the transaction pooler (6543) does not keep. pg_dump
#      reads in one READ ONLY transaction.
#   2. Restore it into a scratch database in the local Postgres (5432), and
#      delete the dump.
#   3. Anonymize the scratch database in place, in one transaction
#      (scripts/prod-anon-template.sql).
#   4. Leak check: dump the anonymized data as text and search it for every
#      production email address. One match fails the build.
#   5. Publish the scratch database as s2s_prod_anon, replacing the old one.
#
# The dump, the needle list and the scratch database are deleted on every
# exit, pass or fail. Production-derived data stays in the local Postgres:
# never dump the template, copy it to another host, or point CI at it.
set -euo pipefail

template=s2s_prod_anon
pg_admin=${S2S_PG_ADMIN:-postgresql://postgres:postgres@localhost:5432/postgres}
pg_base=${pg_admin%/*}
here=$(cd "$(dirname "$0")" && pwd)
started=$(date +%s)

say() { printf '%s [%3ss] %s\n' "$(date +%T)" "$(($(date +%s) - started))" "$*"; }
die() {
  echo "prod-anon-template: $*" >&2
  exit 1
}
pgq() { psql "$pg_admin" -X -v ON_ERROR_STOP=1 -Atqc "$1"; }

command -v pg_dump >/dev/null || die "pg_dump is missing"
command -v python3 >/dev/null || die "python3 is missing"

# The local Postgres holds production-derived data from here on, so it must
# not be reachable from the network.
if ss -Hltn 'sport = :5432' | awk '{print $4}' | rg -qv '^(127\.0\.0\.1|\[::1\]):5432$'; then
  die "port 5432 listens beyond localhost. Bind it to 127.0.0.1 in docker-compose.yml, then: docker compose up -d db"
fi
pgq 'select 1' >/dev/null || die "the local Postgres at localhost:5432 is not up: docker compose up -d db"

common_dir=$(git -C "$here" rev-parse --path-format=absolute --git-common-dir) || die "run this from a studio2stadium checkout"
env_file="$(dirname "$common_dir")/apps/backend/.env.production"
[ -f "$env_file" ] || die "$env_file is missing; see docs/guides/production-data-access.md"

# One refresh at a time.
exec 9>"${TMPDIR:-$HOME}/s2s-prod-anon-template.lock"
flock -n 9 || die "another refresh is running"

work=$(mktemp -d -t s2s-prod-anon.XXXXXX)
chmod 700 "$work"
scratch="s2s_prod_anon_scratch_$$"
cleanup() {
  rm -rf "$work"
  psql "$pg_admin" -X -qc "drop database if exists $scratch with (force)" >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'exit 1' INT TERM HUP

# A pg_service file keeps the credential out of every process's arguments
# and environment. As in ro-psql.sh, read only the DATABASE_URL line, never
# the whole file, and strip one pair of quotes. The parse runs on the URL
# piped in on stdin.
sed -n 's/^DATABASE_URL=//p' "$env_file" | head -n 1 | python3 -I -c '
import sys, urllib.parse
raw = sys.stdin.read().strip()
if len(raw) > 1 and raw[0] == raw[-1] and raw[0] in "\"'"'"'":
    raw = raw[1:-1]
u = urllib.parse.urlsplit(raw)
if not u.hostname or u.scheme not in ("postgres", "postgresql"):
    sys.exit("DATABASE_URL in .env.production is not set or not a postgres URL")
port = u.port or 5432
# The transaction pooler and the session pooler share a host.
if u.hostname.endswith(".pooler.supabase.com") and port == 6543:
    port = 5432
lines = ["[prod]", "host=" + u.hostname, "port=" + str(port),
         "dbname=" + urllib.parse.unquote(u.path.lstrip("/")),
         "user=" + urllib.parse.unquote(u.username or ""),
         "password=" + urllib.parse.unquote(u.password or ""),
         "sslmode=require"]
print("\n".join(lines))
' >"$work/pg_service.conf" 2>"$work/parse.err" || die "$(cat "$work/parse.err")"
chmod 600 "$work/pg_service.conf"

prod() { PGSERVICEFILE="$work/pg_service.conf" PGSERVICE=prod "$@"; }
# Supabase's pooler ignores PGOPTIONS, so the guard is the transaction: the
# identity check opens READ ONLY, and pg_dump opens its own READ ONLY one.
identity=$(prod psql -X -Atq -F' ' <<'SQL'
begin read only;
select current_database(), current_setting('transaction_read_only'),
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('users', 'org_events'));
rollback;
SQL
) || die "could not connect to production"
[ "$identity" = "postgres on 2" ] || die "unexpected production identity (want postgres, read-only, users and org_events tables)"

say "dumping production"
prod pg_dump --format=custom --no-owner --no-privileges --no-subscriptions --no-publications \
  --schema=public --schema=drizzle --file="$work/prod.dump"
say "dump $(du -sh "$work/prod.dump" | cut -f1)"

say "restoring into $scratch"
pgq "create database $scratch" || die "could not create $scratch"
# Production keeps citext in Supabase's extensions schema. Restore it there,
# then move it to public, where the migrations create it locally.
psql "$pg_base/$scratch" -X -q -v ON_ERROR_STOP=1 -c 'set client_min_messages = warning' \
  -c 'create schema extensions' -c 'create extension citext schema extensions'
# pg_dump can be newer than the local server: drop the settings an older
# server does not know. Schema public exists already.
restore() {
  pg_restore --no-owner --no-privileges --section="$1" -f - "$work/prod.dump" |
    rg -v '^SET (transaction_timeout|idle_session_timeout) |^CREATE SCHEMA public;$' |
    psql "$pg_base/$scratch" -X -q -v ON_ERROR_STOP=1 >/dev/null
}
restore pre-data
restore data
restore post-data
rm -f "$work/prod.dump" "$work/pg_service.conf"
say "restored; the dump is deleted"
# rls_auto_enable is Supabase's, not the app's.
psql "$pg_base/$scratch" -X -q -v ON_ERROR_STOP=1 -c 'set client_min_messages = warning' \
  -c 'alter extension citext set schema public' -c 'drop schema extensions cascade' \
  -c 'drop function if exists public.rls_auto_enable()'

say "anonymizing"
psql "$pg_base/$scratch" -X -q -v ON_ERROR_STOP=1 --single-transaction -At -f "$here/prod-anon-template.sql" \
  >"$work/anon.out" 2>&1 || {
  tail -n 20 "$work/anon.out" >&2
  die "anonymizing failed; the scratch database is dropped"
}
cat "$work/anon.out"
rg -q '^users \d+, other addresses left 0$' "$work/anon.out" || die "a user kept a production email"

say "leak check"
psql "$pg_base/$scratch" -X -v ON_ERROR_STOP=1 -Atq \
  -c "\\copy (select kind, v from anon.needle) to '$work/needles.tsv'"
cut -f2 "$work/needles.tsv" >"$work/needles"
needles=$(wc -l <"$work/needles")
[ "$needles" -gt 100 ] || die "only $needles leak-check needles: the source tables look empty"
pg_dump --data-only --exclude-schema=anon --file="$work/data.sql" "$pg_base/$scratch" 2>"$work/pg_dump.err" || {
  cat "$work/pg_dump.err" >&2
  die "could not dump the anonymized data for the leak check"
}
# prod-anon-leak-search.sh finds every candidate and stops the build when rg
# fails. prod-anon-leak-report.py keeps the whole-word matches and names the
# column each survived in, never the value.
"$here/prod-anon-leak-search.sh" "$work/needles" "$work/data.sql" "$work/hits" ||
  die "leak check could not search the anonymized data; the scratch database is dropped"
python3 -I "$here/prod-anon-leak-report.py" "$work/data.sql" "$work/hits" "$work/needles.tsv" >"$work/leaks"
if [ -s "$work/leaks" ]; then
  echo "prod-anon-template: production emails survived anonymizing:" >&2
  sort "$work/leaks" | uniq -c >&2
  die "leak check failed; the scratch database is dropped"
fi
say "leak check passed: $needles addresses, none survived"
rm -f "$work/needles" "$work/needles.tsv" "$work/hits" "$work/data.sql" "$work/leaks"

# Production's migration journal lists a migration that is not on disk. db.sh
# skips the migrate only when the journal matches the migrations on disk row
# for row (folder time in ms, sha256), so drop the journal rows that no
# folder matches, up to the newest folder: a row newer than that may be a
# migration this checkout does not have yet. A migration production has not
# applied yet stays missing, and db.sh runs it.
on_disk=$(
  shopt -s nullglob
  for f in "$here"/../apps/backend/app/database/drizzle/*/migration.sql; do
    name=$(basename "$(dirname "$f")")
    ms=$(date -u -d "${name:0:4}-${name:4:2}-${name:6:2} ${name:8:2}:${name:10:2}:${name:12:2}" +%s000) ||
      die "unexpected migration folder name $name"
    printf "(%s,'%s')," "$ms" "$(sha256sum <"$f" | cut -d' ' -f1)"
  done
)
[ -n "$on_disk" ] || die "no migrations under apps/backend/app/database/drizzle"
psql "$pg_base/$scratch" -X -q -v ON_ERROR_STOP=1 -c "
  with disk(created_at, hash) as (values ${on_disk%,})
  delete from drizzle.__drizzle_migrations
  where (created_at, hash) not in (select created_at, hash from disk)
    and created_at <= (select max(created_at) from disk)"

# Every copy keeps the comment on schema public (a comment on the database
# does not copy), so a copy can be told apart.
psql "$pg_base/$scratch" -X -q -v ON_ERROR_STOP=1 -c 'set client_min_messages = warning' -c 'drop schema anon cascade' \
  -c "comment on schema public is '$template: anonymized production data, built $(date -Is) by scripts/prod-anon-template.sh'" \
  -c 'vacuum (full, analyze)'

say "publishing $template"
if [ "$(pgq "select 1 from pg_database where datname = '$template'")" = 1 ]; then
  pgq "alter database $template with is_template false"
  pgq "drop database $template with (force)"
fi
pgq "alter database $scratch rename to $template"
pgq "alter database $template with is_template true allow_connections false"
pgq "comment on database $template is 'Anonymized production copy, built $(date -Is) by scripts/prod-anon-template.sh'"
size=$(pgq "select pg_size_pretty(pg_database_size('$template'))")
say "prod-anon-template-ok $template ($size)"
