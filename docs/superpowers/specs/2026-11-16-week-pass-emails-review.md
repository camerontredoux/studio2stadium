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

Delivery is at least once per row, not exactly once. A worker that dies after
SES accepts a message but before the row is marked `sent` leaves a 5-minute
lease, and a later tick sends that message again. SES's own retry and
acceptance behavior adds no idempotency key.

## Configuration (all fail closed)

| Setting | Needed by | Notes |
| --- | --- | --- |
| `WEEK_PASS_WELCOME_EMAIL_ENABLED` | welcome | default off; `CRON_EMAILS_ENABLED` does not affect it |
| `WEEK_PASS_EXPIRED_EMAIL_ENABLED` | offer | default off |
| `WEEK_PASS_EMAILS_ACTIVE_FROM` | both | ISO instant with zone; no purchase or run before it is ever emailed |
| `MAIL_POSTAL_ADDRESS` | both | **Missing from the repo. Not invented.** |
| `EMAIL_SUPPRESSION_IMPORTED_AT` | offer | **Missing.** Set only after Sender and SES suppression history is imported into `email_suppressions` |
| `WEEK_PASS_EMAILS_TIMEZONE` | both | default `America/Denver` (users have no time zone column) |
| `WEEK_PASS_EMAIL_ASSET_BASE_URL` | both | default `https://studio2stadium.com/img/week-pass`; images not uploaded yet |

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

| Email | Subject | Preview |
| --- | --- | --- |
| Welcome, current | Your S2S Week Pass starts now | Seven days to explore your options and take your next step. |
| Welcome, queued | Your next S2S Week Pass is lined up | Your next seven days start {start}. |
| Expired | Your S2S Week Pass has ended | Keep exploring. Unlock more with Premium. |

## REVIEW: copy accuracy flags (copy left as supplied)

1. **"Seniors can use Common Recruit…"** is true but incomplete. The
   create-submission service allows `gradYear <= graduatingClass(now)`: this
   cycle's seniors and older graduates. Optional precision: "Eligible seniors
   and older graduates can use…".
2. **"Your profile is visible to verified college coaches—not other
   dancers."** `GetDancerController` blocks other Dancers, but it also allows
   admins and any `school`-type account. It does not check that a school
   account is `verified`. Other surfaces (Org rosters, explore lists) were not
   audited. Treat the absolute promise as unverified. Permissions were not
   changed.
3. **Prices and plan names.** $25/$69/$250 and the "Monthly / Seasonal /
   Annual" labels come from the design, not from Stripe (the repo only holds
   price IDs). The code calls the 3-month plan "Season Pass". Confirm the live
   prices and label. "MOST POPULAR" is a factual claim that needs data behind
   it.
4. **Five-program limit wording.** `PASS_PROGRAM_LIMIT = 5` is enforced
   only on **follows** (`app/modules/schools/follow/service.ts`); no code
   limits a Week Pass holder's **favorites**. So two lines overstate it:
   - welcome: "use your five follows and favorites";
   - offer: "Follow and favorite programs without the Week Pass’s
     five-program limit".

   Either the copy narrows to follows or the product adds the favorites
   limit. Not changed here.
5. **Punctuation.** Em dashes and curly apostrophes are kept as supplied.
   Cleanup to the house style is a separate decision.
6. **Footer reason lines and postal line** ("You're receiving this because…",
   "Studio 2 Stadium · {address}") were added for compliance. They are not in
   the design.

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
- Not established from the repo, and so blocking activation:
  - the business postal address;
  - any Sender suppression or removal history (Sender is not referenced
    anywhere in the code);
  - whether SES account-level suppression is enabled;
  - SES production access and sending limits;
  - consent records beyond `users.notifications`.

## Review-only activation steps (do not run as part of this change)

1. Review and approve or replace every REVIEW item above.
2. Apply migration `20261116180420_week_pass_emails`. It adds two new tables
   and doesn't touch existing ones. Fly runs it on deploy.
3. Upload `packages/emails/assets/week-pass/*.png` to `/img/week-pass/` and
   check they load from a mail client.
4. Import the Sender and SES suppression history into `email_suppressions`,
   then set `EMAIL_SUPPRESSION_IMPORTED_AT`.
5. Set `MAIL_POSTAL_ADDRESS` to the authoritative address and
   `WEEK_PASS_EMAILS_ACTIVE_FROM` to an instant at or after the switch-on
   time.
6. Run `node ace week-pass-emails:dry-run`. It reports, writes nothing and
   sends nothing.
7. Turn on one switch at a time and watch `week_pass_emails` statuses.
