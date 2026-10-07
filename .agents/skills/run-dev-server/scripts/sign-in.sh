#!/usr/bin/env bash
# Sign in to this worktree's server with email and password, the only sign-in
# the app has. There is no seed, so the default users are created here on
# first use: dancer@run-dev-server.test (a Dancer) and admin@run-dev-server.test
# (a Dancer account with the admin role). Any other email must already exist
# in this branch's database, for example from signing up in the browser.
# Each run sets the user's password in this database only to a new random
# one, logs in through POST /auth/login, and saves the session cookies to a
# file for curl and scripts.
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

if [ -n "$role" ]; then
  # The rows the signup service writes for a Dancer: the user and its core
  # platform. Login does not require a verified email.
  psql "$db_url" -Atq -v ON_ERROR_STOP=1 -c "
    with new_user as (
      insert into users (username, email, display_email, first_name, last_name, password, role, type)
      values (split_part('$email', '@', 1) || '-run-dev-server', '$email', '$email',
              initcap(split_part('$email', '@', 1)), 'Worker', 'unset', '$role', 'dancer')
      on conflict (email) do nothing
      returning id
    )
    insert into user_platforms (platform_name, user_id) select 'core', id from new_user" \
    || die "could not create $email in $db"
fi

account=$(psql "$db_url" -Atc "select type || ' ' || role from users where email = '$email'")
[ -n "$account" ] || die "$email is not a user in $db; list users with: psql \"$db_url\" -c 'select email, type, role from users'"

password=$(openssl rand -hex 12)
hash=$(cd apps/backend && PASSWORD=$password node -e '
import("@adonisjs/core/hash/drivers/argon").then(async ({ Argon }) => {
  console.log(await new Argon({ parallelism: 1 }).make(process.env.PASSWORD));
});') || die "could not hash the password with the backend's argon2 driver"
psql "$db_url" -Atq -v ON_ERROR_STOP=1 -c "update users set password = '$hash' where email = '$email'" \
  || die "could not set the password for $email"

jar="$out_dir/run-dev-server-cookies-$slug"
(umask 077 && : >"$jar")
code=$(curl -s -m 30 -o /dev/null -w '%{http_code}' -c "$jar" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}" "http://localhost:$api/auth/login")
[ "$code" = 200 ] || [ "$code" = 204 ] || die "POST /auth/login answered $code, not 200 or 204: read $out_dir/run-dev-server-api-$slug.log"
code=$(curl -s -m 30 -o /dev/null -w '%{http_code}' -b "$jar" "http://localhost:$api/auth/session")
[ "$code" = 200 ] || die "/auth/session answered $code with the new session, not 200"

echo "signed-in $email ($account) cookies=$jar"
echo "sign-in http://localhost:$web/login email=$email password=$password"
