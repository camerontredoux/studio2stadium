-- CREATE UNIQUE INDEX dancer_user_exclusive
-- ON dancer_accounts (user_id)
-- WHERE user_id NOT IN (SELECT user_id FROM school_accounts);

-- CREATE UNIQUE INDEX school_user_exclusive
-- ON school_accounts (user_id)
-- WHERE user_id NOT IN (SELECT user_id FROM dancer_accounts);
