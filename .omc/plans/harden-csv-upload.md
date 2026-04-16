# Harden CSV Upload Process

**Branch:** `plan/summit-04-coach-scouting` (current worktree)
**Date:** 2026-04-16
**Style:** Break-fast-iterate — five thin PRs, each independently shippable.

---

## Problem

Three symptoms reported, one shared cause (loose validation + non-atomic commits + drifting count sources) plus two adjacent gaps (no school-activation flow, dialog UI inconsistent with new dashboard):

| # | Symptom | Real cause |
|---|---|---|
| 1 | Dancer CSV accepts school emails | Account-type check (`upload-dancers/service.ts:85-115`) only rejects emails that **already** have a school profile. Brand-new emails pass through with no guard. |
| 2 | School CSV accepts dancer emails | Coach upload (`upload-coaches/service.ts:15-172`) has **zero** account-type validation. Asymmetric with dancer flow. |
| 3 | Dashboard says "2 dancers", roster shows "1" | Three independent count sources: `eventRosters COUNT`, `eventRosters SELECT` (paginated/filterable), `csvUploads.rowsAdded` (updated post-insert). Non-atomic commit + optimistic `rowsAdded` bump = drift. |
| 4 | School sign-up doesn't auto-link to events (new) | `registerDancer` already has link-on-signup (`register-dancer/service.ts:89-108`). No equivalent for schools. Rows stay `userId = NULL` forever. |
| 5 | Dialog looks inconsistent with new dashboard (new) | `csv-upload-dialog.tsx` predates `admin-sidebar` + `DataGrid` + `RosterPageHeader` aesthetic. |

---

## Decisions (locked in interview)

1. **Role-first-wins validation** — if an email already exists in `users` with any role, it must match the CSV's declared role; else reject. New emails trusted.
2. **All-or-nothing commit + mandatory preview** — commit endpoint only accepts if `preview.errorCount === 0`. Single transaction. Partial commits deleted.
3. **`schoolInvites` table, token-linked** — mirror `dancerInvites`. CSV upload mints rows, emails signed link, consumption creates user + bulk-links roster.
4. **Unified count source** — dashboard, roster list, audit metadata all read the same query result (driven by atomic commit semantics).
5. **Impeccable critique pass** — dialog must match `admin-sidebar.tsx` + `DataGrid` + `RosterPageHeader` language.
6. **Activation is derived from `eventRosters.userId`** — see glossary below.

---

## Activation semantics (glossary — used consistently across all steps)

A roster row is always in one of two states, derived purely from `eventRosters.userId`:

| State | Condition | Meaning |
|---|---|---|
| **Pending** | `eventRosters.userId IS NULL` | Uploaded, awaiting the person to claim (via token, organic signup, or admin merge). |
| **Activated** | `eventRosters.userId IS NOT NULL` | Person has an S2S account AND that account is linked to this event. |

**Activation transitions** (one per upload/signup path):

```
  Path A — email already had account at upload   →  created directly as ACTIVATED
  Path B — invite token consumed                 →  Pending → Activated (bulk-link in tx)
  Path C — organic signup, same email, verified  →  Pending → Activated (on verify hook)
  Path D — organic signup, different email       →  Pending → Activated (on claim banner click)
  Admin merge via reconciliation UI              →  Pending → Activated (audit-logged)
```

**Bookkeeping vs truth:**

- `dancerInvites.consumedAt` / `schoolInvites.consumedAt` = **bookkeeping only**. Tracks "was this specific token used" for one-shot enforcement + audit. NOT the source of truth for activation.
- `users` row = "has an account globally" — separate from per-event activation.
- Every UI/stat/query that says "activated" MUST derive from `eventRosters.userId IS NOT NULL`.

**Unambiguous UX copy:**
- "Uploaded" = total eventRosters rows (activated + pending).
- "Activated" = rows where userId is set.
- "Pending" = rows where userId is null.
- Never say "registered" or "signed up" in upload-dashboard copy — use the three words above.

---

## Target architecture

