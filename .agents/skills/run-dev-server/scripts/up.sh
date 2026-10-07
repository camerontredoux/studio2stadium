#!/usr/bin/env bash
# Every step from a fresh worktree to a ready server, in order. Each step is
# safe to repeat: it keeps what is already in place.
set -euo pipefail
here=$(dirname "$0")
"$here/check-deps.sh"
"$here/env-copy.sh"
"$here/db.sh"
"$here/pick-port.sh"
"$here/redis.sh"
"$here/start.sh"
