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

- If an account has that email, the new Org, Org Event and organizer admin membership attach to it,
  and the buyer is emailed "Your Org is ready — sign in".
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
  replaces nor shortens it. `POST /auth/password/reset` accepts either token. After the week, the
  buyer uses "Forgot password".
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
- If the post-commit email fails, provisioning is not rolled back. The failure is logged and sent to
  Sentry, and the buyer can still get in through "Forgot password".
