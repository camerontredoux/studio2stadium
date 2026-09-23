# The buyer's account is created at provisioning, from the checkout email

Supersedes [ADR 0004](0004-buyers-authenticate-before-paying.md).

Buyers do not sign in or sign up on the marketing site. The pre-checkout form asks for the buyer's
name and email along with the Org and Org Event, and `POST /event-tiers/checkout` no longer accepts a
`userId`: it would be a posted value nobody authenticated, and there is no session on the marketing
site to check it against. Checkout creates no account, so an abandoned checkout leaves nothing behind.

The name and email travel in the Checkout Session's metadata with the rest of the form, and the email
is also `customer_email`, so Stripe prefills it and sends the receipt there. When the payment lands,
provisioning identifies the buyer by that metadata email, normalized the way signup stores emails,
inside the same transaction that builds the Org:

- If a verified account has that email, the new Org, Org Event and organizer admin membership attach
  to it, and the buyer is emailed "Your Org is ready — sign in".
- If an unverified account has that email, provisioning treats it as unclaimed. Signup does not check
  that the person owns the email address, so the account can belong to someone else. See "Unverified
  accounts" below.
- Otherwise provisioning creates the account. It has no profile and no password anyone knows (its
  hash is of a random secret that is discarded). After the commit the buyer is emailed "Your Org is
  ready — set your password" with a single-use set-password link. The link is valid for 7 days and
  opens the product's existing reset-password page.

The billing email Stripe collects is never used. ADR 0004's reason still holds: a corporate card's
billing address is often the finance department's, and matching on it would produce Orgs nobody can
sign in to. The form email is typed by the buyer, for the buyer (PRD #84, story 17).

## Consequences

- Anyone who pays can make an Org for any email address. The owner of that address is only told
  their Org is ready. The payer gets no access, because only the mailbox owner can set the password
  or sign in.
- The set-password token uses the forgot-password mechanism: a SHA-256 hash in Redis, deleted when
  used. It has its own key prefix (`set-password:`) and TTL, so a forgot-password request neither
  replaces nor shortens it. `POST /auth/password/reset` accepts either token. It checks and deletes
  the token in one Redis script, so the same link sent twice at once sets a password only once.
  After the week, the buyer uses "Forgot password".
- A created account starts with `verified: false`. Setting the password from the set-password link
  sets `verified: true`, because only the owner of the inbox can have that link. This is the same
  rule as the other emailed-token flows (school and dancer registration).
- If the account still has an unspent set-password link when another purchase lands on it (the
  buyer bought twice before opening the first email, or lost a race to create the account), that
  purchase also sends a set-password email with a fresh link, and the status endpoint says
  `set_password`. The fresh link replaces the earlier one, and the email says to use the newest. The
  sign-in email also mentions "Forgot password", which covers a buyer who has no password in any
  other case.
- The pre-hijacking risk is closed. Earlier, a person who signed up with another person's address
  before that person bought became admin of the Org the real owner paid for. Now provisioning
  trusts only a verified account (see "Unverified accounts"). Whoever signed up loses the password
  and every session, and only the owner of the mailbox can get in.
- Idempotency is still on the Checkout Session id. A redelivered webhook finds the purchase already
  recorded and creates no account and sends no email. If two purchases create an account for the
  same new email at once, they meet on the unique `users.email` constraint. The losing transaction
  rolls back, and its retry attaches to the account the other one created.
- `event_tier_purchases.buyer_account_created` records whether the purchase created the account.
  `GET /event-tiers/checkout/:sessionId` uses it to return `nextStep: "set_password" | "sign_in"`.
  That tells the page whether to say "check your email" or "sign in". The endpoint never returns the
  email, and it only says anything about the account behind a paid session, so nobody can use it to
  check whether an address has an account.
- `users.type` has no Organizer value; Organizer is a membership type (ADR 0003). A created account
  gets the default `dancer` type with no profile, and the org area already lets a profile-less Org
  admin in without onboarding. Dancer-search surfaces that filter on `users.type` could list such an
  account until an Organizer account type exists.
- If the post-commit session revocation or email fails, provisioning is not rolled back. The failure is logged and sent to
  Sentry, and the buyer can still get in through "Forgot password".

## Unverified accounts

Rule: provisioning attaches a purchase to an existing account as-is only when `users.verified` is
true. An account with `verified: false` is unclaimed, and provisioning takes it over for the owner of
the email address:

1. In the provisioning transaction, provisioning replaces the account's password with the hash of a
   random secret that it discards. This is the same unusable password that a created account gets.
   The Org, Org Event and organizer admin membership attach to the account as usual. The other
   account data (name, profile) does not change.
2. After the commit, provisioning revokes all sessions of the account, bearer tokens included, and
   deletes all pending password tokens (forgot-password and set-password).
3. Then provisioning mints a set-password link and sends "Your Org is ready — set your password",
   the same as for a created account. `GET /event-tiers/checkout/:sessionId` returns
   `nextStep: "set_password"` because the set-password token is pending.
4. Setting the password from that link sets `verified: true`. After that, the account is claimed,
   and a later purchase attaches to it with no change.

Session revocation: sessions are Redis keys with random ids and no index by user. Thus
`revokeUserSessions` (`app/auth/invalidate.ts`) writes a cut-off time for the user
(`session:revoked:<userId>`, which lives as long as a session can stay idle). The guard refuses and
deletes each session that started at or before the cut-off. Each session records when it started
(`issuedAt`); a session from before this field existed counts as started at 0. The version bump in
`invalidateUserSessions` does not end sessions (the guard reloads the user and keeps the session), so
it is not sufficient here. A limit: GET requests that the cache cookie answers do not go to Redis. Thus
a revoked browser can read for at most the cache cookie's lifetime (5 minutes).

Idempotency: the password change happens only in the transaction that records the purchase. A
redelivered webhook finds the purchase recorded and returns before it reads the account. Thus a
retry does not change a password that the owner set after the first delivery, does not revoke the
owner's new sessions, and sends no second email.

A second, different purchase for an address whose account is still unverified takes the account
over again: new unusable password, sessions revoked, fresh set-password link. This includes an owner
who set a password with "Forgot password" and not with the set-password link, because that path does
not verify the email.
