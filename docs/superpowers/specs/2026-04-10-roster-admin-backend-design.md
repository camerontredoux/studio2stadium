# Roster Admin Backend API

**Status:** Design approved, ready for implementation plan
**Date:** 2026-04-10
**Branch:** `plan/summit-04-coach-scouting`
**Parent spec:** `2026-04-10-roster-pages-design.md`

## Problem

The admin Dancers and Coaches pages (`/admin/dancers`, `/admin/coaches`) were built against mock data in `apps/frontend/src/features/org/lib/mock-roster-data.ts`. The mock fabricates data, handles filter/sort/pagination client-side, and implements CRUD via in-memory mutation. There are no real backend endpoints for admin roster management, so the UI can read existing CSV-uploaded data but can't list, filter, edit, delete, export, or resend invites for real.

Additionally, the mock took creative liberty on the dancer profile shape and the mock assumes `isRegistered` is a manually-editable flag. The real data model stores `isRegistered` as a column and never links `event_rosters.userId` during the existing dancer registration flow, so the stored flag is the only signal for activation status and it's unreliable.

## Goals

1. Build admin-only REST endpoints for roster list, update, delete, export, filter metadata, and resend-invites (dancers only).
2. Replace the frontend mock with real API calls via the existing `openapi-react-query` client.
3. Drop `event_rosters.isRegistered` from the schema. Status becomes derived: `userId IS NOT NULL`.
4. Fix the dancer registration flow to link `event_rosters.userId` to the newly-created user so status derivation works.
5. Enforce "edit only when pending" at the API layer. Active roster entries (linked to a real user) are read-only for profile fields; delete and resend-invite endpoints stay functional according to their own rules.
6. Consolidate the edit surface to fields that map 1:1 to real database columns — remove anything the mock invented.

## Non-goals

- Coach registration flow and roster linking. Coaches will continue to always display as "Pending" in admin until a coach signup flow is built (documented gap, follow-up work).
- Soft delete / audit log for roster deletions. Hard delete only, relying on existing cascade to `event_dancer_profiles`.
- Background job queue for email sends. Synchronous endpoint with in-loop pacing is sufficient at current scale.
- Manual status override ("Mark Active" / "Mark Pending") from the UI. These are removed — status is purely derived from registration state.
- Profile photo upload. The `profilePhotoUrl` column stays in the DB (displayed read-only if populated) but is removed from the admin edit form.
- Cross-event bulk operations. Every admin roster operation is scoped to a single event ID in the URL; there's no "delete dancer X from all past events" feature.

## Field consolidation

This is the "drop the mock's creative liberty" list. Every field in the admin edit surface maps 1:1 to a real database column.

### Roster-level fields (`event_rosters`)

| Field | Type | Dancers | Coaches | Notes |
|---|---|---|---|---|
| `firstName` | text | editable | editable | |
| `lastName` | text | editable | editable | |
| `email` | text | editable | editable | Unique per `(eventId, email)`; edit rejected with 409 on collision |
| `organization` | text | editable (nullable) | editable (nullable) | Free-form text |
| `bibNumber` | int | editable (nullable) | — | Dancers only; unique per event when non-null |

### Profile fields (`event_dancer_profiles`, dancers only)

| Field | Type | Editable? | Notes |
|---|---|---|---|
| `profilePhotoUrl` | text | **no** — display-only | No upload flow yet; removed from edit form |
| `gradYear` | int | yes (nullable) | |
| `gpa` | numeric | yes (nullable) | Form accepts decimal like 3.7 |
| `studio` | text | yes (nullable) | |
| `state` | text | yes (nullable) | |
| `height` | text | yes (nullable) | Free-form, e.g. `5'6"` |
| `danceStyles` | text[] | yes (nullable) | Array in DB; comma-separated in UI input |
| `bio` | text | yes (nullable) | |
| `extra` | jsonb | **no** — not displayed | Reserved for future schema-free extensions |

### Edit permission rule

