# shellcheck shell=bash disable=SC2034
# Adapter for the global dev-loop scripts (~/.agents/skills/dev-loop): what
# before-after.sh, before-server.sh and db-template.sh need to know about this
# repo. Sourced,
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

# Server commands. up.sh, restart.sh and start.sh take --warm /path,/path
# and compile those frontend routes once the servers are ready. stop.sh stops
# the frontend and the backend; the worktree's Redis container keeps running
# until drop-db.sh. sign-in.sh prints `sign-in-link <url>` and takes
# --redirect /path and dancer, admin or an email; the link lands on the path.
DEV_LOOP_UP=up.sh
DEV_LOOP_RESTART=restart.sh
DEV_LOOP_RESTART_WARM=--warm
DEV_LOOP_STOP=stop.sh
DEV_LOOP_SIGN_IN=sign-in.sh
DEV_LOOP_SIGN_IN_REDIRECT=1
DEV_LOOP_ACCOUNT=dancer

# Template databases (db-template.sh, called by db.sh). A template is keyed
# on the day and a hash of the migrations; there is no seed, so it holds only
# the schema.
DEV_LOOP_PG_ADMIN=postgresql://postgres:postgres@localhost:5432/postgres
DEV_LOOP_TEMPLATE_PREFIX=s2s_tpl_
DEV_LOOP_TEMPLATE_INPUTS=('apps/backend/app/database/drizzle/*/migration.sql')

# Migrate the empty database at $DATABASE_URL. KIND is always schema.
# Supabase ships citext; the migrations use it without creating it.
dev_loop_build_template() {
  psql "$DATABASE_URL" -q -v ON_ERROR_STOP=1 -c "set client_min_messages = warning" \
    -c "create extension if not exists citext"
  (cd apps/backend && pnpm db:migrate)
}

# The shared before server: <primary checkout>/.worktrees/before-server, state
# in ~/.local/state/s2s-before-server, frontend on 5198 (backend 3358, Redis
# 6408), databases s2s_before_server_main and its _test. db.sh copies
# s2s_prod_anon (scripts/prod-anon-template.sh) into the first when it exists.
# There is no seed: sign-in.sh creates the dancer and admin users on both
# servers.
DEV_LOOP_SHARED_PORT=5198
DEV_LOOP_SETUP=(check-deps.sh env-copy.sh)
DEV_LOOP_LOCKFILE=pnpm-lock.yaml
DEV_LOOP_INSTALL="pnpm install --frozen-lockfile"
DEV_LOOP_DB=(db.sh)
# Drops this worktree's databases and Redis container: at firstmate's
# teardown, and on the before server once a day, which then copies a fresh
# template. There is no seed to lose; sign-in.sh recreates its users.
DEV_LOOP_DROP_DB=drop-db.sh
DEV_LOOP_START=(pick-port.sh redis.sh start.sh)
# A base that differs from the server's commit only here still renders the same.
DEV_LOOP_IGNORE=(docs .agents .claude .github scripts apps/backend/tests apps/backend/scratch
  '**/*.md' '**/*.spec.ts' '**/*.spec.tsx' '**/*.test.ts' '**/*.test.tsx' '**/*.stories.tsx')
