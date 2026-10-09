# shellcheck shell=bash disable=SC2034
# Adapter for the global dev-loop scripts (~/.agents/skills/dev-loop): what
# before-after.sh and before-server.sh need to know about this repo. Sourced,
# never run. Commands are scripts in DEV_LOOP_SCRIPTS with their arguments,
# run from the worktree root.

DEV_LOOP_NAME=s2s
DEV_LOOP_SCRIPTS=.agents/skills/run-dev-server/scripts

# The private env file pick-port.sh writes, and the variables in it that hold
# the frontend's http://localhost:<port> and the database URL. This repo keeps
# its own pick-port.sh: it picks a slot of three ports (frontend, backend,
# Redis), which the global one does not.
DEV_LOOP_ENV_FILE=apps/backend/.env
DEV_LOOP_URL_VAR=SITE_URL
DEV_LOOP_DB_URL_VAR=DATABASE_URL
DEV_LOOP_HEALTH_PATH=/
DEV_LOOP_LOGIN_PATH=/login

# Server commands. sign-in.sh prints `sign-in-link <url>` and takes dancer,
# admin or an email; its link lands on SITE_URL, so before-after.sh opens the
# page after it.
DEV_LOOP_UP=up.sh
DEV_LOOP_RESTART=restart.sh
DEV_LOOP_STOP=stop.sh
DEV_LOOP_SIGN_IN=sign-in.sh
DEV_LOOP_ACCOUNT=dancer

# The shared before server: ~/work/studio2stadium-worktrees/main-before, state
# in ~/.local/state/s2s-before-server, frontend on 5198 (backend 3358, Redis
# 6408), databases s2s_before_server_main and its _test. There is no seed:
# sign-in.sh creates the dancer and admin users on both servers.
DEV_LOOP_SHARED_PORT=5198
DEV_LOOP_SETUP=(check-deps.sh env-copy.sh)
DEV_LOOP_LOCKFILE=pnpm-lock.yaml
DEV_LOOP_INSTALL="pnpm install --frozen-lockfile"
DEV_LOOP_DB=(db.sh)
DEV_LOOP_START=(pick-port.sh redis.sh start.sh)
# A base that differs from the server's commit only here still renders the same.
DEV_LOOP_IGNORE=(docs .agents .claude .github scripts apps/backend/tests apps/backend/scratch
  '**/*.md' '**/*.spec.ts' '**/*.spec.tsx' '**/*.test.ts' '**/*.test.tsx' '**/*.stories.tsx')
