#!/usr/bin/env bash
# Stop the servers, apply the migrations of the code now checked out, and
# start them again. Vite and the backend's HMR do not reliably pick up a
# `git checkout`, `git switch` or `git stash` that swaps app code under a
# running server, and a database migrated by the other code keeps that code's
# schema. db.sh keeps the databases and their data, so this is safe to
# repeat. Prints start.sh's ready line.
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"
require_private_copy

here=$(dirname "$0")
"$here/stop.sh" >/dev/null
"$here/db.sh" >/dev/null
"$here/redis.sh" >/dev/null
exec "$here/start.sh"
