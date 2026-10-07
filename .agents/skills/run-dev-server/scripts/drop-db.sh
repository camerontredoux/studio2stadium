#!/usr/bin/env bash
# Drop this worktree's own databases and remove its Redis container when the
# task wraps up, and nothing else. The names come from the branch exactly as
# db.sh and redis.sh derive them; shared databases are refused by name. Stops
# this worktree's servers first, and reports success when everything is
# already gone.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

[ -n "$slug" ] && [ "$db" = "s2s_$slug" ] && [ "$test_db" = "s2s_${slug}_test" ] \
  || die "could not derive this worktree's database names"
for name in "$db" "$test_db"; do
  case "$name" in
    s2s_dev | s2s_test | postgres | template0 | template1)
      die "refusing to drop $name: it is shared, not this worktree's"
      ;;
  esac
done

if [ -f "$env_file" ] && [ ! -L "$env_file" ] && rg -qxF "$marker" "$env_file" \
  && [ -f "$web_env_file" ] && [ ! -L "$web_env_file" ] && rg -qxF "$marker" "$web_env_file"; then
  "$(dirname "$0")/stop.sh"
fi

drop() {
  local name=$1 others
  if [ "$(psql "$pg_admin" -Atc "select 1 from pg_database where datname = '$name'")" != 1 ]; then
    echo "$name (already gone)"
    return
  fi
  # A stopped server can take a moment to close its pooled connections.
  for _ in $(seq 1 10); do
    others=$(psql "$pg_admin" -Atc "select count(*) from pg_stat_activity where datname = '$name'")
    [ "$others" = 0 ] && break
    sleep 1
  done
  [ "$others" = 0 ] || die "$others other connection(s) still use $name; close them, then retry"
  psql "$pg_admin" -qc "drop database $name" || die "could not drop $name"
  echo "$name"
}

db_state=$(drop "$db")
test_state=$(drop "$test_db")
if [ -n "$(docker ps -aq --filter "name=^$redis_name\$")" ]; then
  docker rm -f "$redis_name" >/dev/null || die "could not remove $redis_name"
  redis_state=$redis_name
else
  redis_state="$redis_name (already gone)"
fi
echo "dropped $db_state, $test_state, $redis_state"
