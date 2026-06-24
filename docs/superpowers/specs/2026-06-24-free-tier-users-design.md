# Free-Tier Users — Design

> **Status:** Approved design, pre-implementation.
> **Worktree:** `worktree-org_events`.
> **Date:** 2026-06-24.
> **Related:** `2026-06-24-admin-staff-preview-rosters-design.md` (concurrent `is_staff` / view-as work — see Coordination).

## 1. Motivation

An org resold S2S as a paid "tack-on." They want their **paying** members to get the full S2S
experience (profile, premium grant, file video uploads) and their **non-paying** members to still
get an account, but heavily restricted. Today every roster upload provisions a full, premium-granted
paying account, so there is no way to express "give this person an account but not the full product."

This feature adds a per-org **"Free-tier Users"** toggle (set by S2S platform super-admins) that
introduces a required `paid` column to the dancer CSV upload and three tiers of access driven by a
single source of truth: the user's subscription **source**.

## 2. Source of truth: subscription `source`

`GetSubscriptionService` (`apps/backend/app/modules/subscriptions/get-status/service.ts`) already
distinguishes the access source and returns:

```ts
type SubscriptionSource = "stripe" | "org_event" | "none";
interface SubscriptionStatus {
  subscribed: boolean;          // source !== "none"
  source: SubscriptionSource;   // stripe (real sub) | org_event (grant) | none
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  grantedBy: string | null;
}
```

Stripe is checked first (active `user_subscriptions` row, `currentPeriodEnd > now`), then
`premium_grants` (`expiresAt > now AND revokedAt IS NULL`).

Combined with a new `users.limited` flag, this yields four tiers:

| Tier | Condition | Meaning |
|---|---|---|
| **stripe** | `source === "stripe"` | Real paying S2S subscriber |
| **org_event** | `source === "org_event"` | Org-granted premium (paid=true / event grant), no Stripe |
| **limited** | `source === "none" && users.limited` | Org free-tier account (paid=false) |
| **normal free** | `source === "none" && !users.limited` | Ordinary self-signup free S2S user (unchanged) |

## 3. State added

| # | Location | Change | Migration |
|---|---|---|---|
| 1 | `organizations.features.freeTierUsers` | New boolean key in the schema-less JSONB `features` blob | No |
| 2 | `eventRosters.paid` (`apps/backend/app/database/schema/org-events.ts`) | `pg.boolean().default(false)` — carries paid intent from upload → claim | Yes |
| 3 | `users.limited` (`apps/backend/app/database/schema/users.ts`) | `pg.boolean().notNull().default(false)` — restricted-account marker, set at org account creation | Yes |

`users` currently has no account-origin signal (no source/provisioned field), so a dedicated column
is warranted. We keep the chosen model: a real account + a `limited` flag (not a separate
`accountType`).

The profile endpoint additionally returns `subscriptionSource` and `limited` (computed, no migration).

## 4. Feature flag wiring

- **Admin UI:** add to `KNOWN_FEATURES` in
  `apps/frontend/src/features/admin/orgs/components/edit-org-dialog.tsx`:
  ```ts
  { key: "freeTierUsers", label: "Free-tier Users",
    description: "Require a `paid` column on dancer CSV uploads; unpaid dancers get a restricted account." }
  ```
  Toggling it `PATCH`es `/admin/orgs/{id}` with the merged `features` object (existing path; no backend change).
- **Read (frontend):** `useOrg().hasFeature("freeTierUsers")` via `OrgProvider`.
- **Read (backend):** `ctx.org.features.freeTierUsers` (same JSONB the `orgFeature()` middleware reads).

## 5. CSV `paid` column

When the org has `freeTierUsers` **ON**, the dancer CSV requires a `paid` column (boolean). When
**OFF**, the column is ignored and nothing changes (zero regression).

- **Frontend schema** `apps/frontend/src/features/org/lib/csv-schemas.ts`: `dancerSchema` becomes
  feature-aware (the upload dialog already has `hasFeature`); add a `paid` column with
  `required: hasFeature("freeTierUsers")` and a boolean validator accepting
  `true/false/yes/no/1/0`.
