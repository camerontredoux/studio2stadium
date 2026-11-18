-- =============================================================================
-- anonymise.sql: scrub personal data from a COPY of the production database
-- so that it can be loaded into staging.
--
-- NEVER run this against production. Run it against a throwaway local restore
-- (see scripts/staging/README.md).
--
-- Staging password for EVERY account (including the kept admin):
--
--     staging-olyijcbz
--
-- The hash below was made with the app's own hasher (config/hash.ts:
-- @adonisjs/core argon2 driver, { parallelism: 1 }, library defaults:
-- argon2id, m=65536, t=3, p=1).
--
-- Usage:
--   psql "$SCRATCH_DB_URL" -v keep_email=you@example.com -f anonymise.sql
--   psql "$SCRATCH_DB_URL" -v keep_email=you@example.com -v dry_run=1 -f anonymise.sql
--
--   keep_email  optional. The user whose ORIGINAL email equals this value
--               (case-insensitive) keeps its real email, username and name,
--               and gets role 'admin'. Every other address becomes
--               u_<hash of user id>@staging.invalid (users) or
--               x_<hash of address>@staging.invalid (addresses that belong
--               to no user). If you give it and no user matches, the script
--               fails.
--   dry_run     optional. When set, the script ends with ROLLBACK instead of
--               COMMIT. Use this to test it against a database that must not
--               change.
--
-- The script runs in ONE transaction. It ends with sanity checks that raise an
-- exception (and so abort the transaction) if any of these remain, other than
-- the kept admin's own address:
--   * an email address not ending in @staging.invalid
--   * a phone-looking value
--   * a 'cus_' id that does not start with 'cus_staging_'
--
-- It works on main and on feat/event-tiers-completion: every table and column
-- is checked with to_regclass / information_schema first, and a missing one
-- is skipped with a NOTICE, not an error.
--
-- All helpers are pg_temp functions and ON COMMIT DROP tables, so nothing of
-- this script is left in the database.
-- =============================================================================

\set ON_ERROR_STOP on
\if :{?keep_email}
\else
  \set keep_email ''
\endif

BEGIN;

SET LOCAL search_path = public;
SET LOCAL client_min_messages = notice;

-- -----------------------------------------------------------------------------
-- Parameters
-- -----------------------------------------------------------------------------
CREATE TEMP TABLE staging_params ON COMMIT DROP AS
SELECT
  lower(btrim(:'keep_email'))::text AS keep_email,
  NULL::uuid AS keep_user_id,
  '$argon2id$v=19$m=65536,t=3,p=1$Z92hS0l+k62OyBF3P2nAkQ$KR306+6/NGetQOhL1z7dXLfTVzTvivCYzjODdfDL/QU'::text AS password_hash,
  -- Patterns shared by the safety-net sweep and the sanity checks, so that
  -- the two always agree.
  '[A-Za-z0-9._%+-]+@(?!staging\.invalid(?![A-Za-z0-9]|[.-][A-Za-z0-9]))[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}'::text
    AS email_pat,
  '(?<![0-9A-Za-z])(\+?1[ .-]?)?(\([0-9]{3}\) ?|[0-9]{3}[ .-]?)[0-9]{3}[ .-][0-9]{4}(?![0-9A-Za-z])|(?<![0-9A-Za-z+])\+[0-9]{10,14}(?![0-9])'::text
    AS phone_pat,
  '(?<![0-9A-Za-z_])(sub|pi|cs|ch|in|pm|seti|re|dp|py|txn|evt|acct)_(?!staging_)(test_|live_)?(?=[A-Za-z]*[0-9])[A-Za-z0-9]{8,}'::text
    AS stripe_pat,
  '(?<![0-9A-Za-z_])cus_(?!staging_)[A-Za-z0-9_]*'::text AS cus_pat;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- true when public.<tbl> exists and has every column in cols
CREATE FUNCTION pg_temp.has(tbl text, cols text[] DEFAULT '{}')
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT to_regclass(format('public.%I', tbl)) IS NOT NULL
     AND (SELECT count(*) FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = tbl
             AND column_name = ANY (cols)) = cardinality(cols)