All field edits are gated on roster entry status. Active entries (`userId IS NOT NULL`) are read-only for all roster-level and profile fields. Delete and resend-invite operate under their own rules (delete works on any status; resend-invite works only on pending dancers).

## Database migration

Single migration generated via `pnpm db:generate`:

- Drop `event_rosters.isRegistered` column.
- Verify `event_dancer_profiles.rosterId` has `ON DELETE CASCADE` already set (it does per the current schema; no change needed). Spec note for the implementer: if cascade is missing, add it in the same migration.

Callers of `isRegistered` must be audited and updated before the migration runs:

- `apps/backend/app/modules/orgs/events/upload-dancers/service.ts` — remove `isRegistered: false` from insert values
- `apps/backend/app/modules/orgs/events/upload-coaches/service.ts` — remove `isRegistered: false` from insert values
- `apps/backend/app/modules/orgs/events/stats/service.ts` — rewrite `pending` count from `isRegistered = false` to `userId IS NULL`
- `apps/backend/app/modules/orgs/scouting/**` — any reads of the field; replace with derived value
- Any test files asserting on the column

The project has no production data ("no data yet"), so drop-and-rewrite is safe.

## API endpoints

New module tree: `apps/backend/app/modules/orgs/events/rosters/` with one subfolder per feature following the existing convention (`controller.ts`, `service.ts`, `validator.ts`, `service.spec.ts`).

All endpoints require `auth` middleware + org admin membership — same middleware the existing `upload-dancers` route uses. The exact middleware name should be reused verbatim from that route.

### `GET /orgs/:slug/events/:eventId/rosters`

**Purpose:** Paginated, filterable, sortable list for the admin Dancers/Coaches pages.

**Query parameters:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `type` | `"dancer" \| "coach"` | required | |
| `page` | int | 0 | Zero-indexed |
| `limit` | int | 50 | Max 200 |
| `search` | string | — | Matches `firstName`, `lastName`, `email` via `ilike`; also matches `bibNumber` if the search string is numeric |
| `status` | `"all" \| "active" \| "pending"` | `"all"` | |
| `org` | string | — | Exact match on `organization` |
| `sortBy` | string | `lastName` | Whitelist: `lastName`, `firstName`, `email`, `bibNumber`, `organization`, `createdAt`, `isRegistered` |
| `sortDir` | `"asc" \| "desc"` | `"asc"` | |

**Response:**

```ts
{
  data: Array<{
    id: string,
    eventId: string,
    type: "dancer" | "coach",
    email: string,
    firstName: string,
    lastName: string,
    bibNumber: number | null,
    organization: string | null,
    isRegistered: boolean,       // derived: userId IS NOT NULL
    createdAt: string,           // ISO
    profile: {                   // dancers only, null for coaches
      profilePhotoUrl: string | null,
      gradYear: number | null,
      gpa: number | null,
      studio: string | null,
      state: string | null,
      height: string | null,
      danceStyles: string[] | null,
      bio: string | null,
    } | null,
  }>,
  total: number,
}
```

**Query implementation:**

- Single SELECT with LEFT JOIN to `event_dancer_profiles` on `rosterId`. For coaches the join yields nulls and the service projects `profile: null`.
- `isRegistered` computed in the SELECT: `(event_rosters.user_id IS NOT NULL) AS is_registered`.
- Filters composed with Drizzle's `and(...)` helper.
- Sort by whitelist column + direction. `isRegistered` sort uses the same SQL expression as the computed column.
- Pagination: `.limit(limit).offset(page * limit)`.
- `total` fetched via a parallel COUNT query with identical WHERE clauses (via `Promise.all`).

**Errors:** 400 on invalid `sortBy` / `sortDir` / `status` / `type` (VineJS validator catches). 404 if event doesn't exist or doesn't belong to org. 403 if user isn't an org admin.

### `PATCH /orgs/:slug/events/:eventId/rosters/:rosterId`

**Purpose:** Update a single roster entry and/or its profile.

**Body:**

