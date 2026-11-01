-- Anonymize a restored copy of production in place. scripts/prod-anon-template.sh
-- runs this in one transaction against a scratch database, never against
-- production. Any error rolls everything back and the build stops.
--
-- Only emails change, plus every credential:
--   * A user's email becomes user-<users.id>@example.test, everywhere it
--     appears (users, rosters, invites, CSV rows, JSON, free text), so links by
--     email between rows still match.
--   * Any other address becomes contact-<n>@example.test, the same <n> for the
--     same address everywhere.
--   * Passwords become 'unset' (no hash matches it); invite tokens become
--     random.
--   * Outbox rows count as published and unfinished video uploads as failed,
--     so no local cron sends or deletes anything for them.
-- Names, phone numbers and other values stay as they are.
--
-- It leaves anon.needle (every production address, lower-cased) for the leak
-- check; the script drops schema anon before it publishes the template.

set client_min_messages = warning;

create schema anon;

-- An address, case-insensitive. The top-level domain must be letters, so
-- "photo@2x.png" in a file name still matches but "v1@2" does not.
create function anon.email_re() returns text language sql immutable
  as $$ select '[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}' $$;

-- Every column that can hold text: text, varchar, char, citext, json, jsonb
-- and arrays of those, in schema public.
create table anon.col as
select c.relname as tbl, a.attname as col, format_type(a.atttypid, a.atttypmod) as typ,
       a.attname ~* 'email' and t.typcategory = 'S' as whole_value
from pg_attribute a
join pg_class c on c.oid = a.attrelid and c.relkind in ('r', 'p')
join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
join pg_type t on t.oid = a.atttypid
left join pg_type e on e.oid = t.typelem and t.typcategory = 'A'
where a.attnum > 0 and not a.attisdropped and a.attgenerated = ''
  and (t.typname in ('text', 'varchar', 'bpchar', 'citext', 'json', 'jsonb')
    or e.typname in ('text', 'varchar', 'bpchar', 'citext'));

-- Every production address: the whole value of each email column, and every
-- match of the pattern anywhere else.
create table anon.found (email text not null);
do $$
declare r record;
begin
  for r in select * from anon.col loop
    if r.whole_value then
      execute format('insert into anon.found select lower(%I::text) from public.%I where %I is not null and %I::text <> %L',
                     r.col, r.tbl, r.col, r.col, '');
    end if;
    execute format('insert into anon.found select lower(m[1]) from public.%I, regexp_matches(%I::text, %L, %L) m where %I::text like %L',
                   r.tbl, r.col, '(' || anon.email_re() || ')', 'gi', r.col, '%@%');
  end loop;
end $$;

-- Users first, so a user's address maps to their id; then the rest, numbered.
create table anon.email_map (email text primary key, fake text not null unique);
insert into anon.email_map
select distinct on (lower(email::text)) lower(email::text), 'user-' || id || '@example.test'
from public.users order by lower(email::text), created_at, id;
insert into anon.email_map
select email, 'contact-' || row_number() over (order by email) || '@example.test'
from (select distinct email from anon.found) f
where not exists (select 1 from anon.email_map m where m.email = f.email);

create table anon.needle as select 'email'::text as kind, email as v from anon.email_map;

-- Values from email columns that the pattern does not match (a typo, a
-- missing domain, a stray space) but that hold an @. scrub replaces them by value, as a
-- case-insensitive regex with every special character escaped.
create table anon.odd as
select regexp_replace(email, '([^a-z0-9@ ])', '\\\1', 'g') as re, fake
from anon.email_map
where email like '%@%' and email !~* ('^' || anon.email_re() || '$');

-- Replace each address in t with its fake, left to right, so a short address
-- inside a longer one is never replaced on its own.
create function anon.scrub(t text) returns text language plpgsql stable as $$
declare
  re constant text := anon.email_re();
  out text := '';
  pos int := 1;
  at int;
  hit text;
  o record;
begin
  if t is null or strpos(t, '@') = 0 then
    return t;
  end if;
  for o in select * from anon.odd loop
    t := regexp_replace(t, o.re, o.fake, 'gi');
  end loop;
  loop
    at := regexp_instr(t, re, pos, 1, 0, 'i');
    exit when at = 0;
    hit := regexp_substr(t, re, pos, 1, 'i');
    out := out || substr(t, pos, at - pos)
      || coalesce((select fake from anon.email_map where email = lower(hit)), hit);
    pos := at + length(hit);
  end loop;
  return out || substr(t, pos);
end $$;

do $$
declare r record;
begin
  for r in select * from anon.col loop
    if r.whole_value then
      execute format('update public.%I t set %I = (select m.fake from anon.email_map m where m.email = lower(t.%I::text))::%s where t.%I is not null and t.%I::text <> %L',
                     r.tbl, r.col, r.col, r.typ, r.col, r.col, '');
    else
      execute format('update public.%I set %I = anon.scrub(%I::text)::%s where %I::text like %L',
                     r.tbl, r.col, r.col, r.typ, r.col, '%@%');
    end if;
  end loop;
end $$;

-- Credentials. Sessions and sign-in codes live in Redis, not here.
update public.users set password = 'unset';
update public.org_dancer_invites set token = encode(sha256(convert_to(gen_random_uuid()::text, 'UTF8')), 'hex');
update public.school_invites set token = encode(sha256(convert_to(gen_random_uuid()::text, 'UTF8')), 'hex');

-- Crons that act on production rows. publish-outbox sends unpublished rows to
-- SQS; the hourly reap-stuck-video-uploads deletes the Cloudflare Stream
-- video of each unfinished upload, which is production's media.
update public.outbox set published_at = now() where published_at is null;
update public.video_uploads set status = 'failed', error_message = 'Cleared by scripts/prod-anon-template.sql'
where video_id is null and status in ('pending', 'processing');

select 'emails ' || count(*) || ' (' || count(*) filter (where fake like 'user-%') || ' users)' from anon.email_map;
select 'users ' || count(*) || ', other addresses left '
  || (select count(*) from public.users where email::text not like '%@example.test') from public.users;
