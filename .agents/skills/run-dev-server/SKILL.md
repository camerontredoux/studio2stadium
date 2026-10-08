---
name: run-dev-server
description: Start, restart, stop, or sign in to the studio2stadium dev servers (backend and frontend) in a worktree, on their own ports, their own local databases, and their own Redis. Use in a studio2stadium checkout whenever a task needs the app running, such as checking a change in the browser, taking PR screenshots, or giving Cameron a sign-in to click around a worker's server.
---

# Run the dev server

Your worktree gets these things of its own:

- Private `0600` copies of `apps/backend/.env` and `apps/frontend/.env.local`.
- The databases `s2s_<slug>` for the server and `s2s_<slug>_test` for backend tests. The slug is the branch name, lowercased, with other characters as `_`.
- A Redis container, `studio2stadium-redis-<slug>` (with `-` in place of `_`). `config/redis.ts` has no database index or key prefix setting, so one shared Redis would mix sessions and cached data across servers. The container keeps nothing on disk; recreating it signs everyone out.
- One port slot: the frontend on 5180 to 5199, the backend on the matching 3340 to 3359, and Redis on 6390 to 6409.

The Postgres server on `localhost:5432`, the `s2s_dev` and `s2s_test` databases, the root clone's env files, and Cameron's ports 5173, 3333 and 6379 are shared with Cameron and every other worker. The scripts never write to them.

The scripts live in `.agents/skills/run-dev-server/scripts/`. Run them from the worktree root. Each acts on the worktree it runs in (`git rev-parse --show-toplevel`), so a copy stored anywhere works. Each one ends on one success line, or exits non-zero with a `run-dev-server:` message that names the fix. Each is safe to repeat. Create your branch first; a detached HEAD has no slug.

## Start

```bash
.agents/skills/run-dev-server/scripts/up.sh
```

Done when the last line reads `ready http://localhost:<port> pgid=<pgid> api=http://localhost:<api-port> api-pgid=<pgid> db=s2s_<slug>`. Record both URLs, both process groups, and the `log=` paths printed above it. `up.sh` runs, in order:

| Script          | Does                                                                                                     | Success line                       |
| --------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `check-deps.sh` | Node 24, `pnpm install` if missing, builds `@stos/emails` and `@stos/openapi`, Docker, shared Postgres up | `deps-ok`                          |
| `env-copy.sh`   | Swaps the symlinked env files for private `0600` copies and checks the backend's required variables       | `private-copy-ok ...`              |
| `db.sh`         | Creates and migrates `s2s_<slug>` and `s2s_<slug>_test`, and sets `DATABASE_URL`                          | `db-ok s2s_<slug> (new\|reused)`   |
| `pick-port.sh`  | Keeps or chooses a free slot, and sets `PORT`, `SITE_URL`, `API_URL` and `VITE_API_URL` to match          | `port=<n> api=<n> redis=<n>`       |
| `redis.sh`      | Runs this worktree's Redis container on the slot's port and sets `REDIS_HOST` and `REDIS_PORT`            | `redis-ok <container> port=<n>`    |
| `start.sh`      | Launches both servers, each in its own process group, and runs `ready.sh`                                 | `ready http://...`                 |

On a failure, run the named script alone after the fix. When a step's message points at a log, read its tail.