- **Upload dialog** `apps/frontend/src/features/org/components/csv-upload-dialog.tsx`: consumes the
  schema; `ExpectedColumns` / `ColumnChips` then surface `paid` automatically.
- **Parser** `apps/backend/app/shared/org/csv-parser.ts`: add `paid?: boolean` to `DancerRow`; parse
  the boolean in `parseDancerCsv`; when the feature is ON, a missing/blank `paid` is a row error
  (`"paid is required"`); invalid value → `"paid must be true, false, yes, no, 1, or 0"`. The
  feature flag must be threaded into the parser (or validated in the service before parse).
- **Upload service** `apps/backend/app/modules/orgs/events/upload-dancers/service.ts`: map
  `paid → eventRosters.paid` on both INSERT (~218–230) and UPDATE (~204–215).
- **Preview service** `apps/backend/app/modules/orgs/events/upload-preview/service.ts`: parse with
  the same rules so the preview reports `paid`-related row errors before commit.

## 6. Premium-grant creation (skip when paid=false)

Premium grants are created in three places. Each must skip grant creation when the org has
`freeTierUsers` ON **and** the relevant `paid` value is `false`:

| Insertion point | File | When |
|---|---|---|
| CSV match (existing user) | `upload-dancers/service.ts` (~256–264) | matched email already has an S2S account |
| Invite claimed (new account) | `register-dancer/service.ts` (~87–92) | net-new dancer claims invite |
| Admin attach | `orgs/events/rosters/attach/service.ts` (~185–193) | admin attaches an account to a roster row |

- **Existing accounts are never downgraded.** For the CSV-match and admin-attach paths we only skip
  the grant; we do **not** set `users.limited` (the account predates the org).
- **New accounts** created by `register-dancer` with `paid === false` are marked
  `users.limited = true` (and get no grant). With `paid === true` (or feature OFF) they get a grant
  as today and `limited` stays `false`.

`users.limited` is only ever set at account **creation**, deliberately — this avoids retroactively
limiting normal-org users when their event grant expires after 90 days.

## 7. Profile endpoint changes

`apps/backend/app/modules/dancers/profile/get-dancer/service.ts` currently sets
`subscribed: !!subscription` by reading **only** the `user_subscriptions` relation — it ignores
`premium_grants` entirely. This is a latent bug: org-granted users wrongly read `subscribed: false`.

Change: inject `GetSubscriptionService`, call it for the profile's user, and return:

```ts
subscribed: status.source !== "none",
subscriptionSource: status.source,                 // "stripe" | "org_event" | "none"
limited: user.limited && status.source === "none", // restricted profile trigger
```

Consequence (accepted): grant users will now correctly read `subscribed: true` and see the cards
their grant entitles them to. Regenerate frontend types (`pnpm types`, backend running) after the
response shape changes.

## 8. Profile section visibility

`apps/frontend/src/features/dancer/page.tsx` (sections hardcoded ~79–119). Gate each section on the
tier derived from `limited` + `subscriptionSource`:

| Section | stripe | org_event | limited | normal free |
|---|:--:|:--:|:--:|:--:|
| Hero / header | ✅ | ✅ | ✅ | ✅ |
| Contact Info *(sidebar)* | ✅ | ✅ | ❌ | ✅ |
| Education & Training *(sidebar)* | ✅ | ✅ | ❌ | ✅ |
| Organizations *(sidebar, owner-only)* | ✅ | ✅ | ✅ | ✅ |
| About Me | ✅ | ✅ | ❌ | ✅ |
| Achievements | ✅ | ✅ | ❌ | ✅ |
| References | ✅ | ✅ | ❌ | ✅ |
| Common Recruiting Submission | ✅ | ❌ | ❌ | ❌ |
| Media Gallery | ✅ | ✅ *(YouTube only)* | ❌ | ✅ |
| Skills | ✅ | ❌ | ❌ | ✅ |
| Events Attending | ✅ | ❌ | ❌ | ❌ |

- **limited** = Hero + Organizations only. (Organizations is owner-only, so a visitor viewing a
  limited profile sees Hero alone.)