```
   CSV UPLOAD
      │
      ▼
  [ FRONTEND: csv-upload-dialog ]
      │  1. POST /preview  (dry-run, server validates, returns plan)
      │                    ──────────────────────────────┐
      │  2. if errorCount > 0 → BLOCK "Commit" button   │
      │  3. else → POST /commit  (all-or-nothing tx)    │
      ▼                                                  ▼
  [ BACKEND: upload-preview/service ] ← unified validator →
      │                                                  │
      ├── parseCsv()                                     │
      ├── roleGuard(email → existing role)  ◄── NEW     │
      │      ├── dancer CSV: reject if user.type='school'│
      │      └── coach CSV:  reject if user.type='dancer'│
      ├── bibCollision()                                 │
      ├── duplicateInFile()                              │
      └── returns { rows[], errors[], willInsert, willUpdate }
                                                         │
                                                         ▼
  [ BACKEND: commit (atomic tx) ]
      ├── reject if preview-hash stale or errors>0
      ├── INSERT eventRosters (bulk)         ──────┐
      ├── INSERT csvUploads (final counts)         │  ONE TX
      ├── INSERT orgMemberships (matched schools)  │
      ├── INSERT schoolInvites (unmatched schools) │
      └── audit.flush()                            ┘
                                                         │
              user clicks invite email link              │
                          │                              │
                          ▼                              │
              [ /register/school?t=… ]                   │
                          │                              │
      ┌───────────────────┴──────────────────┐           │
      │ consume token → create user(type='school')       │
      │              → create schoolProfile              │
      │              → UPDATE eventRosters SET userId    │
      │              → INSERT orgMemberships             │
      │              → mark consumedAt                   │
      └──────────────────────────────────────┘           │
                                                         │
   STATS (single source)                                 │
      adminQueries.stats()  ──────────────────────────────
      rosterQueries.list()
      csvUploads.rowsAdded === COUNT(eventRosters ΔeventId)  ← invariant
```

---

## Implementation steps

### Step 0 — Error surface hotfix + audit FK root-cause  *(ships today, standalone)*

**Goal:** Stop losing error detail on FK violations and fix the actual FK that's currently failing on first upload to a new event.

**Bug observed:** Uploading a dancer CSV to a brand-new event returns only "Foreign Key Violation" with no column/constraint info. User is blocked.

**Root cause (error surface):** `apps/backend/app/database/service.ts:56-57` —
```ts
case "23503":
  throw new RuntimeException("Foreign key violation");
```
Unique violations (~line 50) extract Postgres `detail` field. FK handler silently drops it.

**Suspected structural cause:** `eventAuditLog.parentId` self-reference in the audit flush path. When the CSV upload audit collector writes the parent + per-row children in one flush, write-ordering (or a stale/generated `parentId` uuid that never gets inserted as a row) can trigger FK `23503` on `parentId → eventAuditLog.id`. See `apps/backend/app/database/audit.ts` `AuditCollector.flush()`.

**Changes:**

- `apps/backend/app/database/service.ts` FK handler — extract detail the same way unique-violation handler does:
  ```ts
  case "23503": {
    const detail = (cause as { detail?: string; constraint?: string }).detail ?? "";
    const constraint = (cause as { constraint?: string }).constraint ?? "unknown";
    throw new RuntimeException(`FK violation on ${constraint}: ${detail}`);
  }
  ```
  And wire a user-friendly translation at the controller boundary so the dialog shows "This CSV references data that no longer exists (constraint: X). Please refresh and retry."
- Add a structured log line on every FK violation with `{ constraint, detail, userId, eventId, orgSlug, route }` so we can diagnose future occurrences.
- Reproduce the new-event FK failure locally against a fresh dev DB, identify the actual failing constraint (now that error surface is fixed), and patch the audit-write ordering. Expected fix sites:
  - `apps/backend/app/database/audit.ts` — ensure parent audit row is inserted (and id is known-real) before any child row inserts reference `parentId`.
  - Alternative: drop the self-referential FK on `eventAuditLog.parentId` and rely on application logic (migration).
- New integration test: upload a 2-row dancer CSV against a freshly-inserted event. Must succeed end-to-end with no FK errors.

**Acceptance:**
- Any future FK violation returns a message that names the constraint + referenced key.
- Uploading a dancer CSV (or coach CSV) to a brand-new event succeeds.
- Integration test covering the new-event + first-upload case is green.
- Rest of the plan (Steps 1–5) can proceed on a working upload surface.