```ts
{
  firstName?: string,
  lastName?: string,
  email?: string,
  organization?: string | null,
  bibNumber?: number | null,
  profile?: {
    gradYear?: number | null,
    gpa?: number | null,
    studio?: string | null,
    state?: string | null,
    height?: string | null,
    danceStyles?: string[] | null,
    bio?: string | null,
  }
}
```

**Service logic (transactional):**

1. `SELECT ... FOR UPDATE` the roster row by `id + eventId` to prevent concurrent edit races.
2. If `userId IS NOT NULL` → throw `RosterActiveReadonlyError` → map to 409 with code `ROSTER_ACTIVE_READONLY`.
3. If `type = "coach"` and body includes a `profile` object → throw 400 with code `COACH_NO_PROFILE`.
4. If `bibNumber` present and non-null: the DB unique constraint handles collision; catch PG error and map to 409 `ROSTER_BIB_CONFLICT`.
5. If `email` present: pre-SELECT for collision within the same event, return 409 `ROSTER_EMAIL_CONFLICT` on conflict. DB unique constraint is backup.
6. `UPDATE event_rosters` with any provided roster-level fields.
7. If `profile` present: `INSERT ... ON CONFLICT (rosterId) DO UPDATE` into `event_dancer_profiles`. Handles the case where a CSV-uploaded dancer has no profile row yet.
8. Return the updated entry shaped identically to a list-response item (SELECT via the same query logic as the list endpoint, filtered to the single id).

**Errors:** 400 on validation failure. 404 if roster entry doesn't belong to event. 409 on active-readonly / email conflict / bib conflict / coach profile rejection.

### `DELETE /orgs/:slug/events/:eventId/rosters`

**Purpose:** Bulk hard delete roster entries.

**Body:** `{ ids: string[] }` (1-500 items, VineJS-enforced range).

**Service logic:**

- `DELETE FROM event_rosters WHERE eventId = ? AND id = ANY(?::uuid[])`
- Cascade handles `event_dancer_profiles` row deletion.
- No filtering by status — delete works on both pending and active entries.
- Response: `{ deletedCount: number }`.

**Errors:** 400 on empty ids array or oversize array. 403/404 as above.

### `POST /orgs/:slug/events/:eventId/rosters/resend-invites`

**Purpose:** Regenerate invite tokens and send invite emails for pending dancers.

**Body:** `{ ids: string[] }` (1-500).

**Service logic:**

1. SELECT matching roster rows: `id = ANY(?) AND eventId = ? AND type = 'dancer' AND userId IS NULL`. Store the set of matched IDs.
2. Compute the skipped set: `requested_ids - matched_ids` (includes coaches, active dancers, unknown IDs, and IDs belonging to other events). Return these in the response so the frontend can report accurately.
3. Loop over matched rows with 100ms pacing between iterations (`await setTimeout(100)`):
   a. Short transaction: `DELETE FROM org_dancer_invites WHERE orgId = ? AND email = ?` then `INSERT INTO org_dancer_invites (orgId, email, token, expiresAt)` with a freshly-generated crypto-random token and expiry of `now + 14 days`.
   b. Outside the transaction, call the existing dancer invite email sender from `packages/emails`. The implementer should reuse the template already used by `upload-dancers` (verify during implementation; if none exists, add one using the existing templates package conventions).
   c. Catch per-item errors (email send failure, DB constraint) into a `failed` array; continue the loop.
4. Response:

```ts
{
  sent: number,
  skipped: number,
  failed: Array<{ id: string, reason: string }>,
}
```

**Pacing rationale:** 100ms between sends = 10/sec, comfortably under SES sandbox limits. Batches of ~200 take ~20 seconds — frontend shows a loading state throughout.

**Errors:** 400 on empty/oversize ids. 403/404 as above. Individual email failures do not fail the whole request; they're reported in `failed`.

### `GET /orgs/:slug/events/:eventId/rosters/export`

**Purpose:** CSV export of filtered roster. Not paginated — returns the full matching set.

**Query parameters:** `type`, `search`, `status`, `org` — same semantics as the list endpoint. No `sortBy` (stable order by `lastName` asc, `firstName` asc).