- **org_event** = full profile minus Submission, Skills, Events; Media Gallery present but
  YouTube-only (§9).
- **normal free** and **stripe** are unchanged from today (Submission/Events were already
  `subscribed`-gated, which now resolves correctly via `subscriptionSource`).

Implementation: derive a single tier value once near the top of the page and wrap each card; prefer a
small helper (e.g. `canShow(section, tier)`) over scattering ternaries, given the matrix above.

## 9. Video upload (invert current gating)

Cloudflare Stream file uploads cost money per upload, so reserve them for real Stripe payers; give
org-granted users the free YouTube embed. This **inverts** today's behavior (where grant users see
file-only and the YouTube tab is hidden).

| Tier | File upload (`/videos/tus`, Cloudflare) | YouTube (`/videos/youtube`) |
|---|:--:|:--:|
| stripe | ✅ | ✅ |
| org_event | ❌ → YouTube only | ✅ |
| limited / normal free | ❌ (gallery hidden / not subscribed) | ❌ |

- **Backend** `apps/backend/app/modules/videos/tus-upload/service.ts`: require `source === "stripe"`
  for file upload (the service already computes Stripe-vs-grant for its 3-vs-2 video limit — this is
  a guard, not new plumbing). Reject grant-only users with a clear error. `add-youtube-video` keeps
  its existing `subscribed()` gate so grant users can add YouTube.
- **Frontend** `apps/frontend/src/components/shared/media-gallery/video-upload-dialog.tsx`: flip the
  tab logic — `org_event` users see the **YouTube tab only**; `stripe` users see both; `limited`
  never reach the gallery (it's hidden on their profile).

## 10. Behavior when feature is OFF (default, all existing orgs)

- `paid` column ignored / not required on CSV upload.
- No `users.limited` ever set → no limited profiles.
- Grants created exactly as today.
- Only the §7 latent-bug fix (grant users now read `subscribed: true`) and §9 video inversion are
  globally visible; both are intended corrections. (If we want the video inversion gated behind the
  org feature too, that is an open question — see §13.)

## 11. Migrations

Two new columns: `eventRosters.paid`, `users.limited`. Follow the worktree's drizzle-kit
1.0.0-beta.12 workflow: run `pnpm db:generate`, then trim the generated `migration.sql` to only
these two new statements (the beta tooling re-emits already-merged columns against a stale baseline);
verify with a second `pnpm db:generate` reporting "No schema changes." Apply via `pnpm db:push` in dev.

## 12. Verification

- `pnpm typecheck` + `pnpm build` (frontend), `pnpm typecheck` (backend).
- `pnpm types` after the profile response shape changes.
- Targeted unit tests: `csv-parser.spec.ts` (paid parsing + required-when-feature-on),
  `upload-dancers/service.spec.ts` (grant skipped when paid=false; `eventRosters.paid` persisted),
  `register-dancer` (limited set + grant skipped for new paid=false account; not set for paid=true).
- Manual: toggle the feature for a test org, upload a CSV with mixed paid values, verify limited vs
  org_event vs stripe profiles render the right sections and the right video tabs.
- Backend test infra can hang — do not block completion on a full suite run.

## 13. Open questions / verify at implementation

1. **Video inversion scope:** should YouTube-only-for-grant apply globally, or only for orgs with
   `freeTierUsers` ON? Default assumption: global (it's a cost-correctness fix). Confirm before merge.
2. **Re-upload upgrade:** if an org re-uploads a previously-limited user with `paid=true`, the new
   grant makes them `org_event` and the profile auto-upgrades via the `&& source === "none"` guard;
   `users.limited` is left stale but harmless. Optionally clear it. Not required.
3. Confirm the exact subscription hook the video dialog and profile page use on the frontend, and
   wire them to `subscriptionSource`.

## 14. Coordination with concurrent worktree work

A separate effort in this worktree is renaming `attend/` → `view-as/` and adding `eventRosters.is_staff`
for admin staff-preview rosters. This feature also touches `eventRosters` (adds `paid`) and
`register-dancer` / roster services. Keep changes additive and non-overlapping; coordinate the
`org-events.ts` schema edit and any shared migration so the two columns land cleanly together.