---

### Step 1 — Symmetric role-first-wins validator  *(~1 PR)*

**Goal:** Both dancer and coach uploads reject cross-role emails at the preview stage.

**Changes:**

- `apps/backend/app/modules/orgs/events/upload-preview/service.ts`
  - Extract role-guard logic into a shared helper: `enforceEmailRole(db, emails, expectedRole)` returning `{ email, conflictingType }[]`.
  - Call helper for BOTH `dancer` and `coach` previews. Today only dancer path uses the school-account check (lines 65-89).
  - Coach path new check: reject email if `users.type === 'dancer'` (mirror).
- `apps/backend/app/modules/orgs/events/upload-dancers/service.ts` — swap the inline check (85-115) for `enforceEmailRole`.
- `apps/backend/app/modules/orgs/events/upload-coaches/service.ts` — add `enforceEmailRole` call in the service body. Currently has none.
- New unit tests in `apps/backend/tests/` covering:
  - dancer CSV with a known-school email → rejected with reason `cross-role`
  - coach CSV with a known-dancer email → rejected with reason `cross-role`
  - brand-new email in either CSV → passes (role trusted)

**Acceptance:**
- `POST /preview/dancers` returns `errors[].reason = "cross-role-school"` for every row whose email is already a `users.type='school'` account.
- `POST /preview/coaches` returns `errors[].reason = "cross-role-dancer"` for every row whose email is already a `users.type='dancer'` account.
- Existing tests still green.

---

### Step 2 — Mandatory-preview + atomic commit  *(~1 PR)*

**Goal:** Counts can never drift, because either every row is inserted or none are.

**Changes:**

- Backend commit endpoints (`upload-dancers` + `upload-coaches` services):
  - Accept a `previewToken` in the request body (short-lived hash of the parsed CSV + eventId).
  - Re-run `enforceEmailRole` server-side (defence in depth — never trust client preview).
  - Reject commit with `412 Precondition Failed` if `errorCount > 0`. Never partial-commit.
  - Wrap **all** writes (`eventRosters`, `csvUploads`, `orgMemberships`, `schoolInvites`) in a single `db.transaction()`. If any row write throws, roll back everything.
  - Remove the "insert csvUploads first with 0/0, then UPDATE later" pattern (service.ts lines 140-149 + 267-269). Do a single final INSERT with authoritative counts after `eventRosters` inserts succeed.
- Frontend `csv-upload-dialog.tsx`:
  - Preview call is now a hard gate. If `errors.length > 0`, disable "Commit" button and surface row-level errors in the preview table (per-row badge + tooltip reason).
  - Pass `previewToken` through to commit call.
- Delete the error-tolerance path in `upload-*/service.ts` that currently increments `rowsErrored` while still inserting other rows.

**Acceptance:**
- Any commit attempt with validation errors returns 412 and writes nothing.
- `SELECT COUNT(*) FROM event_rosters WHERE eventId = X` always equals `SUM(rowsAdded + rowsUpdated)` for that event's `csvUploads` rows. Invariant holds.
- Dashboard "Dancers" stat and paginated roster list show the same total when status filter is `all`.

---

### Step 3 — `schoolInvites` table + activation flow  *(~1 PR, schema migration)*

**Goal:** Every school added via CSV ends up linked to their event rosters, across four signup paths:

```
  Path A — email already has account          →  link immediately at upload time
  Path B — school clicks invite token link    →  token consumption links everything
  Path C — school signs up direct, SAME email →  opportunistic scan links on signup
  Path D — school signs up direct, DIFF email →  post-signup claim banner (exact org-name match)
  Truly weird — none of the above             →  admin reconciliation UI
```

**Changes — core schema + token flow:**

- `apps/backend/app/database/schema/schools.ts` — new table:
  ```ts
  export const schoolInvites = pg.pgTable("school_invites", {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull().references(() => orgEvents.id, { onDelete: "cascade" }),
    email: pg.text().notNull(),
    organization: pg.text(),
    token: pg.text().notNull().unique(),
    expiresAt: pg.timestamp({ withTimezone: true }).notNull(),
    consumedAt: pg.timestamp({ withTimezone: true }),
    createdAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }, (t) => [
    pg.uniqueIndex("school_invites_event_email").on(t.eventId, t.email),
  ]);
  ```
  Mirror how `dancerInvites` is defined.