$$;

-- run stmt only when the table and columns exist; report the row count
CREATE FUNCTION pg_temp.run(tbl text, cols text[], stmt text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  IF pg_temp.has(tbl, cols) THEN
    EXECUTE stmt;
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'scrub  %.% : % rows', tbl, array_to_string(cols, ','), n;
  ELSE
    RAISE NOTICE 'skip   %.% : table or column not present', tbl, array_to_string(cols, ',');
  END IF;
END $$;

-- deterministic hex digest of a seed
CREATE FUNCTION pg_temp.h(seed text, len int DEFAULT 16)
RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT left(md5(seed), len) $$;

CREATE FUNCTION pg_temp.fake_first(seed text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT (ARRAY['Alex','Jordan','Taylor','Morgan','Casey','Riley','Avery','Quinn',
                'Harper','Rowan','Emerson','Finley','Hayden','Jamie','Kendall','Logan',
                'Parker','Reese','Sawyer','Skyler','Blake','Cameron','Dakota','Drew',
                'Ellis','Frankie','Gray','Jules','Kai','Lane','Marley','Noel',
                'Oakley','Peyton','Remy','Sage','Shay','Tatum','Wren','Zion'])
         [1 + ((hashtext('first:' || seed)::bigint % 40 + 40) % 40)::int]
$$;

CREATE FUNCTION pg_temp.fake_last(seed text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT (ARRAY['Anders','Brooks','Carver','Dalton','Ellison','Fairley','Garner','Hale',
                'Ingram','Jessup','Keller','Lowry','Mercer','Nolan','Oakes','Pruitt',
                'Quincey','Rhodes','Sutton','Thorne','Upton','Vance','Whitaker','Yates',
                'Ashby','Barlow','Colby','Dunmore','Easton','Fenwick','Gilmore','Hollis',
                'Ivers','Jarrett','Kingsley','Langley','Marsh','Norwood','Presley','Stanton'])
         [1 + ((hashtext('last:' || seed)::bigint % 40 + 40) % 40)::int]
$$;

-- lorem-style placeholder of roughly the same length; NULL and '' stay as is
CREATE FUNCTION pg_temp.lorem(t text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN t IS NULL OR btrim(t) = '' THEN t
    ELSE rtrim(left(repeat('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ',
                           length(t) / 120 + 1), greatest(length(t), 1)))
  END
$$;

-- new 64-hex token (fits varchar(64))
CREATE FUNCTION pg_temp.new_token(seed text)
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT md5(seed || random()::text || clock_timestamp()::text)
      || md5(random()::text || seed)
$$;

-- Stripe-style id -> '<prefix>_staging_<row id>'. Unprefixed -> 'staging_<id>'.
CREATE FUNCTION pg_temp.fake_provider_id(v text, row_id text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN v IS NULL OR v = '' THEN v
    WHEN v ~ '^[a-z]+_' THEN substring(v FROM '^([a-z]+)_') || '_staging_' || row_id
    ELSE 'staging_' || row_id
  END
$$;

-- email / username maps, built from the ORIGINAL users rows
CREATE TEMP TABLE email_map (old_email text PRIMARY KEY, new_email text NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE username_map (old_username text PRIMARY KEY, new_username text NOT NULL) ON COMMIT DROP;

-- any email -> the user's staging email if it belongs to a user, else a
-- stable hashed staging address. The kept admin maps to itself.
CREATE FUNCTION pg_temp.fake_email(e text)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN e IS NULL OR btrim(e) = '' THEN e
    ELSE coalesce(
      (SELECT m.new_email FROM pg_temp.email_map m WHERE m.old_email = lower(btrim(e))),
      'x_' || pg_temp.h(lower(btrim(e))) || '@staging.invalid')
  END
$$;

CREATE FUNCTION pg_temp.fake_username(u text)
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT CASE
    WHEN u IS NULL OR u = '' THEN u
    ELSE coalesce(
      (SELECT m.new_username FROM pg_temp.username_map m WHERE m.old_username = lower(u)),
      'u' || pg_temp.h('username:' || lower(u), 15))
  END
$$;

-- scrub one jsonb value found under key k
CREATE FUNCTION pg_temp.scrub_json_kv(k text, v jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
BEGIN
  IF v IS NULL OR jsonb_typeof(v) = 'null' THEN
    RETURN v;
  END IF;

  IF jsonb_typeof(v) IN ('object', 'array') THEN
    RETURN pg_temp.scrub_json(v);
  END IF;

  IF k ~* '(token|secret|password|passwd|api_?key|session|cookie|authorization|signature)' THEN
    RETURN to_jsonb('[redacted]'::text);
  ELSIF k ~* '(user_?agent|(^|_)ip$|^ip[A-Z_]|ip_?addr)' THEN
    RETURN 'null'::jsonb;
  ELSIF k ~* '(phone|mobile|cell)' THEN
    RETURN 'null'::jsonb;
  ELSIF k ~* '(birth|dob)' THEN
    RETURN 'null'::jsonb;
  ELSIF jsonb_typeof(v) <> 'string' THEN
    RETURN v;
  ELSIF k ~* 'e-?mail' THEN
    RETURN to_jsonb(pg_temp.fake_email(v #>> '{}'));
  ELSIF k ~* 'user_?name' THEN
    RETURN to_jsonb(pg_temp.fake_username(v #>> '{}'));
  ELSIF k ~* '(first|given)_?name$' THEN
    RETURN to_jsonb(pg_temp.fake_first(v #>> '{}'));
  ELSIF k ~* '(last|family|sur)_?name$' THEN
    RETURN to_jsonb(pg_temp.fake_last(v #>> '{}'));
  ELSIF k ~* '(full|display|middle|parent|guardian|contact|dancer|coach|sender|requester|actor)_?name$'
        OR k ~* '^(head_?coach|assistant_?coach|guardian|parent)$' THEN
    RETURN to_jsonb(pg_temp.fake_first(v #>> '{}') || ' ' || pg_temp.fake_last(v #>> '{}'));
  ELSIF k ~* '(address|street|line_?1|line_?2|postal|zip)' THEN
    RETURN to_jsonb('[address removed]'::text);
  ELSIF k ~* '(instagram|tiktok|youtube|twitter|facebook|linkedin|snapchat|social|handle)' THEN
    RETURN to_jsonb('staging_' || pg_temp.h(v #>> '{}', 8));
  ELSIF k ~* '^(bio|biography|note|notes|comment|comments|message|awards|description|content|body|text)$' THEN
    RETURN to_jsonb(pg_temp.lorem(v #>> '{}'));
  END IF;
  RETURN v;
END $$;

-- recursive jsonb scrub by key name
CREATE FUNCTION pg_temp.scrub_json(j jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  k text;
  v jsonb;
  result jsonb;
BEGIN
  IF j IS NULL THEN
    RETURN NULL;
  END IF;
  CASE jsonb_typeof(j)
    WHEN 'object' THEN
      result := '{}'::jsonb;
      FOR k, v IN SELECT * FROM jsonb_each(j) LOOP
        result := result || jsonb_build_object(k, pg_temp.scrub_json_kv(k, v));
      END LOOP;
      RETURN result;
    WHEN 'array' THEN
      RETURN coalesce(
        (SELECT jsonb_agg(pg_temp.scrub_json(e) ORDER BY i)
           FROM jsonb_array_elements(j) WITH ORDINALITY AS t(e, i)),
        '[]'::jsonb);
    ELSE
      RETURN j;
  END CASE;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Kept admin + email/username maps
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  keep text := (SELECT keep_email FROM pg_temp.staging_params);
  kid uuid;
BEGIN
  IF NOT pg_temp.has('users', ARRAY['id', 'email']) THEN
    RAISE EXCEPTION 'public.users with id/email not found: is this the right database?';
  END IF;

  IF keep <> '' THEN
    SELECT id INTO kid FROM public.users WHERE lower(email::text) = keep;
    IF kid IS NULL THEN
      RAISE EXCEPTION 'keep_email % matches no user; refusing to continue', keep;
    END IF;
    UPDATE pg_temp.staging_params SET keep_user_id = kid;
    RAISE NOTICE 'keeping admin login for user % (%)', kid, keep;
  ELSE
    RAISE NOTICE 'no keep_email given: every account is scrubbed';
  END IF;

  INSERT INTO pg_temp.email_map (old_email, new_email)
  SELECT lower(email::text),
         CASE WHEN id = kid THEN email::text
              ELSE 'u_' || pg_temp.h(id::text) || '@staging.invalid' END
    FROM public.users;

  -- also map each user's display_email, when it differs from the login email
  IF pg_temp.has('users', ARRAY['display_email']) THEN
    INSERT INTO pg_temp.email_map (old_email, new_email)
    SELECT lower(display_email),
           CASE WHEN id = kid THEN display_email
                ELSE 'u_' || pg_temp.h(id::text) || '@staging.invalid' END
      FROM public.users
     WHERE display_email IS NOT NULL AND btrim(display_email) <> ''
    ON CONFLICT (old_email) DO NOTHING;
  END IF;

  -- School accounts keep their username: it is the school's public slug
  -- (reference data). Dancer usernames are often the dancer's real name.
  IF pg_temp.has('users', ARRAY['username', 'type']) THEN
    INSERT INTO pg_temp.username_map (old_username, new_username)
    SELECT lower(username::text),
           CASE WHEN id = kid OR type::text = 'school' THEN username::text
                ELSE 'u' || pg_temp.h('user:' || id::text, 15) END
      FROM public.users;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Truncate pure log / outbox / queue / session tables
--    (cron_job_runs is kept: it is the per-tick run lock, no personal data,
--     and keeping it stops staging from re-running ticks prod already ran.)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'outbox',              -- event outbox; payloads embed user data
    'processed_events',    -- outbox consumer de-duplication log
    'user_activities',     -- per-user activity log
    -- not present today; truncated if a later branch adds them
    'sessions', 'auth_access_tokens', 'remember_me_tokens',
    'password_reset_tokens', 'webhook_events', 'jobs', 'failed_jobs']
  LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('TRUNCATE public.%I', t);
      RAISE NOTICE 'truncate %', t;
    ELSE
      RAISE NOTICE 'skip   % : table not present', t;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Users
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.run('users', ARRAY['email', 'display_email', 'first_name', 'last_name', 'username', 'phone', 'password', 'role'], $sql$
    UPDATE public.users u SET
      email         = CASE WHEN u.id = p.keep_user_id THEN u.email
                           ELSE ('u_' || pg_temp.h(u.id::text) || '@staging.invalid') END,
      display_email = CASE WHEN u.id = p.keep_user_id THEN u.display_email
                           ELSE 'u_' || pg_temp.h(u.id::text) || '@staging.invalid' END,
      username      = CASE WHEN u.id = p.keep_user_id OR u.type::text = 'school' THEN u.username
                           ELSE ('u' || pg_temp.h('user:' || u.id::text, 15)) END,
      first_name    = CASE WHEN u.id = p.keep_user_id THEN u.first_name
                           ELSE pg_temp.fake_first(u.id::text) END,
      last_name     = CASE WHEN u.id = p.keep_user_id THEN u.last_name
                           ELSE pg_temp.fake_last(u.id::text) END,
      phone         = NULL,
      password      = p.password_hash,
      role          = CASE WHEN u.id = p.keep_user_id THEN 'admin' ELSE u.role::text END::role
      FROM pg_temp.staging_params p
  $sql$);
END $$;

-- -----------------------------------------------------------------------------
-- 4. Dancer profile data
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  -- DOB: random shift of up to +/-180 days
  PERFORM pg_temp.run('dancer_profiles', ARRAY['birthday'], $sql$
    UPDATE public.dancer_profiles
       SET birthday = birthday + (floor(random() * 361)::int - 180)
     WHERE birthday IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('dancer_profiles', ARRAY['biography', 'awards'], $sql$
    UPDATE public.dancer_profiles
       SET biography = pg_temp.lorem(biography), awards = pg_temp.lorem(awards)
     WHERE biography IS NOT NULL OR awards IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('dancer_profiles', ARRAY['instagram', 'tiktok', 'youtube'], $sql$
    UPDATE public.dancer_profiles SET
      instagram = CASE WHEN nullif(btrim(instagram), '') IS NULL THEN instagram ELSE 'staging_' || pg_temp.h('ig:' || id::text, 8) END,
      tiktok    = CASE WHEN nullif(btrim(tiktok), '')    IS NULL THEN tiktok    ELSE 'staging_' || pg_temp.h('tt:' || id::text, 8) END,
      youtube   = CASE WHEN nullif(btrim(youtube), '')   IS NULL THEN youtube   ELSE 'staging_' || pg_temp.h('yt:' || id::text, 8) END
     WHERE coalesce(instagram, tiktok, youtube) IS NOT NULL
  $sql$);
  -- High school + grad year + DOB is enough to single out a minor.
  PERFORM pg_temp.run('dancer_profiles', ARRAY['high_school'], $sql$
    UPDATE public.dancer_profiles SET high_school = 'Staging High School'
     WHERE nullif(btrim(high_school), '') IS NOT NULL
  $sql$);

  PERFORM pg_temp.run('dancer_achievements', ARRAY['description'], $sql$
    UPDATE public.dancer_achievements SET description = pg_temp.lorem(description)
     WHERE description IS NOT NULL
  $sql$);

  PERFORM pg_temp.run('dancer_references', ARRAY['name', 'description'], $sql$
    UPDATE public.dancer_references SET
      name = pg_temp.fake_first('ref:' || id::text) || ' ' || pg_temp.fake_last('ref:' || id::text),
      description = pg_temp.lorem(description)
  $sql$);

  PERFORM pg_temp.run('profile_images', ARRAY['caption'], $sql$
    UPDATE public.profile_images SET caption = pg_temp.lorem(caption) WHERE caption IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('profile_videos', ARRAY['caption'], $sql$
    UPDATE public.profile_videos SET caption = pg_temp.lorem(caption) WHERE caption IS NOT NULL
  $sql$);
END $$;

-- -----------------------------------------------------------------------------
-- 5. Schools (reference data kept; only the people in it are scrubbed)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.run('school_profiles', ARRAY['head_coach', 'assistant_coach'], $sql$
    UPDATE public.school_profiles SET
      head_coach = CASE WHEN nullif(btrim(head_coach), '') IS NULL THEN head_coach
                        ELSE pg_temp.fake_first('hc:' || id::text) || ' ' || pg_temp.fake_last('hc:' || id::text) END,
      assistant_coach = CASE WHEN nullif(btrim(assistant_coach), '') IS NULL THEN assistant_coach
                        ELSE pg_temp.fake_first('ac:' || id::text) || ' ' || pg_temp.fake_last('ac:' || id::text) END
     WHERE coalesce(head_coach, assistant_coach) IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('school_favorites', ARRAY['comment'], $sql$
    UPDATE public.school_favorites SET comment = pg_temp.lorem(comment) WHERE comment IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('school_applications', ARRAY['notes'], $sql$
    UPDATE public.school_applications SET notes = pg_temp.lorem(notes) WHERE notes IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('dance_events', ARRAY['address'], $sql$
    UPDATE public.dance_events SET address = '1 Staging Way'
     WHERE nullif(btrim(address), '') IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('school_invites', ARRAY['email', 'token'], $sql$
    UPDATE public.school_invites SET
      email = pg_temp.fake_email(email),
      token = pg_temp.new_token(id::text)
  $sql$);
END $$;

-- -----------------------------------------------------------------------------
-- 6. Orgs, Org Events, rosters
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.run('org_events', ARRAY['contact_email'], $sql$
    UPDATE public.org_events SET contact_email = pg_temp.fake_email(contact_email)
     WHERE contact_email IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('org_events', ARRAY['venue_address'], $sql$
    UPDATE public.org_events SET venue_address = '1 Staging Way'
     WHERE nullif(btrim(venue_address), '') IS NOT NULL
  $sql$);

  -- Roster rows linked to an account take that account's (already scrubbed)
  -- name, so the two stay consistent. Unlinked rows get a name from their id.
  PERFORM pg_temp.run('event_rosters', ARRAY['email', 'first_name', 'last_name', 'user_id'], $sql$
    UPDATE public.event_rosters r SET
      email      = pg_temp.fake_email(r.email),
      first_name = coalesce(u.first_name, pg_temp.fake_first('roster:' || r.id::text)),
      last_name  = coalesce(u.last_name,  pg_temp.fake_last('roster:' || r.id::text))
      FROM public.event_rosters r2
      LEFT JOIN public.users u ON u.id = r2.user_id
     WHERE r2.id = r.id
  $sql$);

  PERFORM pg_temp.run('event_dancer_profiles', ARRAY['bio', 'extra'], $sql$
    UPDATE public.event_dancer_profiles SET
      bio = pg_temp.lorem(bio),
      extra = pg_temp.scrub_json(extra)
     WHERE bio IS NOT NULL OR extra IS NOT NULL
  $sql$);

  PERFORM pg_temp.run('event_notes', ARRAY['content'], $sql$
    UPDATE public.event_notes SET content = pg_temp.lorem(content) WHERE content IS NOT NULL
  $sql$);

  PERFORM pg_temp.run('csv_upload_rows', ARRAY['email', 'first_name', 'last_name', 'matched_user_id'], $sql$
    UPDATE public.csv_upload_rows c SET
      email      = pg_temp.fake_email(c.email::text),
      first_name = coalesce(u.first_name, pg_temp.fake_first('csv:' || c.id::text)),
      last_name  = coalesce(u.last_name,  pg_temp.fake_last('csv:' || c.id::text))
      FROM public.csv_upload_rows c2
      LEFT JOIN public.users u ON u.id = c2.matched_user_id
     WHERE c2.id = c.id
  $sql$);
  PERFORM pg_temp.run('csv_uploads', ARRAY['error_details'], $sql$
    UPDATE public.csv_uploads SET error_details = pg_temp.scrub_json(error_details)
     WHERE error_details IS NOT NULL
  $sql$);

  PERFORM pg_temp.run('org_dancer_invites', ARRAY['email', 'token'], $sql$
    UPDATE public.org_dancer_invites SET
      email = pg_temp.fake_email(email),
      token = pg_temp.new_token(id::text)
  $sql$);

  PERFORM pg_temp.run('roster_claim_requests', ARRAY['claimed_first_name', 'claimed_last_name', 'claimed_email', 'note'], $sql$
    UPDATE public.roster_claim_requests SET
      claimed_first_name = pg_temp.fake_first('claim:' || id::text),
      claimed_last_name  = pg_temp.fake_last('claim:' || id::text),
      claimed_email      = pg_temp.fake_email(claimed_email::text),
      note               = pg_temp.lorem(note)
  $sql$);

  PERFORM pg_temp.run('event_audit_log', ARRAY['metadata'], $sql$
    UPDATE public.event_audit_log SET metadata = pg_temp.scrub_json(metadata)
     WHERE metadata IS NOT NULL
  $sql$);

  PERFORM pg_temp.run('organizations', ARRAY['settings', 'features'], $sql$
    UPDATE public.organizations SET
      settings = pg_temp.scrub_json(settings),
      features = pg_temp.scrub_json(features)
  $sql$);
END $$;

-- -----------------------------------------------------------------------------
-- 7. Payment provider ids (never let staging call Stripe with prod ids)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.run('user_subscriptions', ARRAY['customer_id'], $sql$
    UPDATE public.user_subscriptions SET customer_id = 'cus_staging_' || id::text
     WHERE customer_id IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('user_subscriptions', ARRAY['subscription_id'], $sql$
    UPDATE public.user_subscriptions SET subscription_id = pg_temp.fake_provider_id(subscription_id, id::text)
     WHERE subscription_id IS NOT NULL
  $sql$);

  -- event-tiers branch
  PERFORM pg_temp.run('event_tier_purchases', ARRAY['reference'], $sql$
    UPDATE public.event_tier_purchases SET reference = pg_temp.fake_provider_id(reference, id::text)
  $sql$);
  PERFORM pg_temp.run('event_tier_purchases', ARRAY['payment_intent_id'], $sql$
    UPDATE public.event_tier_purchases SET payment_intent_id = pg_temp.fake_provider_id(payment_intent_id, id::text)
     WHERE payment_intent_id IS NOT NULL
  $sql$);
  PERFORM pg_temp.run('event_tier_purchases', ARRAY['deactivation_reference'], $sql$
    UPDATE public.event_tier_purchases SET deactivation_reference = pg_temp.fake_provider_id(deactivation_reference, id::text)
     WHERE deactivation_reference IS NOT NULL
  $sql$);
END $$;

-- -----------------------------------------------------------------------------
-- 8. Notifications / feed payloads
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_temp.run('notifications', ARRAY['content'], $sql$
    UPDATE public.notifications SET content = pg_temp.scrub_json(content)
  $sql$);
  PERFORM pg_temp.run('feed', ARRAY['payload'], $sql$
    UPDATE public.feed SET payload = pg_temp.scrub_json(payload) WHERE payload IS NOT NULL
  $sql$);
END $$;

-- -----------------------------------------------------------------------------
-- 9. Columns matched by name anywhere (for tables added later)
--    ip addresses / user agents -> NULL (or '' when NOT NULL)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  n bigint;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name, c.is_nullable
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema AND t.table_name = c.table_name
     WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
       AND c.column_name ~ '(^ip$|ip_address|^last_ip|user_agent)'
       AND (c.data_type IN ('text', 'character varying', 'inet') OR c.udt_name = 'citext')
  LOOP
    EXECUTE format('UPDATE public.%I SET %I = %s WHERE %I IS NOT NULL',
                   r.table_name, r.column_name,
                   CASE WHEN r.is_nullable = 'YES' THEN 'NULL' ELSE '''''' END,
                   r.column_name);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE 'scrub  %.% : % rows (ip / user agent)', r.table_name, r.column_name, n;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 10. Safety net: sweep EVERY text / varchar / citext / jsonb column in public
--     and replace any remaining email address, phone-looking value or
--     Stripe-style id found inside it (e.g. an email typed into a school's
--     "about" text). The kept admin's exact address is left alone.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  p record;
  r record;
  expr text;
  n bigint;
BEGIN
  SELECT * INTO p FROM pg_temp.staging_params;
  FOR r IN
    SELECT c.relname AS tbl, a.attname AS col,
           format_type(a.atttypid, a.atttypmod) AS typ
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      JOIN pg_type ty ON ty.oid = a.atttypid
     WHERE ns.nspname = 'public' AND c.relkind IN ('r', 'p')
       AND a.attnum > 0 AND NOT a.attisdropped
       AND ty.typname IN ('text', 'varchar', 'bpchar', 'citext', 'jsonb', 'json', '_text', '_varchar')
     ORDER BY 1, 2
  LOOP
    expr := format(
      'regexp_replace(regexp_replace(regexp_replace(regexp_replace(%1$I::text, %2$L, %3$L, ''g''), %4$L, %5$L, ''g''), %6$L, %7$L, ''g''), %8$L, %9$L, ''g'')',
      r.col,
      p.email_pat,  'redacted@staging.invalid',
      p.phone_pat,  '[phone removed]',
      p.stripe_pat, '\1_staging_redacted',
      p.cus_pat,    'cus_staging_redacted');
    EXECUTE format(
      'UPDATE public.%1$I SET %2$I = (%3$s)::%4$s
        WHERE %2$I IS NOT NULL
          AND (%2$I::text ~ %5$L OR %2$I::text ~ %6$L OR %2$I::text ~ %7$L OR %2$I::text ~ %8$L)
          AND lower(%2$I::text) IS DISTINCT FROM %9$L',
      r.tbl, r.col, expr, r.typ,
      p.email_pat, p.phone_pat, p.stripe_pat, p.cus_pat,
      nullif(p.keep_email, ''));
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN
      RAISE NOTICE 'net    %.% : % rows', r.tbl, r.col, n;
    END IF;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 11. Sanity checks: abort the transaction if anything personal is left
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  p record;
  r record;
  n bigint;
  bad_email bigint := 0;
  bad_phone bigint := 0;
  bad_cus bigint := 0;
  problems text[] := '{}';
BEGIN
  SELECT * INTO p FROM pg_temp.staging_params;

  FOR r IN
    SELECT c.relname AS tbl, a.attname AS col
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace ns ON ns.oid = c.relnamespace
      JOIN pg_type ty ON ty.oid = a.atttypid
     WHERE ns.nspname = 'public' AND c.relkind IN ('r', 'p')
       AND a.attnum > 0 AND NOT a.attisdropped
       AND ty.typname IN ('text', 'varchar', 'bpchar', 'citext', 'jsonb', 'json', '_text', '_varchar')
     ORDER BY 1, 2
  LOOP
    EXECUTE format(
      'SELECT count(*) FROM public.%I WHERE %I::text ~ %L AND lower(%I::text) IS DISTINCT FROM %L',
      r.tbl, r.col, p.email_pat, r.col, nullif(p.keep_email, '')) INTO n;
    IF n > 0 THEN bad_email := bad_email + n; problems := problems || format('%s.%s: %s email(s)', r.tbl, r.col, n); END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I::text ~ %L', r.tbl, r.col, p.phone_pat) INTO n;
    IF n > 0 THEN bad_phone := bad_phone + n; problems := problems || format('%s.%s: %s phone(s)', r.tbl, r.col, n); END IF;

    EXECUTE format('SELECT count(*) FROM public.%I WHERE %I::text ~ %L', r.tbl, r.col, p.cus_pat) INTO n;
    IF n > 0 THEN bad_cus := bad_cus + n; problems := problems || format('%s.%s: %s cus_ id(s)', r.tbl, r.col, n); END IF;
  END LOOP;

  -- structured checks
  SELECT count(*) INTO n FROM public.users
   WHERE email::text NOT LIKE '%@staging.invalid'
     AND id IS DISTINCT FROM p.keep_user_id;
  IF n > 0 THEN problems := problems || format('users.email: %s not @staging.invalid', n); END IF;

  IF pg_temp.has('users', ARRAY['phone']) THEN
    SELECT count(*) INTO n FROM public.users WHERE phone IS NOT NULL;
    IF n > 0 THEN problems := problems || format('users.phone: %s not null', n); END IF;
  END IF;

  SELECT count(*) INTO n FROM public.users WHERE password IS DISTINCT FROM p.password_hash;
  IF n > 0 THEN problems := problems || format('users.password: %s not the staging hash', n); END IF;

  IF p.keep_user_id IS NOT NULL THEN
    SELECT count(*) INTO n FROM public.users WHERE id = p.keep_user_id AND role::text = 'admin';
    IF n <> 1 THEN problems := problems || 'kept admin is not role admin'::text; END IF;
  END IF;

  IF pg_temp.has('user_subscriptions', ARRAY['customer_id']) THEN
    SELECT count(*) INTO n FROM public.user_subscriptions
     WHERE customer_id IS NOT NULL AND customer_id NOT LIKE 'cus\_staging\_%';
    IF n > 0 THEN problems := problems || format('user_subscriptions.customer_id: %s not cus_staging_', n); END IF;
  END IF;

  RAISE NOTICE 'sanity: leftover emails=% phones=% cus_ids=%, problems=%',
    bad_email, bad_phone, bad_cus, cardinality(problems);

  IF cardinality(problems) > 0 THEN
    RAISE EXCEPTION 'anonymisation sanity check FAILED; rolling back: %', array_to_string(problems, '; ');
  END IF;

  RAISE NOTICE 'sanity checks passed';
END $$;

-- summary
SELECT 'users' AS what, count(*) AS n FROM public.users
UNION ALL SELECT 'users @staging.invalid', count(*) FROM public.users WHERE email::text LIKE '%@staging.invalid'
UNION ALL SELECT 'kept admin', count(*) FROM public.users u, pg_temp.staging_params p WHERE u.id = p.keep_user_id;

\if :{?dry_run}
  \echo 'dry_run set: ROLLBACK (nothing was changed)'
  ROLLBACK;
\else
  COMMIT;
  \echo 'anonymisation committed'
\endif
