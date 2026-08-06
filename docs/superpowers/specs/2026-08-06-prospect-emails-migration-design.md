# Prospect Emails Migration — Design

**Date:** 2026-08-06
**Status:** Approved, pending implementation plan

Migrate the two coach-facing prospect emails off AWS Lambda + EventBridge Scheduler and into the AdonisJS app's in-process cron.

## Background

Two EventBridge schedules invoke two Lambdas:

| Schedule | Lambda | Target |
|---|---|---|
| `sendProspectReminder` | `sendProspectEmailReminderMonthly` | `POST studio2stadium.com/api/trpc/crv.sendProspectReminderEmails` |
| `sendProspectStatusJanuary2nd` | `sendProspectStatusJanuary` | `POST studio2stadium.com/api/trpc/crv.sendCrvSubmissionEmails` |

Each Lambda is a ~40-line `https.request` shim with a hardcoded `Authorization: s2s` header.

### Both emails are currently dead

The shims POST to `studio2stadium.com`, but the API now lives at `api.studio2stadium.com` — the apex serves the frontend. Every invocation 404s.

The failure is silent for three compounding reasons:

1. The shim resolves its promise on any HTTP status; it only rejects on network error. A 404 is reported to EventBridge as success.
2. The Lambdas have no CloudWatch log group, so response bodies were never recorded.
3. EventBridge shows the invocations succeeding.

`sendProspectEmailReminderMonthly` has fired monthly into the void (confirmed via CloudWatch `Invocations`: 2026-05-31, 06-30, 07-31).

### The September send never existed

The owner's intent is two digest sends per year, September and January. Only the January one was ever created in EventBridge, and it was a one-time `at(2026-01-02T00:00:00)` schedule that has already fired and will never fire again. September has never sent.

This is corroborated by the reminder cron expression `cron(0 0 1 10,11,12,2,3,4,5,6,7,8 ? *)`, which skips exactly months 1 and 9 — in January and September, schools are meant to receive the digest instead of the reminder. The two jobs interlock.

### The early/new split never worked

`sendCrvSubmissionEmails` split a school's submissions on `cutoffDate = new Date("2026-01-02T00:00:00Z")`:

- `createdAt >= cutoff` → rendered under **"Your New Submissions:"**
- `createdAt < cutoff` → rendered under **"Early Submissions:"**

The schedule fired at `2026-01-02T00:00:00` America/Denver = `07:00Z`. So "New" could only ever contain submissions created in a 7-hour window, and in practice rendered "No submissions yet" while everything fell into "Early".

Per the owner, the intended boundary is **August 1**, not January 2. This design fixes the rule rather than porting the bug.

## Target design

Two jobs registered in `apps/backend/start/cron.ts`, each delegating to a service in `apps/backend/services/`.

### Concurrency

`#start/cron` is preloaded for the `web` environment (`adonisrc.ts:97-100`), so it runs on every machine. The app runs 2 Fly machines (`min_machines_running = 2`, `auto_stop_machines = 'off'`). Without coordination each job fires twice and every school receives duplicate mail.

Each job body is wrapped in a Postgres advisory lock (`pg_advisory_lock` / `pg_advisory_unlock`, one distinct key per job). The first machine to acquire runs; the other observes the lock is held and returns without sending. This matches the existing house idiom at `app/modules/videos/add-youtube-video/service.ts:78`.

The existing jobs in `start/cron.ts` are left alone. They are separately affected by the same duplicate-fire issue, but fixing them is out of scope.

### Job A — Prospect Reminder

- **Schedule:** `0 0 1 10,11,12,2,3,4,5,6,7,8 *`, timezone `America/Denver`. Unchanged from current behavior. The `cron` package takes a `timeZone` option; the existing `new CronJob(expr, fn).start()` calls do not pass one, so this must be added explicitly.
- **Recipients:** schools having at least one `crvSubmissions` row with `status IN ('pending', 'in_review')`, whose owning user has `notifications = true`.
- **Body:** static. No per-school data. New `ProspectReminderEmail` template in `packages/emails`, ported from the old `ProspectEmailReminder` HTML constant.
- **Subject:** `Quick Reminder: Update Your Prospect Statuses`

### Job B — Submissions Digest

- **Schedule:** two `CronJob` registrations calling one service — `0 9 1 9 *` (Sept 1) and `0 9 2 1 *` (Jan 2), both timezone `America/Denver`.
- **Recipients:** same rule as Job A.
- **Cutoff:** the most recent August 1 at or before the run date, in `America/Denver`.
  - Sept 1 2026 run → cutoff Aug 1 2026
  - Jan 2 2027 run → cutoff Aug 1 2026