- Drizzle migration generated via existing migration script.
- `upload-coaches/service.ts` — for every row whose email has no matching `users.type='school'`:
  - **UPSERT** `schoolInvites` row (on conflict: bump `expiresAt`, mint new `token`, null `consumedAt`). Prevents unique-index throws on CSV re-upload. Inside the same transaction.
  - Send email with link `{FRONTEND_URL}/register/school?t={token}`.
- `apps/backend/app/modules/auth/register-school/` — new module (mirror `register-dancer`):
  - `POST /auth/register/school` with `{ token, password, firstName, lastName, ...schoolProfileFields }`.
  - Validates token (exists, not expired, not consumed).
  - Within a transaction: `INSERT users (type='school', emailVerified=true)` → `INSERT schoolProfiles` → `UPDATE eventRosters SET userId = ... WHERE email = ... AND userId IS NULL` → `INSERT orgMemberships (type='coach', eventId=…)` → mark invite consumed.
  - Returns session cookie. **Token consumption counts as email verification** (the user proved control of the inbox by clicking).
- Frontend new route `/_onboarding/register-school.$token.tsx` — matches dancer token route. Pre-fills email + org from invite.

**Changes — path C (same-email organic signup) defences:**

- Existing `POST /auth/signup` when called for `type='school'`:
  - After user creation, scan `eventRosters WHERE email = ? AND userId IS NULL AND type = 'coach'` and link them opportunistically.
  - **Require `emailVerified = true` before linking.** If email-verification is async (sent as a confirmation link), defer the link step until the verification route is hit. Prevents impersonation (defence #4 from the tradeoff review).
  - Mark any unconsumed matching `schoolInvites` rows as consumed (prevents orphan-row noise + prevents a second token claim later).
- Extend the **role-first-wins** validator (Step 1's `enforceEmailRole`) to also consider pending invites:
  - dancer CSV: reject email if `schoolInvites` has unconsumed row for that email → reason `cross-role-pending-school`
  - coach CSV: reject email if `dancerInvites` has unconsumed row for that email → reason `cross-role-pending-dancer`
  - Prevents an email from being simultaneously invited to both sides.

**Changes — path D (different-email organic signup) claim banner:**

- Post-signup, on school dashboard (`apps/frontend/src/routes/_org/...` school landing): mount a `PendingClaimsBanner` component.
- New backend endpoint `GET /schools/me/pending-claims` returning:
  - Rows from `eventRosters WHERE type='coach' AND userId IS NULL AND organization = schoolProfiles.name` (exact case-insensitive match).
  - Plus `schoolInvites WHERE email != users.email AND organization = schoolProfiles.name AND consumedAt IS NULL`.
- Banner UI: "We found {N} event rosters that appear to belong to {schoolProfiles.name}. Review and claim." Lists each with event name + org name. Each row has Claim / Dismiss action.
- `POST /schools/me/pending-claims/{rosterId}/claim` → transaction: `UPDATE eventRosters SET userId = current_user.id` + `INSERT orgMemberships` + mark related invite consumed (if any).
- Dismiss action records a `dismissedAt` flag on the roster row OR a per-user "ignored-claims" record (small side table, TBD — simplest: add `suggested_claim_dismissals` table keyed by `(userId, rosterId)`).

**Changes — truly-weird admin reconciliation:**

- New admin route `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/reconciliation.tsx`.
- Surfaces two queues:
  1. **Unclaimed invites** — `schoolInvites WHERE consumedAt IS NULL AND expiresAt > now() OR expiresAt < now()` (sortable by age/expiry). Actions per row: **Resend invite**, **Revoke invite**.
  2. **Orphan roster rows** — `eventRosters WHERE type='coach' AND userId IS NULL AND email NOT IN (schoolInvites)` — shouldn't happen normally but catches data drift.
- Per row: admin can **manually merge** a pending roster row to any existing school user account. UI: search-select existing school users, confirm, commit. Writes `UPDATE eventRosters SET userId = X` + `INSERT orgMemberships` in a transaction + writes an audit event (`csv_upload_manual_merge`) for accountability.
- **Resend invite** — mints a fresh token, bumps expiry 14d, sends email. Available before or after expiry (closes defence #5 from the tradeoff review).

**Acceptance:**
- Path A: existing school + CSV upload → roster `userId` set, `orgMemberships` row created, zero invites minted.
- Path B: new email + CSV + token click → one invite consumed, user created, all matching roster rows linked, all in one transaction.
- Path C: new email + CSV + direct signup (same email) + email verified → opportunistic scan links rosters, pending invite marked consumed, no banner shown for those rosters.
- Path C with unverified email: no linking happens until verification.
- Path D: new email + CSV + direct signup (different email) → banner surfaces matching rosters by `schoolProfiles.name === eventRosters.organization`; Claim action links them.
- Truly weird: admin can resend or revoke any invite; admin can manually merge any orphan roster row into any school user from `/admin/reconciliation`.
- Re-uploading the same CSV row twice does NOT throw — second upload bumps expiry and resends.
- Invite is one-shot: second click on same token returns `410 Gone`.
- Invites expire after 14 days.
- Dancer CSV containing an email with pending coach invite is rejected at preview with `cross-role-pending-school`, and vice versa.

---

### Step 4 — Count-source consolidation + Activated/Pending split  *(~1 PR)*

**Goal:** Dashboard/roster/result dialog always agree; every stat and list explicitly distinguishes Activated vs Pending per the glossary.

**Changes — count consolidation:**

- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/uploads.tsx` — stop rendering per-row `create`/`update` audit entries as individual "uploads". Collapse them under the parent `csv_upload` audit entry (accordion / expandable row). One upload = one line in the feed.
- `apps/backend/app/database/audit.ts` — keep writing per-row events for drill-down, but the parent `csv_upload` event is the sole aggregate-count source of truth.
- Integration-test invariant: after any upload, `COUNT(eventRosters)` delta for that eventId === `csv_upload.metadata.rowsAdded + rowsUpdated`.
- Regression check: `EventStatsService.execute()` (`apps/backend/app/modules/orgs/events/stats/service.ts`) and `rosters/list/service.ts` must use the same eventId scope. Document this with an inline comment in both files.

**Changes — Activated/Pending split:**

- Extend `EventStatsService` to return `{ dancers: { activated, pending, total }, coaches: { activated, pending, total } }` instead of flat integers. `activated = COUNT(userId IS NOT NULL)`, `pending = COUNT(userId IS NULL)`.
- Frontend `adminQueries.stats()` consumers updated — dashboard card displays as "Dancers: 12 activated · 3 pending" (or a compact split badge). Same for coaches.
- Roster list page: rename status filter values from `{all, active, pending}` to `{all, activated, pending}` for copy consistency with the glossary. `active` stays in the API param for backward compat but UI copy is "Activated".
- Upload result dialog (`csv-upload-dialog.tsx` `ResultView`): show "Inserted N rows — X activated immediately, Y pending invite" using the same derivation (count of rows with userId set vs null in the inserted batch).
- `uploads.tsx` audit log metadata display: add activated/pending breakdown beneath the aggregate numbers.

**Acceptance:**
- Upload dialog result, dashboard stat card, roster list totals (with `status=all`), and audit log parent row show the same integer after any upload.
- Every UI surface that mentions dancer/coach counts also shows the Activated/Pending split, derived identically everywhere (query or computed from list — never divergent).
- Per-row audit entries are still recorded but rendered under collapse/expand.
- Integration test asserts the invariant between `eventRosters` counts and `csv_upload.metadata`.
- Snapshot / screenshot test covers the new split copy on dashboard, roster page, and upload dialog.

---

### Step 5 — Impeccable critique + UI polish on upload dialog  *(~1 PR)*

**Goal:** `csv-upload-dialog.tsx` visually + interaction-wise matches the new dashboard (`admin-sidebar.tsx`, `DataGrid`, `RosterPageHeader`, command-center landing).

**Changes:**

- Run the `impeccable:critique` skill against `csv-upload-dialog.tsx` + the new dashboard screens side-by-side to produce a scored gap report.
- Apply high-severity fixes from the critique. Expected targets:
  - Replace ad-hoc table in `PreviewView` (lines 370-481) with `DataGrid` primitive.
  - Typography: align headings + body to `RosterPageHeader`'s scale.
  - Error states: per-row error badges using the same `StatusBadge` component.
  - Empty / loading / error states pass `impeccable:harden`.
  - Color language: adopt dashboard's semantic tokens (no hand-rolled greys).
  - Preview table: show `willInsert` / `willUpdate` / `willReject` row-group headers.
- Run `impeccable:polish` as the final pass.
- After UI changes, run `react-doctor` to catch regressions.

**Acceptance:**
- Critique scorecard ≥ 85/100 across hierarchy / clarity / consistency.
- Manual smoke: upload a CSV with mixed errors; dialog visually matches `/_org/$orgSlug/admin` dashboard screenshots.
- No regressions in existing DataGrid / sidebar components.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Breaking existing csv upload flow for live users while landing all-or-nothing commit | Ship Step 1 + Step 2 together behind a short-lived server feature flag; flip after manual QA against staging with a real CSV. |
| `schoolInvites` email deliverability (new sender template) | Re-use existing `emails/` template pipeline; send to staging inbox first; verify SPF/DKIM against prod domain. |
| Invite token collision / replay | Use 32-byte cryptographic tokens + unique index; consumedAt guard; 14-day expiry. |
| Impeccable pass regresses accessibility | Run `impeccable:audit` after polish; keep a11y verdicts as a merge gate. |
| Preview-token staleness UX (user sits on preview, CSV changes in backend state before commit) | Short expiry (5 min) on previewToken; clear friendly error on stale commit: "CSV state changed, please re-preview." |
| Migration risk on `schoolInvites` table | Plain additive migration — no data rewrite; safe to roll forward, roll back is drop-table. |

---

## Verification (cross-cutting)

- `pnpm build` + `pnpm lint` clean on every step.
- New backend tests in steps 1, 2, 3 — integration tests hit a real DB per existing convention.
- Step 2 explicitly asserts the count invariant.
- Step 5 uses Impeccable critique scorecard as a quality gate.
- Manual smoke after each step: upload one clean CSV, one with mixed errors, one with a cross-role email, against the dev database.

---

## Out of scope (explicitly)

- Unifying `dancerInvites` + `schoolInvites` into a single `eventInvites` table (option D from interview — explicitly deferred).
- Domain/pattern-based email validation (`@*.edu` guards) — deferred.
- CSV template migration tooling (existing templates stay valid).
- Bulk admin resend UI for expired school invites (can be a follow-up; simple "request new link" CTA is shipped in step 3).

---

## File map (cited)

- `apps/backend/app/modules/orgs/events/upload-dancers/service.ts`
- `apps/backend/app/modules/orgs/events/upload-coaches/service.ts`
- `apps/backend/app/modules/orgs/events/upload-preview/service.ts`
- `apps/backend/app/modules/orgs/events/stats/service.ts`
- `apps/backend/app/modules/orgs/events/rosters/list/service.ts`
- `apps/backend/app/modules/orgs/register-dancer/service.ts` (reference pattern for step 3)
- `apps/backend/app/modules/auth/signup/service.ts` (extend for opportunistic school link)
- `apps/backend/app/database/schema/schools.ts` (new table here)
- `apps/backend/app/database/schema/org-events.ts` (read-only reference)
- `apps/backend/app/database/audit.ts`
- `apps/backend/app/shared/org/csv-parser.ts`
- `apps/frontend/src/features/org/components/csv-upload-dialog.tsx`
- `apps/frontend/src/features/org/components/roster-upload-row.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/uploads.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/dancers.tsx`
- `apps/frontend/src/features/org/api/roster-queries.ts`
- `apps/frontend/src/features/org/api/admin-queries.ts`
- `apps/frontend/src/features/org/lib/csv-schemas.ts`
- `apps/frontend/src/routes/_onboarding/` (new `register-school.$token.tsx`)
