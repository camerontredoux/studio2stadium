# Week Pass emails: review notes (disabled implementation)

Status: built and tested locally, **switched off**. Nothing here has been
deployed, activated, or sent. Items marked REVIEW need a decision before
activation; none of them was silently approved.

## What it does

- **Welcome** (`WeekPassWelcomeEmail`). Fulfillment records a pending row in
  `week_pass_emails` in the same transaction as a newly recorded paid pass.
  The row is keyed by Checkout Session id, so the webhook and the browser
  return can't both owe one. The `week-pass-emails` cron delivers it after
  commit, rechecks the pass and the recipient first, and retries failures
  with backoff (2, 4, 8, 16 min; 5 attempts).
- **Expired-pass Premium offer** (`WeekPassExpiredEmail`). The same cron owes
  one per uninterrupted pass run once the last pass in it ends. That is
  `ends_at <= now` with no later pass, `ends_at >= WEEK_PASS_EMAILS_ACTIVE_FROM`,
  and the run ended no more than 3 days ago. The row is keyed by
  `user:runEnd`. Before every attempt the job rechecks and suppresses with a
  recorded reason for any of:
  - an active or future pass;
  - an active, trialing or grace-period subscription;
  - a subscription started during or after the run (upgraded);
  - an active premium grant;
  - any refund or dispute touching the run;
  - a changed run end;
  - an opt-out, a suppression-list hit, or a missing user or email.

Rows are claimed 10 at a time (at most 5 batches per tick per machine). Each
row's lease is renewed, and ownership reconfirmed, immediately before the
transport call, so a slow batch cannot send a row whose lease another worker
has since taken over; the worker that lost it skips it.

Delivery is still at least once per row, not exactly once. Two cases remain
unavoidable:

- A worker dies after SES accepts a message but before the row is marked
  `sent`. Its lease then lapses and a later tick sends that message again.
- A single transport call outlives its own 5-minute lease.

SES accepts no idempotency key.

## Configuration (all fail closed)

| Setting                           | Needed by | Notes                                                                                                                                                             |
| --------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `WEEK_PASS_WELCOME_EMAIL_ENABLED` | welcome   | default off; `CRON_EMAILS_ENABLED` does not affect it                                                                                                             |
| `WEEK_PASS_EXPIRED_EMAIL_ENABLED` | offer     | default off                                                                                                                                                       |
| `WEEK_PASS_EMAILS_ACTIVE_FROM`    | both      | ISO instant with zone; no purchase or run before it is ever emailed                                                                                               |
| `MAIL_POSTAL_ADDRESS`             | both      | Runtime-only; deliberately not committed. The authoritative address has been identified, so all that is left is setting it at activation                          |
| `EMAIL_SUPPRESSION_IMPORTED_AT`   | both      | **Missing.** Set only after Sender and SES suppression history is imported into `email_suppressions`. Both emails honor opt-outs, so the welcome waits for it too |
| `WEEK_PASS_EMAILS_TIMEZONE`       | both      | default `America/Denver` (users have no time zone column)                                                                                                         |
| `WEEK_PASS_EMAIL_ASSET_BASE_URL`  | both      | default `https://studio2stadium.com/img/week-pass`; images not uploaded yet                                                                                       |

## REVIEW: wording added for the queued-pass variant

The approved welcome only covers a pass that starts at purchase. A pass
bought while access is running starts later, so "Your week starts now" would
be false for it. The proposed queued variant is:

- Headline: "Your next week / is lined up."
- Subhead: "Seven more days to explore your options, starting when your
  current access ends."
- Date box: "Your pass starts: {start}" above "Your access ends: {end}".
- Intro: "Welcome to your S2S Week Pass! Your new seven days begin {start},
  right when your current access ends, so there’s no gap. Use them to …"

In both variants "Your access ends" shows the end of continuous access across
stacked passes, not the end of this pass alone.

## REVIEW: proposed subjects and previews (not approved)

| Email            | Subject                             | Preview                                                     |
| ---------------- | ----------------------------------- | ----------------------------------------------------------- |
| Welcome, current | Your S2S Week Pass starts now       | Seven days to explore your options and take your next step. |
| Welcome, queued  | Your next S2S Week Pass is lined up | Your next seven days start {start}.                         |
| Expired          | Your S2S Week Pass has ended        | Keep exploring. Unlock more with Premium.                   |

## Approved copy edits (Abbey, after reviewing the previews)

Applied in both emails, their plain-text versions and the tests:

1. **Five-program limit.** The limit is enforced on follows only
   (`app/modules/schools/follow/service.ts`), so:
   - welcome now says "use your five follows to keep track of programs that
     interest you";
   - the offer's benefit now says "Follow programs without the Week Pass’s
     five-program limit."

   Neither implies favorites are capped.

2. **Privacy line.** The heading "Your recruiting journey is personal." is
   kept. The body is now exactly "Other dancers can’t view your full
   recruiting profile." `GetDancerController` does block other Dancers from
   a Dancer's full profile. No permissions were changed.
3. **Plans.** The "MOST POPULAR" badge is removed. "Seasonal" is renamed
   "Season Pass", matching the code's plan name; its price ($69) and
   duration (/ 3 months) are unchanged. The design's tan outline on that row
   is kept as a plain highlight with no wording; `highlight: false` on that
   row removes it if it should go too.
