#!/usr/bin/env bash
# Launch the backend and the frontend on this worktree's ports in the
# background, each in its own process group, then wait for ready.sh.
# --strictPort makes a taken frontend port exit instead of moving to a port
# SITE_URL does not name.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

web=$(env_port)
[ -n "$web" ] && [ "$web" -ge "$first_port" ] || die "no worker port in SITE_URL: run pick-port.sh first"
api=$(api_port_for "$web")
rg -qxF "PORT=$api" "$env_file" || die "PORT is not $api: run pick-port.sh first"
rg -qxF "DATABASE_URL=$db_url" "$env_file" || die "DATABASE_URL is not $db: run db.sh first"
rg -qxF "REDIS_PORT=$(redis_port_for "$web")" "$env_file" || die "REDIS_PORT is not this slot's: run redis.sh first"

api_log="$out_dir/run-dev-server-api-$slug.log"
web_log="$out_dir/run-dev-server-web-$slug.log"

# Shell variables beat the env files in both apps, so unset every one the
# private copies set.
launch() {
  local port=$1 log=$2
  shift 2
  local pid
  pid=$(listener_pid "$port")
  if [ -n "$pid" ]; then
    owned_here "$pid" || die "port $port is held by another process: run pick-port.sh"
    echo "already running on port $port" >&2
    echo ""
    return
  fi
  # Job control gives the server its own process group, so stop.sh can end
  # the pnpm wrapper and its children together.
  set -m
  nohup env -u DATABASE_URL -u PORT -u HOST -u SITE_URL -u API_URL -u REDIS_HOST -u REDIS_PORT \
    -u NODE_ENV -u VITE_API_URL "$@" >"$log" 2>&1 </dev/null &
  echo $!
  set +m
}

api_launcher=$(launch "$api" "$api_log" pnpm --dir apps/backend dev)
web_launcher=$(launch "$web" "$web_log" pnpm --dir apps/frontend dev --port "$web" --strictPort)
echo "launched api on port $api, log=$api_log"
echo "launched web on port $web, log=$web_log"
# When one server fails, end both groups, so a frontend still compiling does
# not keep its port after stop.sh found nothing to stop.
if ! "$(dirname "$0")/ready.sh" "$api_launcher" "$web_launcher"; then
  for launcher in $api_launcher $web_launcher; do
    stop_group "$launcher" || true
  done
  exit 1
fi
