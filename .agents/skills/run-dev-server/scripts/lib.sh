#!/usr/bin/env bash
# Shared setup for the run-dev-server scripts. Each script sources this file.
# It moves to the worktree root and derives every per-worktree name from the
# branch, so the scripts carry no state between runs.
# shellcheck disable=SC2034 # the variables below are read by the sourcing script
set -euo pipefail

die() {
  printf 'run-dev-server: %s\n' "$*" >&2
  exit 1
}

root=$(git rev-parse --show-toplevel 2>/dev/null) || die "run this from inside a studio2stadium worktree"
cd "$root"
[ -f apps/backend/package.json ] && [ -f apps/frontend/package.json ] && [ -f docker-compose.yml ] \
  || die "$root is not a studio2stadium checkout"

branch=$(git branch --show-current)
[ -n "$branch" ] || die "detached HEAD: create your branch first; your database name comes from it"
# Postgres caps identifiers at 63 bytes; "s2s_" and "_test" take 9.
slug=$(printf %s "$branch" | tr '[:upper:]' '[:lower:]' | tr -c 'a-z0-9' '_' | cut -c1-54)
db="s2s_$slug"
test_db="${db}_test"
pg_base=postgresql://postgres:postgres@localhost:5432
db_url="$pg_base/$db"
test_db_url="$pg_base/$test_db"
pg_admin="$pg_base/postgres"
redis_name="studio2stadium-redis-$(printf %s "$slug" | tr '_' '-')"
env_file=apps/backend/.env
web_env_file=apps/frontend/.env.local
marker="# run-dev-server private copy: $slug"
out_dir=${TMPDIR:-${XDG_CACHE_HOME:-$HOME/.cache}}
# Cameron runs 5173, 3333 and 6379. A worker takes one slot: the frontend on
# 5180 + n, the backend on 3340 + n, and its Redis on 6390 + n.
first_port=5180
last_port=5199
api_offset=-1840
redis_offset=1210

require_private_copy() {
  local f
  for f in "$env_file" "$web_env_file"; do
    if [ ! -f "$f" ] || [ -L "$f" ] || ! rg -qxF "$marker" "$f"; then
      die "$f is not this branch's private copy: run env-copy.sh first"
    fi
  done
}

# The frontend port this worktree launches on, read back from SITE_URL.
env_port() {
  rg -o '^SITE_URL=http://localhost:(\d+)$' -r '$1' "$env_file" || true
}

api_port_for() { echo $(($1 + api_offset)); }
redis_port_for() { echo $(($1 + redis_offset)); }

listener_pid() {
  ss -Hltnp "sport = :$1" | rg -o 'pid=(\d+)' -r '$1' | head -n 1 || true
}

port_taken() {
  [ -n "$(ss -Hltn "sport = :$1")" ]
}

# True when the process runs from inside this worktree, so it is ours to stop.
owned_here() {
  local cwd
  cwd=$(readlink "/proc/$1/cwd" 2>/dev/null) || return 1
  case "$cwd/" in "$root"/*) return 0 ;; *) return 1 ;; esac
}

# True when this worktree's own Redis container publishes the port.
redis_owns() {
  [ "$(docker port "$redis_name" 6379/tcp 2>/dev/null | head -n 1)" = "127.0.0.1:$1" ]
}

# Set NAME=VALUE in a private copy (default: the backend's), inserting it
# above the marker line, which must stay last.
set_env_var() {
  local file=${3:-$env_file}
  if rg -q "^$1=" "$file"; then
    sd "^$1=.*\$" "$1=$2" "$file"
  else
    sd --fixed-strings "$marker" "$1=$2
$marker" "$file"
  fi
}
