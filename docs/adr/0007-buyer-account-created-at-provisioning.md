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

- If an account has that email and someone has proved they read its inbox, the new Org, Org Event
  and organizer admin membership attach to it, and the buyer is emailed "Your Org is ready — sign
  in".
- If an account has that email but nobody has proved they read its inbox, the Org is claimed through
  a link instead (see "Claiming an Org" below).
- Otherwise provisioning creates the account. It has no profile and no password anyone knows (its
  hash is of a random secret that is discarded). After the commit the buyer is emailed "Your Org is
  ready — set your password" with a single-use set-password link. The link is valid for 7 days and
  opens the product's existing reset-password page.

The billing email Stripe collects is never used. ADR 0004's reason still holds: a corporate card's
billing address is often the finance department's, and matching on it would produce Orgs nobody can
sign in to. The form email is typed by the buyer, for the buyer (PRD #84, story 17).

## Claiming an Org

Signup does not verify that the person owns the email address. Someone who signs up with another
person's address before that person buys would otherwise become admin of the Org the real owner paid
for. So provisioning attaches an Org to an existing account only when the owner of the inbox has proved
they read it:

- `users.email_verified_at` is set. Using any emailed single-use link sets it: a set-password or
  forgot-password link, or a claim link.
- Or an earlier purchase created the account. Its password can only have been set through a link sent
  to that inbox.

`users.verified` is not used for this. Despite the name, it is not about the email address: a dancer
sets it by finishing onboarding, and staff set it by accepting a school's application. Anyone can
sign up with someone else's address and finish onboarding. For the same reason a claim does not set
`users.verified`, because that would accept a pending school application.

For any other existing account, provisioning still creates the Org and the Org Event and records the
purchase, in one transaction, but:

- It creates no admin membership. The purchase row gets `claim_required = true` and
  `claimed_at = null`: the Org is awaiting its claim.
- It always creates a new Org. It never adds the event to an Org the account already administers,
  because whoever registered the address may run that Org.
- After the commit it mints a single-use claim token and emails the "Your Org is ready — claim it"
  variant of the Org-ready email. The token follows the password-token pattern: only its SHA-256 is
  kept, in Redis, under its own `claim-org:<userId>` key, for 7 days. There is one token per user,
  and it covers every claim the user has pending. A new one replaces the old one, and the email says
  to use the newest.

The claim link opens `/claim` in the product. The page needs a signed-in user. Without one it sends
them to login with a redirect back, and tells them that "Forgot password" also works. The page calls
`POST /event-tiers/claim`, which requires both proofs together:

- the signed-in user is the account the link was sent for (403 otherwise), and
- the token matches that account's pending claim token (400 when it is wrong, expired or used).

Either proof alone is not enough. Whoever registered the address can sign in to the account, and a
forwarded link can be opened by anyone. When both hold, one transaction sets `email_verified_at`,
creates the organizer admin membership for every pending purchase of that user, and sets
`claimed_at`. The token is spent after the commit. The transaction is idempotent: the pending rows are
locked, an existing membership is kept, and a second run finds nothing pending.

Setting a password from a forgot-password or set-password link proves the inbox as well. The reset
completes any pending claims in the same transaction as the password change. A buyer who lost the
claim email, or who does not know the password of the account, finishes by resetting the password.
Staff can also resend the claim email from the admin purchases list, which shows such purchases as
"Awaiting claim". The resent link goes to the account's own address.

`GET /event-tiers/checkout/:sessionId` answers `nextStep: "claim"` while the claim is pending, and
the marketing success page says to check the email to claim the Org. After the claim it answers
`sign_in`.

Nothing is taken from the account. Its password and its sessions are kept, so an ordinary buyer
whose email was never proven is not signed out or locked out. They open the link while signed in and
click "Claim".

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
  rule as the other emailed-token flows (school and dancer registration). Any password link also
  sets `email_verified_at`.
- If the account still has an unspent set-password link when another purchase lands on it (the
  buyer bought twice before opening the first email, or lost a race to create the account), that
  purchase also sends a set-password email with a fresh link, and the status endpoint says
  `set_password`. The fresh link replaces the earlier one, and the email says to use the newest. The
  sign-in email also mentions "Forgot password", which covers a buyer who has no password in any
  other case.
- Most existing accounts have no `email_verified_at` yet, because nothing set it before this change.
  Their owners claim the first Org they buy, with one click while signed in. After that claim, or
  after any password reset, later purchases attach straight away. Accounts made through an emailed
  invite (school and dancer registration) also start without it. Those flows could set it too.
- Residual risk: an Org's admin membership belongs to the account, not to a session. If someone
  registered the owner's address and is still signed in when the owner resets the password and
  claims the Org, that old session can see the Org until it expires (7 days idle). A password reset
  does not end other sessions. Closing this needs a "sign out everywhere" on password reset, which
  is a separate change to the auth guard.
- Changing an account's email address is not a supported flow. If one is added, it must clear
  `email_verified_at`.
- Idempotency is still on the Checkout Session id. A redelivered webhook finds the purchase already
  recorded and creates no account, records no second claim, mints no token and sends no email. If two purchases create an account for the
  same new email at once, they meet on the unique `users.email` constraint. The losing transaction
  rolls back, and its retry attaches to the account the other one created.
- `event_tier_purchases.buyer_account_created` records whether the purchase created the account.
  `GET /event-tiers/checkout/:sessionId` uses it, with `claim_required` and `claimed_at`, to return
  `nextStep: "set_password" | "claim" | "sign_in"`.
  That tells the page whether to say "check your email" or "sign in". The endpoint never returns the
  email, and it only says anything about the account behind a paid session, so nobody can use it to
  check whether an address has an account.
- `users.type` has no Organizer value; Organizer is a membership type (ADR 0003). A created account
  gets the default `dancer` type with no profile, and the org area already lets a profile-less Org
  admin in without onboarding. Dancer-search surfaces that filter on `users.type` could list such an
  account until an Organizer account type exists.
- If the post-commit email fails, provisioning is not rolled back. The failure is logged and sent to
  Sentry, and the buyer can still get in through "Forgot password".
