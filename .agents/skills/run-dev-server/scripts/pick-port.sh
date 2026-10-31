#!/usr/bin/env bash
# Choose this worktree's port slot: the frontend on 5180-5199, the backend on
# the matching 3340-3359, and Redis on 6390-6409. Points SITE_URL, PORT and
# API_URL in apps/backend/.env, and VITE_API_URL in apps/frontend/.env.local,
# at them. The Vite proxy is fixed to Cameron's backend on 3333, so the
# frontend calls this backend directly through VITE_API_URL instead.
#
# Worktrees starting at once would all see the same free slot, so the choice
# is made under the machine-wide lock the global dev-loop skill's pick-port.sh
# uses, and leaves a reservation on the frontend port that the others (in
# every repo) skip for two minutes, until its servers have had time to bind.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

ports_state=${XDG_STATE_HOME:-$HOME/.local/state}/run-dev-server/ports
mkdir -p "$ports_state"
exec 9>"$ports_state/.lock"
flock -w 30 9 || die "another worktree has held the port lock for 30s"
hold_secs=120

# True when another worktree reserved the port in the last two minutes.
reserved_by_other() {
  local f="$ports_state/$1" owner at
  [ -f "$f" ] || return 1
  read -r owner at <"$f" || return 1
  [ "$owner" != "$root" ] && [ $(($(date +%s) - ${at:-0})) -lt $hold_secs ]
}
reserve() { printf '%s %s\n' "$root" "$(date +%s)" >"$ports_state/$1"; }

# True when every port in the slot is free or already this worktree's.
slot_ours_or_free() {
  local web=$1 api redis pid port
  reserved_by_other "$web" && return 1
  api=$(api_port_for "$web")
  redis=$(redis_port_for "$web")
  for port in "$web" "$api"; do
    pid=$(listener_pid "$port")
    if [ -n "$pid" ]; then owned_here "$pid" || return 1; elif port_taken "$port"; then return 1; fi
  done
  port_taken "$redis" && ! redis_owns "$redis" && return 1
  return 0
}

set_ports() {
  local web=$1 api
  api=$(api_port_for "$web")
  set_env_var SITE_URL "http://localhost:$web"
  set_env_var PORT "$api"
  set_env_var API_URL "http://localhost:$api"
  set_env_var VITE_API_URL "http://localhost:$api" "$web_env_file"
  [ "$(env_port)" = "$web" ] || die "could not set SITE_URL in $env_file"
  reserve "$web"
}

current=$(env_port)
if [ -n "$current" ] && [ "$current" -ge "$first_port" ] && [ "$current" -le "$last_port" ] \
  && slot_ours_or_free "$current"; then
  set_ports "$current"
  echo "port=$current api=$(api_port_for "$current") redis=$(redis_port_for "$current") (kept)"
  exit 0
fi

for port in $(seq "$first_port" "$last_port"); do
  # A slot this worktree already holds, such as its Redis container from an
  # earlier slot choice, counts as free.
  if slot_ours_or_free "$port"; then
    set_ports "$port"
    echo "port=$port api=$(api_port_for "$port") redis=$(redis_port_for "$port")"
    exit 0
  fi
done
die "no free slot: ports $first_port to $last_port, or their backend and Redis ports, are all taken"
