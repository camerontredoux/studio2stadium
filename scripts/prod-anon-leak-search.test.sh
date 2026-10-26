#!/usr/bin/env bash
#
# Behavioural tests for scripts/prod-anon-leak-search.sh, the leak check's
# search step. It must pass when rg finds matches or none, and stop the build
# on any other rg failure, so the template is never published unchecked. Each
# case runs the real script with a stub `rg` on PATH, or with no rg at all.
# No database is contacted.
#
#   bash scripts/prod-anon-leak-search.test.sh
#
set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
SCRIPT="$ROOT/scripts/prod-anon-leak-search.sh"
BASH_BIN=$(command -v bash)

failures=0
fail() {
  echo "FAIL: $1"
  failures=$((failures + 1))
}

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/bin" "$work/empty"
printf 'needle\n' >"$work/needles"
printf 'data\n' >"$work/data.sql"

# A stub rg that prints $RG_OUT and exits with $RG_EXIT.
# Its shebang names bash by path: the stub's PATH holds nothing else.
{
  echo "#!$BASH_BIN"
  cat <<'STUB'
[ -n "${RG_OUT:-}" ] && printf '%s\n' "$RG_OUT"
[ -n "${RG_ERR:-}" ] && printf '%s\n' "$RG_ERR" >&2
exit "${RG_EXIT:-0}"
STUB
} >"$work/bin/rg"
chmod +x "$work/bin/rg"

# run <PATH> [VAR=value...]: run the script, setting status, out and err.
run() {
  local path=$1
  shift
  rm -f "$work/hits"
  env -i PATH="$path" "$@" "$BASH_BIN" "$SCRIPT" "$work/needles" "$work/data.sql" "$work/hits" \
    >"$work/out" 2>"$work/err"
  status=$?
}

run "$work/bin" RG_EXIT=0 RG_OUT="1:0:needle"
[ "$status" -eq 0 ] || fail "matches found: expected exit 0, got $status"
[ "$(cat "$work/hits")" = "1:0:needle" ] || fail "matches found: hits not written"

run "$work/bin" RG_EXIT=1
[ "$status" -eq 0 ] || fail "no matches: expected exit 0, got $status"
[ ! -s "$work/hits" ] || fail "no matches: hits should be empty"

run "$work/bin" RG_EXIT=2 RG_ERR="rg: data.sql: Permission denied"
[ "$status" -ne 0 ] || fail "rg error: expected a non-zero exit"
grep -q 'Permission denied' "$work/err" || fail "rg error: rg's own message is hidden"
grep -q 'not publishing' "$work/err" || fail "rg error: no 'not publishing' message"

run "$work/empty"
[ "$status" -ne 0 ] || fail "rg missing from PATH: expected a non-zero exit"
grep -q 'not publishing' "$work/err" || fail "rg missing: no 'not publishing' message"

if [ "$failures" -gt 0 ]; then
  echo "$failures failure(s)"
  exit 1
fi
echo "prod-anon-leak-search: all cases passed"
