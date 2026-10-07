#!/usr/bin/env bash
# Replace the symlinked apps/backend/.env and apps/frontend/.env.local with
# private 0600 copies.
#
# scripts/treehouse-post-create.sh links both files to the root clone's, so an
# edit through a link rewrites Cameron's file and every other worktree's.
# Pool slots are reused, so a regular file already here can be a stripped copy
# left by an earlier task; the marker line tells this branch's copy apart, and
# any other file is moved aside, never deleted. apps/backend/.env.production
# is never read.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

main=$(git worktree list --porcelain | awk 'NR == 1 { print substr($0, 10); exit }')

# Values that keep this server off what other servers share. SQS points
# nowhere, so the publish-outbox cron logs an error instead of sending this
# database's outbox rows to the shared dev queue. Scheduled emails stay off.
set_safe_vars() {
  set_env_var NODE_ENV development
  set_env_var HOST localhost
  set_env_var CRON_EMAILS_ENABLED false
  set_env_var SQS_QUEUE_URL http://127.0.0.1:9/run-dev-server-disabled
  set_env_var SQS_DEAD_LETTER_QUEUE_URL http://127.0.0.1:9/run-dev-server-disabled
}

private_copy() {
  local file=$1 source_file="$main/$1"
  if [ -f "$file" ] && [ ! -L "$file" ] && rg -qxF "$marker" "$file"; then
    echo "kept"
    return
  fi
  [ -f "$source_file" ] || die "the root clone has no $file to copy"
  if [ -f "$file" ] && [ ! -L "$file" ]; then
    stale="$file.stale.$(date +%s)"
    mv "$file" "$stale"
    echo "moved an earlier task's copy to $stale" >&2
  fi
  rm -f "$file"
  install -m 600 "$source_file" "$file"
  printf '\n%s\n' "$marker" >>"$file"
  git check-ignore -q "$file" || die "$file is not gitignored; stop before it is committed"
  echo "new"
}

backend_state=$(private_copy "$env_file")
web_state=$(private_copy "$web_env_file")
set_safe_vars

# The backend refuses to boot without every required variable in
# start/env.ts, so name the missing ones here rather than in a server log.
# A required variable is `Env.schema.<type>(`; optional ones read
# `Env.schema.<type>.optional(`.
missing=""
for name in $(rg -o '^\s+([A-Z][A-Z0-9_]+): Env\.schema\.[a-z]+\(' -r '$1' apps/backend/start/env.ts); do
  case "$name" in
    # Set later by db.sh, pick-port.sh and redis.sh.
    DATABASE_URL | PORT | SITE_URL | API_URL | REDIS_HOST | REDIS_PORT) continue ;;
  esac
  rg -q "^$name=." "$env_file" || missing="$missing $name"
done
[ -z "$missing" ] || die "$env_file has no value for:$missing. Ask Cameron for the values: Cameron adds them to $main/$env_file for every later worktree, and you may set them in this private copy to run now; never invent them"

echo "private-copy-ok $env_file ($backend_state) $web_env_file ($web_state)"
