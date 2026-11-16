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

Every setting is runtime-only. The token and the postal address are secrets
or private and must never be committed; set them with `fly secrets set`.

| Setting                           | Needed by | Notes                                                                                                                      |
| --------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `WEEK_PASS_WELCOME_EMAIL_ENABLED` | welcome   | Default off. `CRON_EMAILS_ENABLED` does not affect it                                                                      |
| `WEEK_PASS_EXPIRED_EMAIL_ENABLED` | offer     | Default off. Stays off: its images are not hosted                                                                          |
| `WEEK_PASS_EMAILS_ACTIVE_FROM`    | both      | ISO instant with zone. No purchase or run before it is ever emailed                                                        |
| `MAIL_POSTAL_ADDRESS`             | both      | The authoritative address is identified; only setting it remains                                                           |
| `EMAIL_SUPPRESSION_IMPORTED_AT`   | both      | Set by a person once the Sender and SES history is imported. The import command never sets it                              |
| `SENDER_API_TOKEN`                | both      | Secret. Used only for the read-only send-time Sender check below                                                           |
| `WEEK_PASS_EMAIL_ASSETS`          | both      | JSON object, image file name to https URL. Takes precedence over the base URL for the images it names                      |
| `WEEK_PASS_EMAIL_ASSET_BASE_URL`  | both      | Optional explicit base. The built-in default (`studio2stadium.com/img/week-pass`) hosts nothing and never counts as hosted |
| `WEEK_PASS_EMAILS_TIMEZONE`       | both      | Default `America/Denver` (users have no time zone column)                                                                  |
| `WEEK_PASS_SAMPLE_RECIPIENT`      | samples   | The one internal mailbox the sample command may send to                                                                    |

An email activates only when its switch is on and nothing it needs is
missing:

- the welcome needs `logo-wordmark-white.png`, `hero-welcome.jpg`,
  `icon-calendar.png` and `icon-shield.png` hosted;
- the offer needs the logo plus `hero-expired.jpg`, `icon-radar.png`,
  `icon-upload.png` and `icon-gears.png`.

`node ace week-pass-emails:dry-run` lists every missing item by name.

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

## Subjects (approved) and previews

| Email            | Subject                                        | Preview                                                     |
| ---------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Welcome, current | Your S2S Week Pass starts now (approved)       | Seven days to explore your options and take your next step. |
| Welcome, queued  | Your next S2S Week Pass is lined up (approved) | Your next seven days start {start}.                         |
| Expired          | Your S2S Week Pass has ended                   | Keep exploring. Unlock more with Premium.                   |

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

## Classification and opt-outs

- The offer is promotional. The welcome is relationship/onboarding mail, not
  transactional, so it honors the same opt-outs.
- On every send attempt both emails, in order:
  1. skip a missing user, a blank address or `users.notifications = false`;
  2. skip an address in `email_suppressions`, from any source;
  3. ask Sender (below).
- Both carry `List-Unsubscribe` and `List-Unsubscribe-Post: One-Click`
  headers and the postal address.
- They reuse the existing signed unsubscribe link (`/unsubscribe`). It turns
  off **all** notification email (`users.notifications = false`), the only
  preference the app has. "Manage preferences" links to `/settings/account`.
- SES's own account-level suppression (bounces and complaints) is enabled
  and still applies at send time, on top of the imported list.

## Send-time Sender check

`app/shared/email-suppressions/sender-check.ts`: one read-only
`GET https://api.sender.net/v2/subscribers/{encoded address}` with the
Bearer token, on every attempt, after the app's own checks pass. It has a
5-second timeout and caches nothing. Every request sends the fixed
User-Agent `Mozilla/5.0 (compatible; Studio2StadiumBackend/1.0; +https://studio2stadium.com)`,
because Sender's bot filtering refused a Python default agent with a 403
page. Only a full browser agent has been verified against the real API so
far. Before activation, confirm one real GET with this agent returns JSON
(200 or the documented 404); if it gets a 403 page instead, the check fails
closed and nothing sends.