**Response:**

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="<type>s-export.csv"` (`dancers-export.csv` or `coaches-export.csv`)
- Body: RFC 4180 CSV with header row

**Columns:** `First Name, Last Name, Email, Bib #, Organization, Status`

- `Bib #` empty for coaches or null bibs
- `Organization` empty for null
- `Status` is `"Active"` or `"Pending"` derived from `userId IS NOT NULL`

**Implementation:** small inline CSV helper (no new dependency) — about a dozen lines for escaping quotes/commas/newlines per RFC 4180.

**Errors:** 400 on invalid filters. 403/404 as above.

### `GET /orgs/:slug/events/:eventId/rosters/filters`

**Purpose:** Populate the Organization filter dropdown on the admin pages.

**Query parameters:** `type` (required).

**Response:**

```ts
{ organizations: string[] }
```

Distinct non-null values of `event_rosters.organization` for the event + type, sorted ascending. Frontend caches this per-event/type.

## Register-dancer linking update

**File:** `apps/backend/app/modules/orgs/register-dancer/service.ts`

**Problem:** The current registration flow creates a user, org membership, premium grant, and consumes the invite — but never touches `event_rosters.userId`. After the migration drops `isRegistered`, there's no path to "Active" status without this fix.

**Change:** Inside the existing transaction, after the user insert and before the invite-consume step, add:

```ts
await tx
  .update(eventRosters)
  .set({ userId: user.id })
  .where(
    and(
      eq(eventRosters.type, "dancer"),
      eq(eventRosters.email, invite.email),
      isNull(eventRosters.userId),
      inArray(
        eventRosters.eventId,
        tx.select({ id: orgEvents.id })
          .from(orgEvents)
          .where(eq(orgEvents.orgId, org.id))
      )
    )
  );
```

**Rationale:**

- Scoped to this org's events only (cross-org linking is wrong — invites are org-scoped).
- `type = "dancer"` because coaches have no registration flow yet.
- `IS NULL` guard so we never overwrite an already-linked row (defensive).
- A single dancer can be linked to multiple rosters across multiple events within the same org (recurring competitions) — all flip to active simultaneously.

**Edge cases:**

- Dancer registers with no matching roster rows → UPDATE affects 0 rows, registration still succeeds. They're simply not on any roster.
- Dancer has a roster row in a different org → not touched. They'll remain "Pending" in the other org until they register there too via that org's invite flow.

**Test updates:** The existing `register-dancer/service.spec.ts` must gain assertions covering:

- Roster linking happens when a matching pending row exists in the same org.
- Roster linking does NOT happen for rows in different orgs.
- Registration still succeeds when no matching rows exist.

## Coach registration gap (documented)

Coaches currently have no backend-managed registration flow. The CSV upload path presumably sends them an invite email to sign up on S2S directly, but there's no equivalent of `register-dancer` that links `event_rosters.userId` on coach signup.

**Consequence:** After this spec ships, all coach roster entries will permanently display as "Pending" in the admin Coaches page until a coach signup + linking flow is built.

**Follow-up work (out of scope here):** Build a `register-coach` flow (or generalize `register-dancer`) that creates a user and links matching coach roster rows by `(orgId, email, type='coach')`.

## Frontend changes

### New file: `apps/frontend/src/features/org/api/roster-queries.ts`

Wraps the new backend endpoints via `openapi-react-query`. Exports:

- `rosterQueries.list(orgSlug, eventId, params)` — list query key factory
- `rosterQueries.filters(orgSlug, eventId, type)` — filter metadata query
- `useUpdateRoster(orgSlug, eventId)` — PATCH mutation; invalidates list + filters on success
- `useDeleteRosters(orgSlug, eventId)` — DELETE mutation; invalidates list + filters
- `useResendInvites(orgSlug, eventId)` — POST mutation; does not invalidate (no status change)
- `useExportRoster(orgSlug, eventId)` — direct fetch wrapper that downloads a blob client-side

Mutations map known backend error codes to user-friendly toast messages:

