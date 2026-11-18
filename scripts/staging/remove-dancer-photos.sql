-- Remove every dancer picture reference from the STAGING database.
-- Run it after anonymise.sql on each new copy of prod. NEVER run it on prod.
--
--   psql "$STAGING_DATABASE_URL" -f scripts/staging/remove-dancer-photos.sql
--
-- The pictures themselves stay in prod's bucket; staging only stops pointing
-- at them. Dancer videos are not touched.
\set ON_ERROR_STOP on
BEGIN;

UPDATE users SET avatar = NULL
 WHERE type = 'dancer' AND avatar IS NOT NULL;

DELETE FROM feed f
 USING profile_images pi
  JOIN users u ON u.id = pi.user_id
 WHERE f.content_type = 'image'
   AND f.content_id = pi.id
   AND u.type = 'dancer';

DELETE FROM profile_images pi
 USING users u
 WHERE u.id = pi.user_id AND u.type = 'dancer';

UPDATE event_dancer_profiles SET profile_photo_url = NULL
 WHERE profile_photo_url IS NOT NULL;

COMMIT;