| Sender says                                                                                                                                                             | Result                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `data.status.email` is `active` (address must match, case-insensitively)                                                                                                | Continue; the app's own consent has already passed                                                         |
| Any other status (`unsubscribed`, `bounced`, `spam_reported`, …)                                                                                                        | Suppressed, reason `sender_<status>`                                                                       |
| HTTP 404 with JSON body exactly `{"success": false, "message": "subscriber not found"}` (Sender's documented, observed not-found answer)                                | Not in Sender (normal for a new purchaser); the app's consent decides                                      |
| No token, 401, 403, 429, 5xx, redirect, timeout, network error, non-JSON or unexpected body, another address, any other 404 (HTML, other JSON, malformed or empty body) | No answer: not sent. The row retries with backoff (2, 4, 8, 16 minutes) and ends `failed` after 5 attempts |

It never adds, updates or re-subscribes anyone in Sender. Errors record only
the HTTP status or failure kind, never the token or the address.

A per-recipient check covers opt-outs made in Sender up to the moment of
sending, so no webhook is added. A webhook would only be needed to mirror
Sender into the local table for other mail. If that is ever wanted, the
minimal form is a signed endpoint that only inserts `email_suppressions`
rows (source `sender`), rejects unsigned or stale calls, and never removes
rows.

## Importing suppression history

`node ace email-suppressions:import <sender|ses|removals> <file> [--apply]`

- **Inputs:**
  - Sender JSON array (`status.email` gives the reason; `spam_reported`
    becomes `complained`);
  - SES JSON array or the AWS CLI wrapper (`BOUNCE` becomes `bounced`,
    `COMPLAINT` becomes `complained`);
  - a private one-address-per-line removals file (reason
    `removal_requested`).
- **Location:** files must be outside the project, so real addresses are
  never committed or deployed.
- **Validation:** the whole file is validated first. One bad entry, of any
  kind, stops the import before anything is written.
- **Dry run by default.** `--apply` writes everything in one transaction or
  nothing.
- **Never deletes.** Each source keeps its own row per address, a re-run is
  a no-op, and an older statement never overwrites a newer one.
- **Output:** counts only, never addresses. It does not set
  `EMAIL_SUPPRESSION_IMPORTED_AT`.

## Internal samples

`node ace week-pass-emails:send-sample <mailbox> [--variant current|queued|both] [--out dir] [--send]`

- **Fake data only:** "Sample", the `sample-dancer` username, and dates from
  now. No customer lookup, no database reads or writes, and no welcome
  recorded as owed.
- **Real configuration:** links, postal address and images come from the
  running config, so the sample matches what a customer would get.
- **Preview by default:** prints recipient, sender, subjects, dates, links,
  every image URL and the switch states. `--out` writes HTML and text
  outside the project.
- **`--send` is refused unless:**
  - `<mailbox>` is exactly one address equal to
    `WEEK_PASS_SAMPLE_RECIPIENT`;
  - the postal address is set;
  - every welcome image has a hosted URL.
- **Marking:** each sample carries an `X-S2S-Internal-Sample` header.
- **Unlike customer sends:** it does not call Sender, does not need or
  change the switches, and records nothing. The unsubscribe link in a sample
  is signed for a user id that matches no account, so using it changes
  nothing.

## Images without hosting: CID embedding (analysis only, not built)

Attaching the images to each message and referencing them as `cid:` is
possible with Adonis Mail (`embedImage`), but it is a poor fit here:

- **Hero background:** CSS `background-image` and VML do not reliably
  resolve `cid:` URLs (Gmail and Outlook in particular), so the hero would
  fall back to plain black.
- **Clients:** some show embedded images as attachments (paper clip, or
  files at the bottom), and Gmail on the web handles `cid:` inline images
  inconsistently.
- **Size:** every message grows by the image bytes (the welcome's four are
  about 45 KB raw, about 60 KB base64), against no cost for hosted images.
- **Deliverability and privacy:** image-heavy MIME is scored somewhat worse;
  the only upside is that nothing loads remotely.
- **Testing:** the rendered HTML would differ from the approved previews and
  need its own real-client pass.

Hosted images (now on Sender's CDN) remain the right path. CID would be a
deliberate design change, not a silent swap.

## Review-only activation steps (do not run as part of this change)

Welcome only; the offer stays off.

1. Merge and deploy. Migration `20261116223536_week_pass_emails` adds two
   new tables only. With both switches off nothing new runs.
2. Import suppression history with `email-suppressions:import`: Sender and
   SES (and any removals), dry run first, then `--apply`. Then set
   `EMAIL_SUPPRESSION_IMPORTED_AT`.
3. Set the secrets:
   - `SENDER_API_TOKEN`;
   - `MAIL_POSTAL_ADDRESS`;
   - `WEEK_PASS_EMAIL_ASSETS`, with the four hosted welcome images;
   - `WEEK_PASS_SAMPLE_RECIPIENT`.
4. Preview with `week-pass-emails:send-sample <mailbox>`, then send the two
   approved samples with `--send` and check them in real clients.
5. Run `week-pass-emails:dry-run`. The welcome should list no problems.
6. Set `WEEK_PASS_EMAILS_ACTIVE_FROM` to the switch-on instant and
   `WEEK_PASS_WELCOME_EMAIL_ENABLED=true`. Leave
   `WEEK_PASS_EXPIRED_EMAIL_ENABLED` unset.
7. Watch `week_pass_emails` statuses. To stop, unset the welcome switch.

In local runs these commands (like the existing `send:prospect-emails`)
print their final line and then keep the process open. Stop them with
Ctrl-C once the last line appears. An `--apply` import prints "Applied" only
after its transaction has committed. Check the same behavior once in
production before relying on it.
