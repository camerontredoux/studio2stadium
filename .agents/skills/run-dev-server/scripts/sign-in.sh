#!/usr/bin/env bash
# Sign in to this worktree's server with a one-click link. There is no seed,
# so the default users are created here on first use:
# dancer@run-dev-server.test (a Dancer) and admin@run-dev-server.test (a
# Dancer account with the admin role). Any other email must already exist in
# this branch's database, for example from signing up in the browser.
# Each run mints one-time codes for the user in this worktree's own Redis
# (only the code's SHA-256, for 5 minutes). The backend's dev-only
# GET /auth/dev-sign-in consumes a code, starts a session as POST /auth/login
# does, and redirects to the frontend. One code signs curl in and saves the
# session cookies to a file for curl and scripts; the printed link carries
# another for a browser. Passwords are left alone.
# Usage: sign-in.sh [dancer|admin|email]
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

case "${1:-dancer}" in
  dancer) email=dancer@run-dev-server.test role=user ;;
  admin) email=admin@run-dev-server.test role=admin ;;
  *) email=$1 role="" ;;
esac
case "$email" in *"'"* | *'"'* | *\\*) die "email must not contain quotes or backslashes" ;; esac

web=$(env_port)
[ -n "$web" ] || die "no port in SITE_URL: run pick-port.sh first"
api=$(api_port_for "$web")
[ -n "$(listener_pid "$api")" ] || die "nothing is listening on port $api: run start.sh first"
redis_owns "$(redis_port_for "$web")" || die "$redis_name does not publish this slot's Redis port: run redis.sh, then restart.sh"

if [ -n "$role" ]; then
  # The rows the signup service writes for a Dancer: the user and its core
  # platform. Marked verified so _app pages open instead of /onboarding; the
  # update covers default users created unverified before that.
  psql "$db_url" -Atq -v ON_ERROR_STOP=1 -c "
    with new_user as (
      insert into users (username, email, display_email, first_name, last_name, password, role, type, verified)
      values (split_part('$email', '@', 1) || '-run-dev-server', '$email', '$email',
              initcap(split_part('$email', '@', 1)), 'Worker', 'unset', '$role', 'dancer', true)
      on conflict (email) do nothing
      returning id
    )
    insert into user_platforms (platform_name, user_id) select 'core', id from new_user;
    update users set verified = true where email = '$email' and not verified" \
    || die "could not create $email in $db"
fi

user_id=$(psql "$db_url" -Atc "select id from users where email = '$email'")
[ -n "$user_id" ] || die "$email is not a user in $db; list users with: psql \"$db_url\" -c 'select email, type, role from users'"
account=$(psql "$db_url" -Atc "select type || ' ' || role from users where id = '$user_id'")

# A code is 32 random bytes. Redis keeps only its SHA-256, as the key
# apps/backend/app/modules/auth/dev-sign-in/service.ts reads with GETDEL, so
# each code works once, for 5 minutes. The code itself is never stored or logged.
mint_code() {
  local code hash
  code=$(openssl rand -hex 32)
  hash=$(printf %s "$code" | sha256sum | cut -d' ' -f1)
  [ "$(docker exec "$redis_name" redis-cli SET "dev-sign-in:$hash" "$user_id" EX 300 NX)" = OK ] \
    || die "could not store a sign-in code in $redis_name"
  printf %s "$code"
}

link() { echo "http://localhost:$api/auth/dev-sign-in?code=$1"; }

jar="$out_dir/run-dev-server-cookies-$slug"
(umask 077 && : >"$jar")
curl_code=$(mint_code)
code=$(curl -s -m 30 -o /dev/null -w '%{http_code}' -c "$jar" "$(link "$curl_code")")
# A server started before env-copy.sh set DEV_SIGN_IN_LINK_ENABLED has no route.
[ "$code" != 404 ] || die "/auth/dev-sign-in answered 404: run env-copy.sh, then restart.sh so the backend reads DEV_SIGN_IN_LINK_ENABLED"
[ "$code" = 302 ] || die "/auth/dev-sign-in answered $code, not 302: read $out_dir/run-dev-server-api-$slug.log"
code=$(curl -s -m 30 -o /dev/null -w '%{http_code}' -b "$jar" "http://localhost:$api/auth/session")
[ "$code" = 200 ] || die "/auth/session answered $code with the new session, not 200"

browser_code=$(mint_code)
echo "signed-in $email ($account) cookies=$jar"
echo "sign-in-link $(link "$browser_code")"
