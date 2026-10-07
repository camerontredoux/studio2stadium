# Production data access

This guide says where the production database credential lives, what that credential can do, and
how to read production safely.

## The rule

- **Reads need no approval.** Run them through `scripts/ro-psql.sh`.
- **Every action that commits a change to production needs Cameron's explicit yes for that one
  action, every time.** That covers `INSERT`, `UPDATE`, `DELETE`, DDL, `pg_terminate_backend`, a
  backfill command run against production, and any session that is not read-only. A yes never
  carries over to a later action, even an identical one.
- **Never print a secret.** Do not echo, `cat` or paste the connection string or the env file.

## Where the credential lives

`apps/backend/.env.production` in the root clone holds the production `DATABASE_URL`, next to
every other production secret (Stripe, AWS, Cloudflare and the app key). The root `.gitignore`
lists the file at line 66, so it is never committed. A worktree does not have it.

`scripts/ro-psql.sh` finds the root clone from any worktree through
`git rev-parse --git-common-dir`. It reads only the `DATABASE_URL` line. It does not source the
file, so no other secret enters the shell.

Fly secrets are no help here. `fly secrets list` shows digests, not values.

## The credential can change everything

`DATABASE_URL` is the Supabase `postgres` login through the transaction pooler
(`*.pooler.supabase.com:6543`). The app uses the same login. There is no separate read-only login.

Checked against production on 2026-10-07:

```
rolsuper=false  rolcreatedb=true  rolcreaterole=true  rolbypassrls=true
public.users: INSERT, UPDATE, DELETE allowed
drizzle.__drizzle_migrations: DELETE allowed
```

What this means:

- The login can write and delete every application table, the migration history and the
  `event_audit_log` table.
- The login bypasses row-level security. Row-level security is on for every table in `public`,
  but it does not limit this login.
- The login can create roles and databases.

The credential does not stop a write. The read-only transaction in `scripts/ro-psql.sh` is the
guard.

## How the read-only guard works

Supabase's pooler ignores startup options. With
`PGOPTIONS="-c default_transaction_read_only=on"`, a session through port 6543 or port 5432 still
reports `default_transaction_read_only = off`. Do not trust `PGOPTIONS` as a guard here.

The script puts your SQL inside one transaction instead:

1. It sends `BEGIN READ ONLY`.
2. It sets `statement_timeout = 60s`, `lock_timeout = 1s` and
   `idle_in_transaction_session_timeout = 60s` with `SET LOCAL`. These settings end with the
   transaction, so nothing stays on the pooler's shared connections.
3. It reads `transaction_read_only` and stops if the value is not `on`. This first query also
   takes a snapshot, after which Postgres refuses `SET TRANSACTION READ WRITE`.
4. It runs your SQL, then sends `ROLLBACK`.

The transaction pooler keeps one transaction on one server connection, so the guard holds on port
6543. A write fails with `cannot execute UPDATE in a read-only transaction`.

Before it connects, the script refuses SQL that could leave the transaction:

- a statement that starts with `COMMIT`, `ROLLBACK`, `BEGIN`, `END`, `ABORT`,
  `START TRANSACTION`, `SAVEPOINT`, `RELEASE`, `PREPARE TRANSACTION`, `SET SESSION`,
  `SET TRANSACTION`, `RESET` or `DISCARD`
- any mention of `transaction_read_only`
- the psql commands `\c`, `\connect`, `\i`, `\ir`, `\include`, `\!`, `\gexec`, `\o`, `\w` and
  `\copy`

It also refuses `-c`, `-1` and connection flags. Pass SQL with `-f` or on stdin.

## Read production

Run these from the root clone or any worktree:

```bash
scripts/ro-psql.sh --whoami                 # user, database, read_only
scripts/ro-psql.sh -f "$TMPDIR/query.sql"   # or SQL on stdin
scripts/ro-psql.sh -At -f "$TMPDIR/q.sql"   # psql output flags pass through
scripts/ro-psql.sh --describe org_events    # columns, types, nullability, defaults
```

`--whoami` must print `postgres`, `postgres` and `on`. If it does not, stop.

Keep query files and results under `$TMPDIR`, not in the repo.

## Write to production

Only with Cameron's explicit yes for that one action. Before you ask him:

1. Write the change as a file. Keep it separate from the `SELECT` preview.
2. Dump every row the change touches to a file with `scripts/ro-psql.sh`.
3. Show him the preview, the row count and the exact statement.

`psql --single-transaction -f file.sql` commits on success. Never use it for a preview.

`scripts/ro-psql.sh` cannot write. A write needs its own command that he approves, and that
approval ends when the command finishes.
