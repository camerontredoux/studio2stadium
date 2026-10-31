#!/usr/bin/env bash
# Run this worktree's own Redis container on its slot's port and point
# REDIS_HOST and REDIS_PORT at it. config/redis.ts has no database index or
# key prefix setting, so one shared Redis would mix sessions, auth version
# keys and cached data across servers. The container keeps nothing on disk;
# a recreate signs everyone out.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

web=$(env_port)
[ -n "$web" ] || die "no port in SITE_URL: run pick-port.sh first"
port=$(redis_port_for "$web")

if [ -n "$(docker ps -aq --filter "name=^$redis_name\$")" ]; then
  if redis_owns "$port" && [ "$(docker inspect -f '{{.State.Running}}' "$redis_name")" = true ]; then
    state=kept
  else
    # Stopped, or published on an earlier slot's port.
    docker rm -f "$redis_name" >/dev/null || die "could not remove the old $redis_name container"
  fi
fi

if [ "${state:-}" != kept ]; then
  docker run -d --name "$redis_name" --label run-dev-server=studio2stadium \
    -p "127.0.0.1:$port:6379" redis:8-alpine redis-server --save '' --appendonly no >/dev/null \
    || die "could not start $redis_name on port $port"
  state=new
fi

for _ in $(seq 1 20); do
  [ "$(docker exec "$redis_name" redis-cli ping 2>/dev/null)" = PONG ] && break
  sleep 0.5
done
[ "$(docker exec "$redis_name" redis-cli ping 2>/dev/null)" = PONG ] || die "$redis_name does not answer PING"

set_env_var REDIS_HOST localhost
set_env_var REDIS_PORT "$port"
echo "redis-ok $redis_name port=$port ($state)"