- **Buckets:** `early = createdAt < cutoff`, `new = createdAt >= cutoff`. Both populate under this rule for both send dates.
- **Body:** new `ProspectSubmissionsDigestEmail` template in `packages/emails`, listing each bucket with links to the dancer profiles.
- **Subject:** `Your Studio 2 Stadium Recruiting Submissions`

**Naming constraint:** the template must NOT be called `ProspectStatusEmail`. That name is already taken by a live, dancer-facing transactional email (`packages/emails/src/templates/ProspectStatusEmail.tsx`), sent when a school changes a dancer's status (`app/modules/schools/update-submission/event.ts:50`). It is unrelated to this digest.

## Schema mapping

The old stack had a separate `prospectStatus` table joined to `crvSubmission`. The new schema folds status onto the submission row.

| Old | New |
|---|---|
| `prospectStatus.prospectStatus = 'NONE'` | `crvSubmissions.status = 'pending'` |
| `prospectStatus.prospectStatus = 'IN_REVIEW'` | `crvSubmissions.status = 'in_review'` |
| `school.schoolName` | `schoolProfiles.name` |
| `school.user.email` | `users.email` via `schoolProfiles.userId` |
| `crvSubmission.createdAt` | `crvSubmissions.createdAt` (from the `timestamps` helper) |

`crvSubmissions` and `crvVideos` are live in `app/database/schema/crv.ts` and already used by `app/modules/dancers/common-recruiting/*`. The `prospect_status` enum is `["pending", "released", "in_review", "accepted"]`.

Targeting therefore becomes `status IN ('pending', 'in_review')`.

## Safety

`studio2stadium-dev` is production despite its name — it holds the `api.studio2stadium.com` certificate and is the only backend app. There is no staging environment. Any cron added here sends to real coaches on first deploy.

The old newsletter code had a hardcoded dev guard restricting sends to a single address; the two prospect emails had no guard at all. Three mechanisms replace that:

1. **Ace command with `--dry-run`.** Each job's logic lives in a service callable both from cron and from a new command in `apps/backend/commands/`, following the `sweep:blog-orphans` pattern (`BaseCommand`, `flags.boolean`, `startApp: true`). `--dry-run` resolves recipients and renders the email but sends nothing, logging the recipient list and rendered output.
2. **`CRON_EMAILS_ENABLED` kill switch.** New boolean in `start/env.ts`, **defaulting to off**. Both jobs check it before sending. Code can ship and be verified against production data before any mail leaves.
3. **Verified manual run first.** The first real send is performed via the ace command, not by waiting for a cron tick.

## Opt-out

The old emails set `List-Unsubscribe` and `List-Unsubscribe-Post` headers pointing at `/api/unsubscribe?token=<userId>`. The new app has no such route, so those headers currently have nowhere to point.

Scope includes:

- A new unsubscribe route that flips `users.notifications` to `false` for the token's user.
- Both emails setting `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058).
- Both recipient queries filtering on `users.notifications = true`.

The token must not be the bare `users.id` as the old implementation used — that lets anyone unsubscribe anyone by guessing a UUID. Use a signed value.

## Teardown

After a verified live send from the new system:

- Delete Lambda `sendProspectEmailReminderMonthly` and schedule `sendProspectReminder`
- Delete Lambda `sendProspectStatusJanuary` and schedule `sendProspectStatusJanuary2nd`

The hardcoded `s2s` token disappears with the Lambdas; no rotation needed.

## Out of scope

- `send-weekly-report-to-schools` and `send-weekly-report-to-schools-third-sundays` (→ `sendSchoolWeeklyNewsletter`). These are the same dead-shim pattern hitting `crv`-adjacent tRPC route `weeklyNewsletter.sendSchoolNewsletter`, and are equally broken, but they are a separate migration.
- `send-weekly-subscription-reminder-to-students` (already `DISABLED`).
- `test-school-schedule`, `test-weekly-reminder`.
- Fixing duplicate-fire on the four pre-existing jobs in `start/cron.ts`.
- Porting the old `2026-01-02` cutoff behavior.

## Risks

- **Cron requires a running machine.** `auto_stop_machines` is currently `'off'` with `min_machines_running = 2`, so ticks land. If autostop is ever enabled and the app scales to zero, a tick is missed silently with no retry — a property the external EventBridge trigger did provide. This is the main tradeoff accepted by moving in-process.
- **September deadline.** Sept 1 is roughly 3.5 weeks after this design. Its first-ever automated send must be dry-run well before then.
- **Advisory lock and job duration.** If a job outruns its next scheduled tick the lock prevents overlap, but the skipped tick is not retried. Acceptable for monthly/annual cadence.