`env-copy.sh` stops when the root clone's `apps/backend/.env` lacks a variable that `apps/backend/start/env.ts` requires, and names each one. Do not invent values. Ask Cameron. Cameron adds them to the root clone's file for later worktrees, and you may set the values Cameron gives you in your private copy (see [Edit your settings](#edit-your-settings)).

There is no copy of Cameron's dev data. The root clone's `DATABASE_URL` names `s2s_dev`, and the scripts never read from it or write to it.

## What each server talks to

The private `apps/backend/.env` keeps the root clone's values except these:

- `DATABASE_URL`, `PORT`, `HOST`, `SITE_URL`, `API_URL`, `REDIS_HOST` and `REDIS_PORT` point at this worktree's own database, ports and Redis.
- `NODE_ENV=development` and `CRON_EMAILS_ENABLED=false`.
- `DEV_SIGN_IN_LINK_ENABLED=true`, which registers the backend's dev-only `GET /auth/dev-sign-in` that `sign-in.sh` links to. The backend registers it only for the HTTP server with `NODE_ENV=development`, so production never has it.
- `SQS_QUEUE_URL` and `SQS_DEAD_LETTER_QUEUE_URL` point at a closed local port. The `publish-outbox` cron then logs `[Outbox]: Error publishing events` and leaves rows unpublished. It does not send this database's events to the shared dev queue.

The private `apps/frontend/.env.local` sets `VITE_API_URL=http://localhost:<api-port>`. The Vite proxy in `apps/frontend/vite.config.ts` is fixed to `localhost:3333`, so the frontend calls this backend directly instead. Dev CORS allows any origin, and `localhost` cookies are not tied to a port.

These cannot be isolated per worktree without changing app code, so treat them as shared:

- **Video uploads.** In development, `src/utils/upload-video-tus.ts` and the admin school media tab upload through the `/api` proxy. That reaches Cameron's backend on 3333, not yours. Do not test video uploads on a worker server.
- **Cookies.** The backend's cookie names `auth_session` and `auth_cache` are fixed in `config/auth.ts`. A sign-in on one `localhost` server replaces the cookies of every other server in the same browser profile, Cameron's too. Use a browser session of your own.
- **Outside services.** Stripe (test mode), the R2 bucket, Cloudflare Stream and SES use the root clone's real credentials. Uploads land in the shared bucket and Stream account. Emails really send, so do not trigger signup, invite or password-reset emails to addresses you do not own.
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
.agents/skills/run-dev-server/scripts/sign-in.sh [dancer|admin|email]
```

There is no seed. The first run creates the user it signs in as:

- `dancer` (the default) is `dancer@run-dev-server.test`, a Dancer.
- `admin` is `admin@run-dev-server.test`, a Dancer account with the `admin` role.

Any other email must already be a user in your database, for example one you signed up in the browser. To test a school account, sign it up in the browser; the signup form creates the School profile.

Each run stores one-time codes for the user in your Redis (only each code's SHA-256, for 5 minutes), follows one with curl to save a session, checks `/auth/session`, and prints two lines:

```
signed-in <email> (<type> <role>) cookies=<path>
sign-in-link http://localhost:<api-port>/auth/dev-sign-in?code=<code>
```

The link points at the backend port. `GET /auth/dev-sign-in` deletes the code as it reads it, logs in exactly as `POST /auth/login` does, and redirects to the frontend; `localhost` cookies are not tied to a port. A used or expired code answers `410`. A `404` means the backend started before `env-copy.sh` set `DEV_SIGN_IN_LINK_ENABLED`: run `env-copy.sh`, then `restart.sh`. Do not paste the link anywhere but the report to Cameron; until it is used, it signs in whoever opens it.

The cookie file is a `0600` curl cookie jar for the backend: `curl -b <path> http://localhost:<api-port>/auth/session`. In a browser of your own, open the link in a `chrome-devtools-axi` session (`CHROME_DEVTOOLS_AXI_SESSION=s2s-<slug>`). `sign-in.sh` leaves passwords alone; the users it creates have none that works, so the login form does not sign them in.

## Restart or stop

```bash
.agents/skills/run-dev-server/scripts/restart.sh
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

## Report

The verified URLs, the database name, both process groups and log paths, and the stop command. The private env files, databases and Redis container stay for reuse while the task runs.

## Clean up

When the task wraps up and nothing more needs the app, drop your databases and Redis:

```bash
.agents/skills/run-dev-server/scripts/drop-db.sh
```

Done when it prints `dropped s2s_<slug>, s2s_<slug>_test, studio2stadium-redis-<slug>`, with `(already gone)` after each name on a repeat. It stops your servers first. It drops only the names `db.sh` and `redis.sh` derive from your branch, and it refuses `s2s_dev`, `s2s_test`, `postgres` and the templates. If it reports other connections, find and close the ones you opened, then retry; leave anyone else's alone.