- `ROSTER_ACTIVE_READONLY` → "Can't edit an active roster entry."
- `ROSTER_EMAIL_CONFLICT` → "That email is already on this roster."
- `ROSTER_BIB_CONFLICT` → "That bib number is already in use."
- `COACH_NO_PROFILE` → internal error toast (shouldn't happen from UI)

### Updated: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/dancers.tsx`

- Remove imports from `mock-roster-data`.
- Remove `refreshKey` state; rely on React Query invalidation.
- Add `useQuery` for list (via `rosterQueries.list`).
- Add `useQuery` for org filter options.
- Wire bulk actions and detail-sheet save/delete/resend to the new mutation hooks.
- Source `eventId` from the active event; the admin route layout already fetches it via `adminQueries.events` — expose through route context (`_authenticated/admin/route.tsx`) so both dancers and coaches routes can read it without re-fetching.
- Render loading skeleton on initial load; render error state on query error.
- Export button: calls `useExportRoster` then triggers a client-side download from the returned blob.

### Updated: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/coaches.tsx`

Same changes as dancers, plus:

- Remove "Resend Invite" from the bulk actions (coaches have no resend endpoint).
- Omit `bibNumber` from columns and edit surface (no change from current behavior — coaches already lack the column).

### Updated: `apps/frontend/src/features/org/components/roster-detail-sheet.tsx`

- Read `entry.isRegistered` (still present on the wire; now computed server-side).
- If active: render every form input with `disabled`, hide the Save button, and show a banner: *"This dancer has registered and connected their profile. Admin edits are disabled."* (For coaches, the banner text says "coach" but the banner is currently unreachable since no coach can become active until the coach signup flow is built.)
- Delete button stays visible for active entries.
- Resend Invite button stays hidden for active entries (existing behavior).
- Profile photo input removed entirely. If `profilePhotoUrl` is set, display as a read-only avatar preview (optional; implementer can choose to omit if it complicates layout).
- On save: handle 409 error codes with specific toasts as listed above.

### Updated: `apps/frontend/src/features/org/components/data-grid.tsx`

- Remove "Mark Active" and "Mark Pending" from the `rosterBulkActions` factory.
- The `onMarkActive` / `onMarkPending` callbacks are removed from the factory signature.
- Surviving bulk actions for dancers: Export, Resend Invite, Delete. For coaches: Export, Delete.

### Removed: `apps/frontend/src/features/org/lib/mock-roster-data.ts`

Deleted once all usages are replaced. The implementer should grep for imports first to ensure no straggler.

### No changes: `admin-sidebar.tsx`, `admin/index.tsx`

Sidebar already links to `/admin/dancers` and `/admin/coaches`. Admin dashboard stats still work (the stats service is updated server-side to use `userId IS NULL` for pending count).

## Testing approach

### Backend tests

Co-located `service.spec.ts` files following the Japa + faker pattern used elsewhere.

**New test files:**

- `modules/orgs/events/rosters/list/service.spec.ts`
  - Happy path pagination
  - Search matches firstName, lastName, email (case-insensitive)
  - Search matches numeric bibNumber
  - Status filter: all, active, pending (including verifying `isRegistered` derivation from `userId`)
  - Org filter exact match
  - Sort whitelist: each sort column works; direction applies correctly
  - `total` count matches regardless of pagination
  - Empty result set returns `{ data: [], total: 0 }`
  - Coach results have `profile: null`
  - Dancer results include populated profile when present, `null` profile when no row in `event_dancer_profiles`

- `modules/orgs/events/rosters/update/service.spec.ts`
  - Happy path: update each roster-level field individually
  - Happy path: update profile fields; upserts when no profile row exists
  - Rejects update when `userId IS NOT NULL` (409)
  - Rejects `profile` in body for coaches (400)
  - Email collision returns 409
  - Bib collision returns 409
  - Setting nullable field to `null` works (organization, bibNumber, each profile field)
  - Transaction rollback: if profile upsert fails, roster update is rolled back

- `modules/orgs/events/rosters/delete/service.spec.ts`
  - Bulk delete removes roster rows
  - Cascade removes `event_dancer_profiles` rows
  - Scoped to eventId: can't delete entries from another event even with valid ids
  - Returns accurate `deletedCount`
  - Works on both active and pending entries

- `modules/orgs/events/rosters/resend-invites/service.spec.ts`
  - Mock the email sender so no real emails are sent
  - Happy path: all pending dancers get new tokens + emails
  - Active dancers are skipped (counted in `skipped`)
  - Coaches are skipped
  - Unknown ids are skipped
  - Ids from other events are skipped
  - Old `org_dancer_invites` rows for the same email are deleted before new token is inserted
  - Email send failure for one item doesn't stop the loop; appears in `failed`
  - Pacing: not asserted directly (would slow tests); spec note that the implementer can use a configurable delay that tests override to 0

- `modules/orgs/events/rosters/export/service.spec.ts`
  - Happy path produces correct CSV with header
  - RFC 4180 escaping for fields containing commas, quotes, newlines
  - Status column derived correctly
  - Filters apply to the export (same shape as list)
  - Sort order stable (lastName asc)

- `modules/orgs/events/rosters/filters/service.spec.ts`
  - Returns distinct non-null organizations sorted asc
  - Scoped to event + type
  - Empty roster returns `{ organizations: [] }`

**Updated test files:**

- `modules/orgs/register-dancer/service.spec.ts`
  - Add: after successful registration, `event_rosters.userId` is linked for rows matching `(orgId, email, type='dancer')`
  - Add: rows in other orgs are NOT linked
  - Add: registration succeeds with zero matching roster rows
- `modules/orgs/events/stats/service.spec.ts`
  - Pending count now uses `userId IS NULL` derivation
- `modules/orgs/events/upload-dancers/service.spec.ts` and `upload-coaches/service.spec.ts`
  - Remove any `isRegistered` assertions

### Frontend tests

The frontend has no test runner configured. We rely on:

- TypeScript + auto-generated OpenAPI types catching API shape mismatches at build time.
- Manual smoke test checklist in the implementation plan.

Manual smoke test checklist:

- [ ] Dancers page loads and shows real roster
- [ ] Search matches name and bib number
- [ ] Status filter works
- [ ] Org filter works
- [ ] Sort each column
- [ ] Pagination works
- [ ] Double-click to inline-edit a pending dancer's fields
- [ ] Open detail sheet for pending dancer, edit profile, save — changes persist
- [ ] Open detail sheet for active dancer — form is read-only, banner shows
- [ ] Delete a single entry from detail sheet
- [ ] Bulk delete
- [ ] Bulk resend invites (verify loading state, success toast with counts)
- [ ] Export — file downloads with correct rows
- [ ] Repeat the applicable items on the Coaches page (no bib, no resend)
- [ ] Register a dancer via invite token flow; verify they flip to "Active" in the admin page

### Migration testing

- `pnpm db:generate` locally → review migration SQL
- `pnpm db:migrate` locally → confirm column dropped
- Run full backend test suite → ensure no stale references to `isRegistered`
- `pnpm typecheck` in both backend and frontend

## Implementation order

Suggested order (the implementation plan will formalize this):

1. Schema migration: drop `isRegistered`, update all services that reference it, update their tests. Migration runs green locally.
2. Backend: list endpoint + tests.
3. Backend: update endpoint + tests.
4. Backend: delete endpoint + tests.
5. Backend: export endpoint + tests.
6. Backend: filters endpoint + tests.
7. Backend: resend-invites endpoint + tests (with mocked email sender).
8. Backend: register-dancer linking + updated tests.
9. Regenerate OpenAPI types (`pnpm make:docs`).
10. Frontend: create `roster-queries.ts`.
11. Frontend: migrate dancers page off mock.
12. Frontend: migrate coaches page off mock.
13. Frontend: update detail sheet for active-readonly mode.
14. Frontend: update data-grid bulk actions.
15. Delete `mock-roster-data.ts`.
16. Manual smoke test pass.

Steps 2-7 are independent after step 1; can be parallelized across sub-agents if desired.
