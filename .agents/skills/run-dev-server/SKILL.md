---
name: run-dev-server
description: Start, restart, stop, or sign in to the studio2stadium dev servers (backend and frontend) in a worktree, on their own ports, their own local databases, and their own Redis. Use in a studio2stadium checkout whenever a task needs the app running, such as checking a change in the browser, taking PR screenshots, or giving Cameron a sign-in to click around a worker's server.
---

# Run the dev server

Your worktree gets these things of its own:

- Private `0600` copies of `apps/backend/.env` and `apps/frontend/.env.local`.
- The databases `s2s_<slug>` for the server and `s2s_<slug>_test` for backend tests. The slug is the branch name, lowercased, with other characters as `_`.
- A Redis container, `studio2stadium-redis-<slug>` (with `-` in place of `_`). `config/redis.ts` has no database index or key prefix setting, so one shared Redis would mix sessions and cached data across servers. The container keeps nothing on disk; recreating it signs everyone out.
- One port slot: the frontend on 5180 to 5199, the backend on the matching 3340 to 3359, and Redis on 6390 to 6409. `pick-port.sh` chooses it under the machine-wide port lock the global dev-loop skill uses, so worktrees of every repo that start at once never take the same port.

The Postgres server on `localhost:5432` (it listens on `127.0.0.1` only; `docker-compose.yml` binds its `db` and `redis` there too), the `s2s_tpl_*` and `s2s_prod_anon` template databases, the `s2s_dev` and `s2s_test` databases, the root clone's env files, and Cameron's ports 5173, 3333 and 6379 are shared with Cameron and every other worker. The scripts never write to them.

The scripts live in `.agents/skills/run-dev-server/scripts/`. Run them from the worktree root. Each acts on the worktree it runs in (`git rev-parse --show-toplevel`), so a copy stored anywhere works. Each one ends on one success line, or exits non-zero with a `run-dev-server:` message that names the fix. Each is safe to repeat. Create your branch first; a detached HEAD has no slug.

## Start

```bash
.agents/skills/run-dev-server/scripts/up.sh [--warm /path,/path]
```

`--warm` goes to `start.sh`: once both servers answer, it compiles those frontend routes in the background (`warm.mjs`), so a browser opened a few seconds later does not wait for Vite. It never delays or fails the start, and its log path is printed above the `ready` line. Done when the last line reads `ready http://localhost:<port> pgid=<pgid> api=http://localhost:<api-port> api-pgid=<pgid> db=s2s_<slug>`. Record both URLs, both process groups, and the `log=` paths printed above it. `up.sh` runs, in order:

| Script          | Does                                                                                                     | Success line                       |
| --------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `check-deps.sh` | Node 24, `pnpm install` if missing, builds `@stos/emails` and `@stos/openapi`, Docker, shared Postgres up | `deps-ok`                          |
| `env-copy.sh`   | Swaps the symlinked env files for private `0600` copies and checks the backend's required variables       | `private-copy-ok ...`              |
| `db.sh`         | Copies `s2s_<slug>` from `s2s_prod_anon` (anonymized production data) when it exists, and `s2s_<slug>_test` from the schema template, or reuses them; migrates each unless it already holds every migration; sets `DATABASE_URL` | `db-ok s2s_<slug> (<state>, <migrate>) s2s_<slug>_test (...)` |
| `pick-port.sh`  | Keeps or chooses a free slot, and sets `PORT`, `SITE_URL`, `API_URL` and `VITE_API_URL` to match          | `port=<n> api=<n> redis=<n>`       |
| `redis.sh`      | Runs this worktree's Redis container on the slot's port and sets `REDIS_HOST` and `REDIS_PORT`            | `redis-ok <container> port=<n>`    |
| `start.sh`      | Launches both servers, each in its own process group, runs `ready.sh`, and starts any `--warm`            | `ready http://...`                 |

