#!/usr/bin/env bash
#
# Behavioural tests for scripts/ro-psql.sh.
#
# What the script owns is finding the root clone's env file, handing psql only
# DATABASE_URL, wrapping the SQL in one read-only transaction, and refusing SQL
# or flags that could get out of it. Each case runs the real script in a
# throwaway repository and worktree with a stub `psql` on PATH that records its
# arguments, environment and stdin. No database is contacted.
#
#   bash scripts/ro-psql.test.sh
#
set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SCRIPT="$ROOT/scripts/ro-psql.sh"

failures=0
fail() {
  echo "FAIL: $1"
  failures=$((failures + 1))
}
pass() { echo "ok: $1"; }

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

mkdir "$work/bin"
cat >"$work/bin/psql" <<'EOF'
#!/usr/bin/env bash
{
  printf 'ARGS'; printf ' [%s]' "$@"; echo
  echo "PGCLIENTENCODING=${PGCLIENTENCODING:-unset}"
} >>"$PSQL_LOG"
cat >>"$PSQL_STDIN"
EOF
chmod +x "$work/bin/psql"
export PATH="$work/bin:$PATH"
export PSQL_LOG="$work/psql.log"
export PSQL_STDIN="$work/psql.stdin"

db_url="postgresql://postgres.ref:db-secret@pooler.example:6543/postgres"

repo="$work/repo"
git init -q -b main "$repo"
git -C "$repo" -c user.email=t@example.com -c user.name=t commit -q --allow-empty -m base
git -C "$repo" worktree add -q "$work/wt" -b wt

# run <dir> [args...]: run the script from <dir> with nothing on stdin.
run() {
  : >"$PSQL_LOG"
  : >"$PSQL_STDIN"
  (cd "$1" && shift && bash "$SCRIPT" "$@") >"$work/out" 2>&1 </dev/null
}

# run_sql <sql> [args...]: run from the worktree with <sql> on stdin.
run_sql() {
  local sql=$1
  shift
  : >"$PSQL_LOG"
  : >"$PSQL_STDIN"
  (cd "$work/wt" && printf '%s\n' "$sql" | bash "$SCRIPT" "$@") >"$work/out" 2>&1
}

run "$work/wt" --whoami
status=$?
if [ "$status" -ne 0 ] && grep -q 'apps/backend/.env.production is missing' "$work/out" && [ ! -s "$PSQL_LOG" ]; then
  pass "a missing env file fails with its path and never runs psql"
else
  fail "a missing env file should fail before psql (status $status): $(cat "$work/out")"
fi

mkdir -p "$repo/apps/backend"
cat >"$repo/apps/backend/.env.production" <<EOF
STRIPE_SECRET_KEY=sk_live_other-secret
DATABASE_URL="$db_url"
EOF

echo "SELECT slug FROM organizations LIMIT 1;" >"$work/wt/q.sql"
run "$work/wt" -At -f q.sql
status=$?
if [ "$status" -eq 0 ] && grep -qF "ARGS [$db_url] [-X] [-q] [-v] [ON_ERROR_STOP=1] [-At]" "$PSQL_LOG"; then
  pass "from a worktree, psql gets the root clone's DATABASE_URL and the output flags"
else
  fail "psql should get the unquoted URL and -At (status $status): $(cat "$work/out" "$PSQL_LOG")"
fi
if head -n 1 "$PSQL_STDIN" | grep -qx 'BEGIN READ ONLY;' &&
  grep -qF 'SELECT slug FROM organizations LIMIT 1;' "$PSQL_STDIN" &&
  [ "$(tail -n 1 "$PSQL_STDIN")" = 'ROLLBACK;' ]; then
  pass "the SQL runs between BEGIN READ ONLY and ROLLBACK"
else
  fail "stdin should wrap the SQL in BEGIN READ ONLY ... ROLLBACK: $(cat "$PSQL_STDIN")"
fi
if grep -q 'PGCLIENTENCODING=UTF8' "$PSQL_LOG"; then
  pass "psql reads the SQL as UTF-8, the encoding the check assumes"
else
  fail "PGCLIENTENCODING should be UTF8: $(grep PGCLIENTENCODING "$PSQL_LOG")"
fi
if ! grep -q 'secret' "$work/out" && ! grep -q 'other-secret' "$PSQL_LOG"; then
  pass "the script prints no credential and passes no other secret"
else
  fail "a secret leaked: $(cat "$work/out" "$PSQL_LOG")"
fi

run "$work/wt" --whoami
status=$?
if [ "$status" -eq 0 ] && grep -q "current_setting('transaction_read_only')" "$PSQL_STDIN"; then
  pass "--whoami runs the identity query in the read-only transaction"
else
  fail "--whoami should run the identity query (status $status): $(cat "$work/out")"
fi

run "$work/wt" --describe org_events
status=$?
if [ "$status" -eq 0 ] && grep -qF "to_regclass('org_events')" "$PSQL_STDIN"; then
  pass "--describe queries the named table"
else
  fail "--describe should query org_events (status $status): $(cat "$work/out")"
fi

run "$work/wt" --describe "x'; DROP TABLE users; --"
status=$?
if [ "$status" -eq 2 ] && [ ! -s "$PSQL_LOG" ]; then
  pass "--describe refuses a name that is not a table name"
