# Design: Staff Preview Rosters ("View as coach/dancer")

**Date:** 2026-06-24 · **Branch:** `worktree-org_events` · **Status:** approved (shape)

## Problem

Many org-event features (scouting favorites/ratings/notes/selections/callbacks, dancer
check-in) only work when the acting user has an `event_rosters` row for the active event —
because controllers resolve `ctx.orgRoster.id` from `OrgEventMiddleware` and pass it as the
`coachRosterId` / `dancerRosterId` that all those features are keyed on.

To let admins use those features, the stop-gap was to have admins **attend** the event,
which inserts a *real* roster row for them. That polluted the dancer/coach tables, exports,
counts, scouting lists, and aggregates with admin accounts (the bug fixed earlier via
`excludeAdminRosters`). We want a real "view as coach/dancer" capability instead.

**Invariant (confirmed):** an admin is NEVER a legitimate real participant. Any admin roster
row is, by definition, a sandbox.

## Decision

Introduce a first-class **staff/preview roster**: an `event_rosters` row flagged
`is_staff = true`. It is a real row (so all existing scouting/check-in FKs work unchanged) but
is invisible to participants and excluded from every participant-facing and aggregate query.
This flag **replaces** the `excludeAdminRosters` join-based filter.

Scope of admin "view as": **fully interactive own sandbox** — admins favorite/rate/call-back/
select as themselves, persisted, but isolated from real participant data and from org-wide
aggregates (rankings, callbacks board).

UX: **explicit toggle** ("View as coach" / "View as dancer") + a persistent "Preview mode —
staff sandbox" banner with an exit control. Not automatic-on-navigation.

### Rejected alternatives
- **Separate `event_staff_rosters` table** — every scouting table FKs `event_rosters.id`; a
  separate table would require widening all of them. Too invasive.
- **Keep the admin-inference join (`excludeAdminRosters`)** — hides rows but can't isolate
  sandbox writes from aggregates and conflates "admin" with "preview". Superseded.

## Architecture

```
Admin clicks "View as coach"  ─► POST /orgs/:slug/events/view-as { type }   (auth+org+orgMember+orgAdmin)
                                      │  upsert caller's staff roster (is_staff=true) — idempotent
                                      ▼
   event_rosters { userId: admin, type: 'coach', is_staff: true }   ◄─ FK anchor for scouting writes
                                      │
   OrgEventMiddleware → ctx.orgRoster (disambiguated by acting type)  ─► all features work as-is
                                      │
   Frontend: preview banner + exit;  EXCLUDE is_staff in participant + aggregate queries
```

## Components

### 1. Schema (`schema/org-events.ts` → `eventRosters`)
- Add `isStaff: boolean NOT NULL DEFAULT false`.
- Change unique index `(eventId, email)` → **partial** `WHERE is_staff = false`.
- Add partial unique `(eventId, userId, type) WHERE is_staff = true` → at most one staff-coach
  and one staff-dancer per admin per event.
- Migration via `pnpm db:generate` + `pnpm db:migrate`.

### 2. Backfill (one-time command)
Mark existing admin-attended rows `is_staff = true` (non-destructive — turns prior hacky
attends into proper sandboxes). Reuse the admin definition from `excludeAdminRosters`
(platform `users.role in (admin, prodigy_admin)` OR org `org_memberships.role = 'admin'`).

### 3. Endpoint: rename `attend` → `view-as`
- `modules/orgs/events/attend/` → `view-as/`. `POST :slug/events/view-as { type }`.
- Same guard (`auth → org → orgEvent → orgMember → orgAdmin`).
- `AttendEventService` → upsert sets `isStaff: true` on create.

### 4. Middleware (`org-event.ts`)
- An admin may hold two staff rows (coach + dancer) → current `LIMIT 1` by `userId` is
  ambiguous. Request carries acting type (header `x-act-as-type` or query `actAs`); when
  present, middleware picks the staff roster of that type. Normal users have one row →
  unchanged behavior.

### 5. Exclusion refactor
- Replace `excludeAdminRosters(eventId)` with a plain `eq(eventRosters.isStaff, false)`
  predicate (rename helper → `excludeStaffRosters` or inline). Delete the join helper.
- Apply to the existing 6 display queries **plus**:
  - `scouting/rankings/service.ts` — dancer list (exclude staff dancers).
  - `scouting/callbacks/admin-board/service.ts` — exclude staff dancer/coach rows from the
    stat counts AND exclude callbacks authored by a staff *coach* roster.

### 6. Frontend
- "View as coach / dancer" toggle in the org admin shell (`admin/route.tsx` area / sidebar);
  calls `view-as`, navigates to the coach/dancer view, sends the acting-type header on
  subsequent requests.
- Persistent "Preview mode — staff sandbox" banner + exit control.

## Data flow / isolation guarantees
- Staff coach favorites/ratings/notes/callbacks/selections are keyed by the staff roster id →
  scoped to that admin's sandbox; never mixed into another coach's per-coach views.
- `is_staff = false` filter guarantees staff rows never appear in participant lists, exports,
  counts, rankings, or the callbacks board (rows and staff-coach-authored callbacks).

## Testing
- Service specs: each excluded query drops `is_staff = true` rows; keeps participants.
- `view-as` endpoint: idempotent upsert; creates `is_staff = true`; coach+dancer coexist.
- Middleware: acting-type disambiguation returns the correct staff roster.
- Backfill: existing admin rows flip to `is_staff = true`, participants untouched.
- (Backend test suite can hang — rely on typecheck/build + targeted runs.)

## Build sequence (small chunks)
1. ✅ **Done.** Schema (`is_staff` + partial indexes) + migration `20260624181255_shallow_iceman`
   (migration drift fixed) + `backfill:staff-rosters` command; swapped `excludeAdminRosters` →
   `eq(isStaff, false)` across the 6 display queries; deleted the join helper.
2. ✅ **Done.** Renamed `attend` → `view-as` module/route (`POST :slug/events/view-as`), service
   now upserts a staff roster (`isStaff: true`, keyed by eventId+userId+type, no participant
   email-claim); `org-event` middleware disambiguates via `x-act-as-type` header. Updated both
   frontend callers + the spec. NOTE: `types.d.ts` still lists the old `/events/attend` path —
   run `pnpm types` (needs backend running) to regenerate; harmless meanwhile (callers use raw casts).
3. ✅ **Done.** Aggregate exclusions: `rankings` (staff dancers), `admin-board` (staff dancers +
   staff-coach callbacks + stat counts). Also closed the published-callbacks surface: `publish`
   excludes staff coach/dancer callbacks at the source, with defensive `isStaff=false` guards on
   `published-callbacks` and `dancer-callbacks` reads (protects already-published data). Audit:
   the per-coach-scoped reads (`selections/list`, `callbacks/list`, `favorites/list`,
   `dancers/get-by-id`) are intentionally unfiltered — keyed to the viewer's own roster, so they
   isolate by construction.
4. ✅ **Done.** API client injects `x-act-as-type` (derived from `/coach`|`/dancer` in the path,
   reload-safe) in `lib/api/client.ts`. New `PreviewModeBanner` (`features/org/components/`)
   shown to admins, wired into `coach/route.tsx` + `dancer/route.tsx` with an "Exit" → admin.

Confirmed invariant: `attend`/`view-as` was always admin-only (route `orgAdmin()` guard + both
callers admin-gated). Participants get rosters via registration or CSV, never this endpoint.