`db.sh` copies a new `s2s_<slug>` from `s2s_prod_anon` when it exists (see [Production data](#production-data)). It copies a new `s2s_<slug>_test`, and a new `s2s_<slug>` without `s2s_prod_anon`, from `s2s_tpl_schema_<day>_<hash>`, a migrated, empty template that the global dev-loop skill's `db-template.sh` builds once per day and migration head (`.agents/dev-loop.sh` configures it). The `<state>` is `copied <template>`, `reused` or `new`. It then compares `drizzle.__drizzle_migrations` with the migration folders on disk, row for row, and prints `skipped` when they match, else runs `pnpm db:migrate` and prints `migrated`. Without the dev-loop skill, or with `RUN_DEV_SERVER_NO_TEMPLATE=1`, it creates an empty database and migrates it.

On a failure, run the named script alone after the fix. When a step's message points at a log, read its tail.

`env-copy.sh` stops when the root clone's `apps/backend/.env` lacks a variable that `apps/backend/start/env.ts` requires, and names each one. Do not invent values. Ask Cameron. Cameron adds them to the root clone's file for later worktrees, and you may set the values Cameron gives you in your private copy (see [Edit your settings](#edit-your-settings)).

There is no copy of Cameron's dev data. The root clone's `DATABASE_URL` names `s2s_dev`, and the scripts never read from it or write to it.

## Production data

A new `s2s_<slug>` is a copy of `s2s_prod_anon` when it exists: production's records with every email address replaced and every credential cleared. `db.sh` then migrates it when your branch has migrations that production has not run. The shared before server copies the same template, so a record URL from your server opens the same record there. An existing database keeps its data: run `drop-db.sh`, then `db.sh`, to switch an older one. The test database never copies it, because the tests delete rows.

`scripts/prod-anon-template.sh` builds or refreshes it, from the root clone or any worktree, in about 30 seconds. It reads production read-only, restores it into a scratch database, anonymizes it with `scripts/prod-anon-template.sql`, and fails the build if any production email address survives. It deletes the dump and the scratch database on every exit. Done when the last line reads `prod-anon-template-ok s2s_prod_anon (<size>)`.

- A user's address becomes `user-<users.id>@example.test` everywhere it appears, including rosters, invites, JSON and free text. Any other address becomes `contact-<n>@example.test`. Names, phone numbers and everything else stay.
- Passwords are `unset`, invite tokens are random, outbox rows count as published, and unfinished video uploads count as failed, so no local cron sends or deletes anything for them. Images and videos still load from production storage; never delete media from a copy with real Cloudflare credentials.
- **It stays on this machine.** Never dump it, copy it elsewhere, or point CI at it. Postgres listens on `127.0.0.1:5432` only.
- **Sign in** as `dancer` or `admin` as usual (`sign-in.sh` creates them), or as any production user with `sign-in.sh user-<id>@example.test`.
- Pass `--no-prod-data` to `db.sh`, or set `RUN_DEV_SERVER_NO_PROD_DATA=1`, for an empty database instead.

## What each server talks to

The private `apps/backend/.env` keeps the root clone's values except these:

- `DATABASE_URL`, `PORT`, `HOST`, `SITE_URL`, `API_URL`, `REDIS_HOST` and `REDIS_PORT` point at this worktree's own database, ports and Redis.
- `NODE_ENV=development` and `CRON_EMAILS_ENABLED=false`.
- `DEV_SIGN_IN_LINK_ENABLED=true`, which registers the backend's dev-only `GET /auth/dev-sign-in` that `sign-in.sh` links to. The backend registers it only for the HTTP server with `NODE_ENV=development`, so production never has it.
- `SQS_QUEUE_URL` and `SQS_DEAD_LETTER_QUEUE_URL` point at a closed local port. The `publish-outbox` cron then logs `[Outbox]: Error publishing events` and leaves rows unpublished. It does not send this database's events to the shared dev queue.
- `DRIVE_DISK=fs` writes uploads (schedules, images, blog files) to `apps/backend/storage`, served from `/uploads` on this backend, instead of the R2 bucket.

The private `apps/frontend/.env.local` sets `VITE_API_URL=http://localhost:<api-port>`. The Vite proxy in `apps/frontend/vite.config.ts` is fixed to `localhost:3333`, so the frontend calls this backend directly instead. Dev CORS allows any origin, and `localhost` cookies are not tied to a port.

These cannot be isolated per worktree without changing app code, so treat them as shared:

- **Video uploads.** In development, `src/utils/upload-video-tus.ts` and the admin school media tab upload through the `/api` proxy. That reaches Cameron's backend on 3333, not yours. Do not test video uploads on a worker server.
- **Cookies.** The backend's cookie names `auth_session` and `auth_cache` are fixed in `config/auth.ts`. A sign-in on one `localhost` server replaces the cookies of every other server in the same browser profile, Cameron's too. Use a browser session of your own.
- **Outside services.** Stripe (test mode), Cloudflare Stream and SES use the root clone's real credentials. Video uploads land in the shared Stream account. Emails really send, so do not trigger signup, invite or password-reset emails to addresses you do not own.
- **The events worker** (`apps/events`) is not started. It reads the shared SQS queue, and the backend sends it nothing. Notifications that it writes do not appear on a worker server.

## Backend tests

`db.sh` also prints `TEST_DATABASE_URL=postgresql://...`. That database is migrated with the dev one, and no other worktree uses it. A shell variable beats `apps/backend/.env.test`, so run the suite against your own database:

```bash
cd apps/backend && DATABASE_URL=<TEST_DATABASE_URL> node ace test --files "<spec>"
```

Without the variable, tests run against the shared `s2s_test` database. Tests delete rows from the tables they use, so never point them at `s2s_<slug>`.

## Query your database

`db.sh` prints `DATABASE_URL=postgresql://...` above its `db-ok` line. It holds no secret, so `psql "<that URL>"` works directly.

## Edit your settings

You may change any value in your private `apps/backend/.env` or `apps/frontend/.env.local` to test, after `env-copy.sh` has run. Keep secrets out of output:

- List names with `rg -o '^[A-Z_]+=' apps/backend/.env`.
- Change a value with `sd`.
- Never print the file or a value from it.

Leave the last line of each file, the `# run-dev-server private copy` marker, in place. Without it, `env-copy.sh` treats the file as an earlier task's and moves it aside. Restart after an edit; both servers read their files at launch. Never read or copy `apps/backend/.env.production`.

## Give Cameron the app

When asked to run the dev server so Cameron can test or click around, run `up.sh`, then `sign-in.sh`, and report the `sign-in-link` URL it prints. Opening it signs the browser in and lands on the frontend. It works once, within 5 minutes; run `sign-in.sh` again for a fresh one. Opening it in a browser profile that is already signed in to another `localhost` server replaces that sign-in (see [Cookies](#what-each-server-talks-to)).

The servers listen on `localhost` only, so the URL works on this machine. From another machine on the tailnet it needs `tailscale serve` entries for both ports, which is shared host config: ask Cameron, do not add one.

## Sign in

```bash
.agents/skills/run-dev-server/scripts/sign-in.sh [--redirect /path] [dancer|admin|email]
```

There is no seed. The first run creates the `dancer` or `admin` user it signs in as, also in a copy of `s2s_prod_anon`:

- `dancer` (the default) is `dancer@run-dev-server.test`, a Dancer.
- `admin` is `admin@run-dev-server.test`, a Dancer account with the `admin` role.

Any other email must already be a user in your database: a production user in a copy of `s2s_prod_anon` (`user-<id>@example.test`), or one you signed up in the browser. To test a school account, sign it up in the browser; the signup form creates the School profile.

Each run stores one-time codes for the user in your Redis (only each code's SHA-256, for 5 minutes), follows one with curl to save a session, checks `/auth/session`, and prints two lines:

```
signed-in <email> (<type> <role>) cookies=<path>
sign-in-link http://localhost:<api-port>/auth/dev-sign-in?code=<code>
```

The link points at the backend port. `GET /auth/dev-sign-in` deletes the code as it reads it, logs in exactly as `POST /auth/login` does, and redirects to the frontend: to the `--redirect` path when given (the link then ends in `&redirect=<encoded path>`), else to its home page. The backend accepts only a path on the frontend and answers `422` for anything else. `localhost` cookies are not tied to a port. A used or expired code answers `410`. A `404` means the backend started before `env-copy.sh` set `DEV_SIGN_IN_LINK_ENABLED`: run `env-copy.sh`, then `restart.sh`. Do not paste the link anywhere but the report to Cameron; until it is used, it signs in whoever opens it.

The cookie file is a `0600` curl cookie jar for the backend: `curl -b <path> http://localhost:<api-port>/auth/session`. In a browser of your own, open the link in a `chrome-devtools-axi` session (`CHROME_DEVTOOLS_AXI_SESSION=s2s-<slug>`). `sign-in.sh` leaves passwords alone; the users it creates have none that works, so the login form does not sign them in.

## Restart or stop

```bash
.agents/skills/run-dev-server/scripts/restart.sh [--warm /path,/path]
```

Done when the last line is the `ready` line. It runs `stop.sh`, then `db.sh` so both databases take the migrations of the code now checked out (it keeps their data), then `redis.sh`, then `start.sh`.

Restart after these:

- Editing a private env file or a Vite config file.
- Rebuilding `packages/emails` or `packages/openapi`.
- Any `git checkout`, `git switch` or `git stash` that changes app code or migrations. A swap such as `git checkout HEAD~1 -- apps packages` for a before screenshot, and the swap back, leaves the servers on stale code and the database on the other code's schema.
- When a server stops answering.

Ordinary edits to app code reload without a restart.

To stop without starting again:

```bash
.agents/skills/run-dev-server/scripts/stop.sh
```

`stop.sh` ends each server's whole process group and waits until every process in it has exited. `ace serve --hmr` ignores SIGTERM and keeps its server alive with the port closed, so a plain `kill` is not enough: the scripts send SIGINT, then SIGKILL after 15 seconds. It refuses a process that does not run from your worktree. It leaves the Redis container running.

## Before and after screenshots

With the global dev-loop skill installed (`~/.agents/skills/dev-loop`), one call takes every before/after pair of a UI change. Start this worktree's servers first, then:

```bash
~/.agents/skills/dev-loop/scripts/before-after.sh --out "$TMPDIR/shots" --path /some/page
```

It shoots the before state on a shared server at `origin/main` (`.worktrees/before-server` in the primary checkout, frontend on 5198, database `s2s_before_server_main`) when your base matches it, and otherwise checks out the base here, restarts, shoots, and restores. `.agents/dev-loop.sh` tells it this repo's scripts, ports, warm-up and sign-in; `--help` lists the flags. `before-server.sh map-url` cannot map record ids (the adapter has no `DEV_LOOP_ID_LOOKUPS`, since there is no seed), so give it paths without them, such as `/feed` or `/resources/favorites`. Shared-server mode only gives a fair before for pages whose data both databases hold, such as the signed-in user's own pages: there is no seed.

A browser that signed in before the change keeps its old session: pass `--fresh-browser` once.

## Report

The verified URLs, the database name, both process groups and log paths, and the stop command. The private env files, databases and Redis container stay for reuse while the task runs.

## Clean up

When the task wraps up and nothing more needs the app, drop your databases and Redis:

```bash
.agents/skills/run-dev-server/scripts/drop-db.sh
```

Done when it prints `dropped s2s_<slug>, s2s_<slug>_test, studio2stadium-redis-<slug>`, with `(already gone)` after each name on a repeat. It stops your servers first. It drops only the names `db.sh` and `redis.sh` derive from your branch, and it refuses `s2s_dev`, `s2s_test`, `postgres`, `template0`, `template1`, the `s2s_tpl_*` templates and `s2s_prod_anon`. If it reports other connections, find and close the ones you opened, then retry; leave anyone else's alone.