else
  fail "--describe should refuse a bad name (status $status): $(cat "$work/out")"
fi

# Each of these must be refused before psql starts. The cases cover psql
# commands that run a shell or write a file, including ones after other text on
# a line, and SQL that leaves the read-only transaction.
# shellcheck disable=SC2016 # the backticks and $ are SQL, not shell
refused=(
  '\! id'
  'SELECT 1 \! id'
  'SELECT 1 \g |sh'
  'SELECT 1 \gx |sh'
  'SELECT 1 \g out.txt'
  '\o |sh'
  '\o out.txt'
  'SELECT 1 \w out.sql'
  '\set x `id`'
  '\echo `id`'
  '\pset title `id`'
  '\setenv PAGER sh'
  '\echo hi \! id'
  '\echo hi \\ \! id'
  '\i other.sql'
  '\ir other.sql'
  '\copy users to out.csv'
  '\c postgres'
  '\connect postgres'
  '\cd /'
  '\e'
  '\set ON_ERROR_STOP off'
  "SELECT 'select 1' \\gexec"
  "SELECT '\\! id' AS x \\gset"
  "SELECT :e'\\' \\! id --';"
  'COMMIT;'
  $'SELECT 1;\ncommit;'
  'SELECT 1; ROLLBACK; DELETE FROM users;'
  'END;'
  'ABORT;'
  'BEGIN;'
  'START TRANSACTION;'
  'SAVEPOINT a;'
  'RELEASE a;'
  "PREPARE TRANSACTION 'x';"
  'SET TRANSACTION READ WRITE;'
  'SET SESSION CHARACTERISTICS AS TRANSACTION READ WRITE;'
  'SET default_transaction_read_only = off;'
  'RESET ALL;'
  'DISCARD ALL;'
  'SELECT 1 \g COMMIT;'
  "SELECT set_config('transaction_read_only', 'off', true);"
  "SELECT pg_catalog.\"set_config\"('a', 'b', false);"
  "SELECT U&\"set_\\0063onfig\"('a', 'b', false);"
  "SELECT query_to_xml('select 1', true, false, '');"
  'SELECT pg_terminate_backend(123);'
  'DO $$ BEGIN PERFORM 1; END $$;'
  "COPY (SELECT 1) TO PROGRAM 'id';"
  'SET standard_conforming_strings = off;'
  "SET client_encoding = 'SJIS';"
)
for sql in "${refused[@]}"; do
  run_sql "$sql"
  status=$?
  if [ "$status" -eq 2 ] && grep -q 'ro-psql: refused' "$work/out" && [ ! -s "$PSQL_LOG" ]; then
    pass "refused before psql: $sql"
  else
    fail "should be refused before psql (status $status): $sql: $(cat "$work/out")"
  fi
done

printf '%s\n' 'SELECT 1 \! id' >"$work/wt/bad.sql"
run "$work/wt" -f bad.sql
status=$?
if [ "$status" -eq 2 ] && [ ! -s "$PSQL_LOG" ]; then
  pass "-f SQL is checked too"
else
  fail "-f SQL should be checked (status $status): $(cat "$work/out")"
fi

# These read like a refusal on a careless match, but every risky word sits in a
# literal, a comment or a quoted identifier.
# shellcheck disable=SC2016
allowed=(
  "SELECT 'update; \\g |sh; \\! rm; commit; read write' AS note, \"commit\" FROM users WHERE bio = 'rollback';"
  $'-- \\! id; commit;\n/* nested /* \\g |sh */ still a comment; rollback; */\nSELECT 1;'
  'SELECT $tag$ \! id; commit; $tag$, $$ \o |sh $$;'
  "SELECT E'it\\'s \\\\! fine; commit';"
  $'\\x\n\\pset format aligned\n\\echo starting\nSELECT 1 \\g\nSELECT 2 \\gx\n\\d org_events\n\\dt+'
  'SELECT CASE WHEN is_active THEN 1 ELSE 0 END AS active FROM org_events;'
  "SELECT current_setting('transaction_read_only') AS read_only;"
  "SELECT name FROM users WHERE username ~ '^\\d+$';"
)
for sql in "${allowed[@]}"; do
  run_sql "$sql"
  status=$?
  if [ "$status" -eq 0 ] && [ -s "$PSQL_LOG" ]; then
    pass "allowed: $(printf '%s' "$sql" | head -n 1)"
  else
    fail "should be allowed (status $status): $sql: $(cat "$work/out")"
  fi
done

for flag in -c -v -o -L -1 -d -h -p -U; do
  run "$work/wt" "$flag" x
  status=$?
  if [ "$status" -eq 2 ] && grep -qF -- "$flag is not supported" "$work/out" && [ ! -s "$PSQL_LOG" ]; then
    pass "$flag is refused"
  else
    fail "$flag should be refused (status $status): $(cat "$work/out")"
  fi
done

run_sql 'SELECT 1;' --csv -x -P footer=off
status=$?
if [ "$status" -eq 0 ] && grep -qF '[--csv] [-x] [-P] [footer=off]' "$PSQL_LOG"; then
  pass "output flags pass through"
else
  fail "output flags should pass through (status $status): $(cat "$work/out" "$PSQL_LOG")"
fi

if [ "$failures" -gt 0 ]; then
  echo "$failures failure(s)"
  exit 1
fi
echo "all passed"
