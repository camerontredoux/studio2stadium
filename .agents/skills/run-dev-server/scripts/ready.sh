#!/usr/bin/env bash
# Wait until this worktree's backend and frontend answer, then print the URLs
# and process groups. Usage: ready.sh [api-launcher-pid web-launcher-pid];
# with them, a server that exits fails fast instead of waiting out the timeout.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

api_launcher=${1:-}
web_launcher=${2:-}
web=$(env_port)
[ -n "$web" ] || die "no port in SITE_URL: run pick-port.sh first"
api=$(api_port_for "$web")
api_log="$out_dir/run-dev-server-api-$slug.log"
web_log="$out_dir/run-dev-server-web-$slug.log"

exited() {
  [ -n "$1" ] && ! kill -0 "$1" 2>/dev/null
}

# Usage: wait_for <url> <launcher> <log> <name>. The first boot compiles,
# so allow 120 seconds.
wait_for() {
  local code
  for _ in $(seq 1 60); do
    code=$(curl -s -m 5 -o /dev/null -w '%{http_code}' "$1" || true)
    [ "$code" = 200 ] && return 0
    # `ace serve --hmr` keeps watching after the server inside it crashes,
    # so the launcher stays alive; read the log instead.
    if rg -q '^\s+\w*(Error|Exception):\s*$' "$3"; then
      missing=$(rg -o 'Missing environment variable "(\w+)"' -r '$1' "$3" | tr '\n' ' ' || true)
      [ -z "$missing" ] || die "the $4 needs values for: $missing(see env-copy.sh's message about missing values)"
      die "the $4 crashed during startup: read $3"
    fi
    if exited "$2"; then
      if rg -q 'already in use|EADDRINUSE' "$3"; then
        die "the $4 port was taken after pick-port.sh chose it: run stop.sh, pick-port.sh, redis.sh, then start.sh"
      fi
      die "the $4 exited during startup: read $3"
    fi
    sleep 2
  done
  die "no answer from $1 after 120 seconds: read $3"
}

# Without the X-Health-Secret header, /health answers 200 once the server is up.
wait_for "http://localhost:$api/health" "$api_launcher" "$api_log" backend
wait_for "http://localhost:$web/" "$web_launcher" "$web_log" frontend

# A database or Redis failure shows here, not in /health.
code=$(curl -s -m 30 -o /dev/null -w '%{http_code}' "http://localhost:$api/auth/session" || true)
[ "$code" = 200 ] || [ "$code" = 401 ] || die "/auth/session answered $code, not 200 or 401: read $api_log"

pgid() {
  ps -o pgid= -p "$(listener_pid "$1")" | tr -d ' '
}
echo "ready http://localhost:$web pgid=$(pgid "$web") api=http://localhost:$api api-pgid=$(pgid "$api") db=$db"
