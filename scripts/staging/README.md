# Staging data from production

`anonymise.sql` scrubs personal data from a copy of the production database.
Run it only on a throwaway local copy. Never run it against production, and never
load an unscrubbed dump into staging.

The staging password for every account is at the top of `anonymise.sql`.

## What you need

- Docker
- The production and staging connection strings. For Supabase, use the
  **session pooler (port 5432)** or the **direct connection**. Do not use the
  transaction pooler on port 6543: `pg_dump` and `pg_restore` need a session,
  and the transaction pooler does not give them one.
  - Session pooler: `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
  - Direct: `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres` (IPv6 only unless the project has the IPv4 add-on)

Every command below runs `pg_dump`, `pg_restore` and `psql` inside the
`postgres:17` container, so the client version is always 17. If production
runs a newer major version than 17, change the image tag to match it.

```sh
export PROD_URL='postgresql://postgres.<prod-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres'
export STAGING_URL='postgresql://postgres.<staging-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres'
export KEEP_EMAIL='you@studio2stadium.com'   # your real admin login; optional
export WORK="$(mktemp -d)"                   # the dumps go here; step 6 deletes them
```

## Pipeline

### 1. Dump production

Dump the `public` schema and the `drizzle` schema (it holds only the
`__drizzle_migrations` table), in custom format, without owners or privileges.
Use two `--schema` flags. Do not use `--table=drizzle.__drizzle_migrations`:
with `--table`, `pg_dump` dumps only that table and ignores `--schema`.

```sh
docker run --rm -v "$WORK:/work" postgres:17 \
  pg_dump "$PROD_URL" --format=custom --no-owner --no-privileges \
    --schema=public --schema=drizzle \
    --file=/work/prod.dump
```

`--schema=public` does not dump extensions. Before step 2, check which
extensions the tables use and in which schema they are installed (on
production, run `\dx`). The app needs `citext`.

### 2. Restore into a throwaway local Postgres 17

```sh
docker run -d --name s2s-anon -e POSTGRES_PASSWORD=anon -p 55432:5432 \
  -v "$WORK:/work" postgres:17
sleep 5
docker exec s2s-anon psql -U postgres -c 'CREATE EXTENSION IF NOT EXISTS citext'
# If production installs citext in the "extensions" schema (Supabase default), do this instead:
#   docker exec s2s-anon psql -U postgres -c 'CREATE SCHEMA extensions' \
#     -c 'CREATE EXTENSION citext SCHEMA extensions'
# The dump contains "CREATE SCHEMA public", which fails because public
# already exists. Restore from a table of contents without that entry.
docker exec s2s-anon sh -c "pg_restore -l /work/prod.dump \
  | sed -E '/ SCHEMA - public |COMMENT - SCHEMA public /d' > /work/prod.toc"
docker exec s2s-anon pg_restore -U postgres -d postgres --no-owner --no-privileges \
  --exit-on-error --use-list=/work/prod.toc /work/prod.dump
```

### 3. Anonymise

```sh
docker cp scripts/staging/anonymise.sql s2s-anon:/work/anonymise.sql
docker exec s2s-anon psql -U postgres -d postgres -X \
  -v keep_email="$KEEP_EMAIL" -f /work/anonymise.sql
```

The script runs in one transaction. It commits only if its sanity checks pass.
The checks look for leftover email addresses, phone numbers and `cus_` ids.
If a check fails, the script prints the table and column and nothing is changed.
To try the script without committing, add `-v dry_run=1`.

If you omit `keep_email`, every account is scrubbed. If you give it and no user
has that email, the script stops.

### 4. Dump the scrubbed database

```sh
docker exec s2s-anon pg_dump -U postgres -d postgres --format=custom \
  --no-owner --no-privileges \
  --schema=public --schema=drizzle \
  --file=/work/staging.dump
```

### 5. Restore into staging

Restore into the `public` schema only, plus the `drizzle` migrations schema.
The dump contains nothing else, so the Supabase-managed schemas (`auth`,
`storage`, `realtime`, `extensions`, and so on) are not touched. The table of
contents again leaves out `CREATE SCHEMA public`, so `--clean` does not drop
the `public` schema itself. `citext` must already exist in the staging
database, in the same schema as on production.

```sh
docker exec s2s-anon sh -c "pg_restore -l /work/staging.dump \
  | sed -E '/ SCHEMA - public |COMMENT - SCHEMA public /d' > /work/staging.toc"
docker run --rm -v "$WORK:/work" postgres:17 \
  pg_restore --dbname="$STAGING_URL" --no-owner --no-privileges \
    --clean --if-exists --single-transaction --exit-on-error \
    --use-list=/work/staging.toc /work/staging.dump
```

Make sure `$STAGING_URL` points to staging before you run this. `--clean`
drops each table in the dump before it recreates it, so staging data in those
tables is replaced. `--single-transaction` means a failed restore changes
nothing.

### 6. Delete the dumps and the scratch container

```sh
docker rm -f s2s-anon
rm -rf "$WORK"
```

## What the script does

- **Accounts:** emails become `u_<hash of user id>@staging.invalid`. Names get
  fake names. Dancer usernames get a hashed name. School usernames stay,
  because they are the school's public slug. Phones are set to NULL. Every
  password is set to the staging password. The `keep_email` user keeps their
  email, username and name, and gets role `admin`.
- **Other emails** (rosters, invites, claim requests, CSV rows, event contact
  emails, JSON payloads) use the same mapping. An address that belongs to a
  user gets that user's staging address, so rosters still match their
  accounts. Other addresses become `x_<hash>@staging.invalid`.
- **Dancer data:** birthdays move by a random amount of up to ±180 days. Bios,
  awards, notes, comments and captions become lorem text of about the same
  length. Social handles become `staging_<hash>`. High school becomes
  `Staging High School`.
- **People inside reference data:** school head and assistant coach names are
  replaced. Street addresses of events and venues become `1 Staging Way`.
- **Payment ids:** Stripe ids become `cus_staging_<row id>`, `sub_staging_…`,
  `cs_staging_…`, `pi_staging_…` and `ch_staging_…`, so staging never calls
  Stripe with a production id.
- **Tokens:** invite tokens are regenerated.
- **JSON** (audit log metadata, notifications, feed, organization settings,
  event dancer `extra`, CSV error details): values are scrubbed by key name,
  for example email, name, phone, address, token or bio.
- **Truncated:** `outbox`, `processed_events` and `user_activities`, plus any
  session, token or job table if one is added later.
- **Safety net:** the script then checks every text, varchar, citext and JSON
  column. Any email address, phone number or Stripe id that is still there is
  replaced.

Sessions and password reset tokens are kept in Redis, not in Postgres. Give
staging its own empty Redis.
