#!/usr/bin/env bash
# Stop this worktree's backend and frontend: each whole process group, since
# killing only the pnpm PID leaves the child holding the port. Refuses a
# process that does not run from this worktree. Leaves the Redis container
# running; drop-db.sh removes it.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

web=$(env_port)
[ -n "$web" ] || die "no port in SITE_URL; nothing to stop"

stop_port() {
  local port=$1 pid pgid
  pid=$(listener_pid "$port")
  if [ -z "$pid" ]; then
    echo "nothing on $port"
    return
  fi
  owned_here "$pid" || die "port $port is held by a process outside this worktree; not stopping it"
  pgid=$(ps -o pgid= -p "$pid" | tr -d ' ')
  stop_group "$pgid" || die "group $pgid still runs after SIGKILL"
  port_taken "$port" && die "port $port still has a listener after group $pgid exited"
  echo "port $port"
}

web_state=$(stop_port "$web")
api_state=$(stop_port "$(api_port_for "$web")")
echo "stopped $web_state, $api_state"