4. **Em dashes removed.**
   - Welcome: "Look beyond familiar names. You might discover a team you
     hadn’t considered."
   - Offer: "Ready for more time to explore your options and more ways to
     take the next step?"

   The privacy body no longer has one. Curly apostrophes are kept as
   supplied.

## REVIEW: remaining copy and data flags

1. **"Seniors can use Common Recruit…"** is true but incomplete. The
   create-submission service allows `gradYear <= graduatingClass(now)`: this
   cycle's seniors and older graduates. Optional precision: "Eligible seniors
   and older graduates can use…".
2. **Prices.** $25/$69/$250 come from the design, not from Stripe (the repo
   only holds price IDs). Confirm they match the live Prices before
   activation.
3. **Footer reason lines and postal line** ("You're receiving this because…",
   "Studio 2 Stadium · {address}") were added for compliance. They are not in
   the design.

## Link targets (checked against the frontend routes)

| Link                  | URL                           | Route and guard                                                                                                                                                                                             |
| --------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build My Profile      | `SITE_URL/{username}`         | `/_app/(routes)/$username`: the Dancer's own profile (`access.self`)                                                                                                                                        |
| Explore Premium Plans | `SITE_URL/checkout`           | `/_app/(routes)/checkout`: "Choose Your Plan". Admits free and Week Pass Dancers; Premium members go on to `/feed`. Changed from `/settings/membership`, which only shows a "See plans" button leading here |
| Manage preferences    | `SITE_URL/settings/account`   | `/_app/(routes)/settings/account`: holds the Notifications switch                                                                                                                                           |
| Unsubscribe           | `API_URL/unsubscribe?token=…` | backend `GET /unsubscribe` (confirmation page, no write) and `POST /unsubscribe` (form submit and RFC 8058 one-click). No `/api` prefix                                                                     |

Every app link sits under `/_app`. A signed-out reader is sent to
`/login?redirect=…` and returned to the link after signing in.

Not verified here, and they depend on real clients or production:

- `SITE_URL` and `API_URL` hold their production values and are reachable.
- Mailbox providers (Gmail, Yahoo, Apple) actually POST the one-click
  unsubscribe and honor it.
- Existing behavior, unchanged here: the unsubscribe confirmation page
  says it stops "billing notices", but billing emails such as payment-failed
  ignore `users.notifications`.
- Profile links follow a username. Signup's username blacklist
  (`app/modules/auth/signup/validator.ts`) blocks most top-level routes
  ("settings", "checkout", "feed", "events" and others) but not "tracker",
  "recruiting", "dancers" or "recommended". A Dancer holding one of those
  usernames would land on that page instead of their profile. This is an
  existing app-wide gap and was not changed here.

## Visual treatment

- **Logo.** The wordmark is the app's genuine `MainLogo` vector rendered as
  an image (white letters, tan "2" unchanged), never set as text. Its alt
  text reads "Studio 2 Stadium" on black when images are blocked.
- **Hero.** The design's court-floor artwork sits behind the live
  headline, with every baked-in text area masked to black. It is a CSS
  background with a VML fallback for Outlook and a solid black fallback.
- **Out of scope, flagged.** Several existing emails (`PremiumWelcomeEmail`,
  `DancerWelcomeEmail`, `ForgotPasswordEmail`, `ProfileViewedEmail`,
  `SchoolJoinedEmail`, `SchoolWelcomeEmail`) still set the wordmark as
  text. They were left untouched here.

## REVIEW: classification and opt-outs

- The offer is promotional. The welcome is treated as relationship/onboarding
  mail, not transactional, so it honors the same opt-outs. Both:
  - honor `users.notifications`;
  - honor `email_suppressions`;
  - carry `List-Unsubscribe` and `List-Unsubscribe-Post: One-Click` headers;
  - include the postal address.
- They reuse the existing signed unsubscribe link (`/unsubscribe`, purpose
  `prospect-email-unsubscribe`). That link turns off **all** notification
  email (`users.notifications = false`), which is the only preference the app
  has. No preference behavior was changed.
- "Manage preferences" links to `/settings/account`, where that switch lives.
- The business postal address has been identified. It stays out of the
  repository and is set as `MAIL_POSTAL_ADDRESS` at activation; the emails
  fail closed until then.
- Not established from the repo, and so blocking activation:
  - any Sender suppression or removal history (Sender is not referenced
    anywhere in the code);
  - whether SES account-level suppression is enabled;
  - SES production access and sending limits;
  - consent records beyond `users.notifications`.

## Review-only activation steps (do not run as part of this change)

1. Review and approve or replace every REVIEW item above.
2. Apply migration `20261116180420_week_pass_emails`. It adds two new tables
   and doesn't touch existing ones. Fly runs it on deploy.
3. Upload `packages/emails/assets/week-pass/*.{png,jpg}` to `/img/week-pass/` and
   check they load from a mail client.
4. Import the Sender and SES suppression history into `email_suppressions`,
   then set `EMAIL_SUPPRESSION_IMPORTED_AT`.
5. Set `MAIL_POSTAL_ADDRESS` to the identified address and
   `WEEK_PASS_EMAILS_ACTIVE_FROM` to an instant at or after the switch-on
   time.
6. Run `node ace week-pass-emails:dry-run`. It reports, writes nothing and
   sends nothing.
7. Turn on one switch at a time and watch `week_pass_emails` statuses.
