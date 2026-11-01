#!/usr/bin/env bash
# Stop the servers, apply the migrations of the code now checked out, and
# start them again. Vite and the backend's HMR do not reliably pick up a
# `git checkout`, `git switch` or `git stash` that swaps app code under a
# running server, and a database migrated by the other code keeps that code's
# schema. db.sh keeps the databases and their data, so this is safe to
# repeat. Prints start.sh's ready line.
# Usage: restart.sh [--warm /path,/path], passed to start.sh.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy
parse_start_args "$@"

here=$(dirname "$0")
"$here/stop.sh" >/dev/null
"$here/db.sh" >/dev/null
"$here/redis.sh" >/dev/null
exec "$here/start.sh" "$@"
