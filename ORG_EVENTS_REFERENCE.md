# Org & Events Code Reference

> **Purpose:** A stable map of where org + events code lives so we can jump straight to the
> right files across chat resets. Work in this worktree (`worktree-org_events`).
> Scope of current work: **hardening, bug fixing, and minor features for the existing events system.**
>
> Paths are relative to repo root (`apps/...`). Frontend = `apps/frontend`, Backend = `apps/backend`.

---

## ⚠️ READ THIS FIRST — Three naming collisions that will bite you

### 1. Two different "events" systems

| Term | What it is | Backend | Frontend | DB tables |
|------|-----------|---------|----------|-----------|
| **Org events** | Org-scoped competition/showcase events (rosters, check-in, videos, audit log, reconciliation). This is the multi-tenant org platform's event system. | `apps/backend/app/modules/orgs/events/` | `apps/frontend/src/features/org/` | `org_events`, `event_rosters`, `event_dancer_profiles`, `csv_uploads`, `event_video_categories`, `event_videos`, `event_checklist`, `event_audit_log` |
| **Platform events** | Public school-hosted events + global events browsed in the main S2S app (the "explore events" experience). | `apps/backend/app/modules/events/` | `apps/frontend/src/features/events/` | `dance_events`, `global_dance_events`, `dance_event_schedules`, `dance_event_attendees`, `global_dance_event_attendees` |

**Unless stated otherwise, "the events system" in this org_events work = ORG EVENTS** (the table above, left column). Platform events are documented for disambiguation only.

### 2. `event.ts` is NOT an events file
The backend uses an event-driven module convention where each action's domain-event handler is literally named `event.ts` (e.g. `modules/auth/signup/event.ts`). These are **domain events / side-effects**, unrelated to the events *feature*. Don't grep for `event.ts` expecting the events system.

### 3. Two org admin dashboards
| Phrase the user says | Means | Location |
|---|---|---|
| **"s2s org admin dashboard"** | S2S platform super-admin's view of ALL orgs (create/edit/delete orgs, manage members) | `apps/frontend/src/routes/_admin/(routes)/admin/orgs.tsx` + `features/admin/orgs/` |
| **"orgs admin dashboard"** | An individual org's OWN admin area (manage that org's events, rosters, scouting, settings) | `apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/admin/` (all files) + `features/org/` |

---

## A. "s2s org admin dashboard" — platform super-admin view of all orgs

Route + feature for S2S staff to manage the org tenants themselves.

| Path | What it is |
|---|---|
| `apps/frontend/src/routes/_admin/(routes)/admin/orgs.tsx` | Route. Renders `<OrgsPage />` in a Suspense boundary with a table skeleton. |
| `apps/frontend/src/routes/_admin/route.tsx` | `_admin` layout shell (guards admin access). |
| `apps/frontend/src/features/admin/orgs/page.tsx` | `OrgsPage` — the orgs admin table page. |
| `apps/frontend/src/features/admin/orgs/index.ts` | Barrel export. |
| `apps/frontend/src/features/admin/orgs/components/orgs-table.tsx` | Table listing all orgs. |
| `apps/frontend/src/features/admin/orgs/components/create-org-dialog.tsx` | Create a new org. |
| `apps/frontend/src/features/admin/orgs/components/edit-org-dialog.tsx` | Edit org metadata/branding. |
| `apps/frontend/src/features/admin/orgs/components/members-dialog.tsx` | Manage an org's members. |
| `apps/frontend/src/features/admin/api/queries.ts` | Admin-wide queries (incl. orgs). |
| `apps/frontend/src/features/admin/api/mutations.ts` | Admin-wide mutations (incl. orgs). |
| `apps/frontend/src/features/admin/api/schemas.ts` | Admin form/zod schemas. |

**Other relevant `_admin` routes (platform events, see §E):**
`admin/global-events.tsx`, `admin/school-events.tsx`, plus `features/admin/components/global-event-form.tsx` and `features/admin/components/school-event-form.tsx`.

---

## B. "orgs admin dashboard" — an individual org's own admin area

The org-scoped admin (org admins managing their own org's events/rosters/scouting). Route shell resolves `$orgSlug`, gates on `membership.role === "admin"` (or platform admin), and renders a sidebar + active-event switcher.

### Route files — `apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/admin/`
| Path | What it renders |
|---|---|
| `route.tsx` | Admin layout shell: sidebar, header, **active-event switcher** (PATCHes `/orgs/:slug/events/:id` `isActive`), command palette. Admin-only `beforeLoad` guard. |
| `index.tsx` | Admin dashboard landing. |
| `dancers.tsx` | Dancers/roster management. |
| `coaches.tsx` | Coaches management. |
| `callbacks.tsx` | Scouting callbacks board. |
| `reconciliation.tsx` | Roster ↔ account reconciliation (invites resend/revoke/merge). |
| `settings.tsx` | Org settings (branding, features). |
| `uploads.tsx` | CSV roster uploads. |
| `video-library.tsx` | Event video library management. |

### Org route context (how `$orgSlug` resolves)
| Path | What it is |
|---|---|
| `apps/frontend/src/routes/_org/route.tsx` | Top `_org` layout. |
| `apps/frontend/src/routes/_org/o/$orgSlug/_authenticated/route.tsx` | Authenticated org layout (wraps in `OrgProvider`). |
| `apps/frontend/src/features/org/context/org-provider.tsx` | `OrgProvider` — fetches `orgQueries.org(slug)`, exposes org branding/features/membership/myRoster, sets `--org-primary`/`--org-accent` CSS vars, computes `isAdmin`. |
| `apps/frontend/src/features/org/context/org-context.ts` | Context + types (`OrgContextValue`, `OrgMembership`, `MyRoster`). |
| `apps/frontend/src/features/org/context/use-org.ts` | `useOrg()` hook. |

### Coach + Dancer org-facing routes (member views, not admin)
`_org/o/$orgSlug/_authenticated/coach/{route,index,dancers/index,event-info}.tsx`
`_org/o/$orgSlug/_authenticated/dancer/{route,index,callbacks,event-info,schools,video-library}.tsx`
Public/auth: `_org/o/$orgSlug/{login,register,register-school}.tsx`

---

## C. Org feature module (frontend) — `apps/frontend/src/features/org/`

The heart of the org platform UI. **This is where most org-events frontend work happens.**

### API hooks
| Path | What it is |
|---|---|
| `api/queries.ts` | Core org queries (`orgQueries.org(slug)` etc.). |
| `api/admin-queries.ts` | Admin queries incl. `adminQueries.events(orgSlug)`; exports `OrgEvent` type. |
| `api/roster-queries.ts` | Roster list/stats/filters queries. |
| `api/roster-mutation-error.ts` | Roster mutation error helpers. |
| `api/check-in-queries.ts` | Check-in status/mutations. |
| `api/audit-queries.ts` | Event audit-log queries. |
| `api/video-queries.ts` | Event video + category queries/mutations. |
| `api/scouting-queries.ts` / `api/scouting-mutations.ts` / `api/scouting-schemas.ts` | Scouting (callbacks, ratings, notes, selections, showcases). |

### Event-specific components
| Path | What it is |
|---|---|
| `components/create-event-form.tsx` | Create-event form. |
| `components/event-form-sheet.tsx` | Create/edit event sheet (used by active-event switcher). |
| `components/org-event-switcher.tsx` | Switch active event. |
| `components/event-video/*` | Video library: `add-edit-video-dialog`, `event-video-card`, `event-video-grid`, `manage-categories-dialog`, `video-library-toolbar`. |
| `components/checklist-item-dialog.tsx` | Event checklist item create/edit. |
| `hooks/use-event-phase.ts` | Derives event phase (upcoming/active/past) from dates. |

### Roster components
`components/roster-*.tsx` (`roster-activation-ring`, `roster-bulk-actions`, `roster-detail-sheet`, `roster-page-header`, `roster-upload-row`), `components/csv-upload-dialog.tsx`, `components/attach-account-dialog.tsx`, `components/dancer-table/*`, `components/dancer-sheet.tsx`, `components/dancer-filter-toolbar.tsx`.

### Scouting components
`components/callback-button.tsx`, `components/compare-view.tsx`, `components/rating-input.tsx`, `components/notes-editor.tsx`, `components/school-selection-picker.tsx`, `components/floating-action-bar.tsx`.

### Shell / shared
`components/admin-sidebar.tsx`, `components/admin-command-palette.tsx`, `components/coach-sidebar.tsx`, `components/dancer-sidebar.tsx`, `components/org-auth-layout.tsx`, `components/dashboard-shared.tsx`, `components/data-grid.tsx`, `components/view-switcher.tsx`, `components/themed-pending.tsx`.
`hooks/use-admin-commands.tsx`, `hooks/use-org-theme.ts`, `hooks/use-transmit.ts` (realtime).
`lib/csv-schemas.ts`, `lib/reserved-slugs.ts`.

### Public org directory (separate small feature) — `apps/frontend/src/features/orgs/`
`api/queries.ts`, `components/public-orgs-list.tsx` — public list of orgs for org login landing pages.

---

## D. Shared frontend infra (access, api client)
| Path | What it is |
|---|---|
| `apps/frontend/src/lib/access/access.ts` | `createAccess(session)` → `can/is/any/all/guard/self`. Admins bypass all checks. |
| `apps/frontend/src/lib/api/client.ts` | `openapi-fetch` client + `$api` for TanStack Query. 401 → `/login`. |
| `apps/frontend/src/lib/api/types.d.ts` | Auto-generated from backend OpenAPI (`pnpm types`). |
| `apps/frontend/src/lib/session/` | Session queries/hooks (`queries.session()`). |

---

## E. ORG EVENTS — backend (`apps/backend/app/modules/orgs/events/`)

**Primary target for events hardening/bugfix work.** Module convention per action dir: `controller.ts` (HTTP), `service.ts` (logic, injects `DatabaseService`), `validator.ts` (VineJS). Routes in `routes.ts`.

### Routing
- `apps/backend/app/modules/orgs/events/routes.ts` — all org-event routes, prefixed `orgs`, pattern `:slug/events/...`. Middleware stack: `auth() → org() → orgMember() → orgAdmin()` (admin ops) or lighter for member reads.
- `apps/backend/app/modules/orgs/routes.ts` — imports `./events/routes.ts` + `./scouting/routes.ts`; org CRUD/registration/settings.
- Registered via `apps/backend/start/routes.ts`.

### Event CRUD + lifecycle
| Dir under `modules/orgs/events/` | Route | Purpose |
|---|---|---|
| `create/` | `POST :slug/events` | Create org event. |
| `update/` | `PATCH :slug/events/:id` | Update event (incl. `isActive` toggle — only one active per org, enforced by partial unique index). |
| `delete/` | `DELETE :slug/events/:id` | Delete event. |
| `list/` | `GET :slug/events` | List org events. |
| `stats/` | `GET :slug/events/:id/stats` | Event stats. |
| `schedule/` | `GET :slug/events/:id/schedule` | Event schedule (PDF/timezone). |
| `attend/` | `POST :slug/events/attend` | Attend via `orgEvent()` middleware. |
| `check-in/` | `POST :slug/events/:id/check-in` (+ `status-controller.ts`) | Self check-in + status. |

### Rosters — `modules/orgs/events/rosters/`
`list/`, `update/`, `delete/`, `export/`, `filters/`, `stats/`, `resend-invites/`, `attach/` (+ `search-controller.ts` to find dancer users), `check-in/` (admin check-in of a roster row).

### Reconciliation — `modules/orgs/events/reconciliation/`
`list-controller.ts`, `resend-controller.ts`, `revoke-controller.ts`, `merge-controller.ts`, `search-users-controller.ts`, `service.ts`, `validator.ts` — invites resend/revoke + manual roster↔account merge.

### CSV uploads — `modules/orgs/events/`
`upload-coaches/`, `upload-dancers/`, `upload-preview/` (parse + preview before commit). Parser at `apps/backend/app/shared/org/csv-parser.ts`.

### Checklist — `modules/orgs/events/checklist/`
`list/`, `create/`, `update/`, `delete/`.

### Audit log — `modules/orgs/events/audit-log/`
`list/`, `stats/`, `children/` — parent/child audit entries.

### Video library — `modules/orgs/events/`
`video-categories/{list,create,delete}/`, `videos/{list,create,update,delete}/`, `videos/audio-upload-url/`.

### Scouting (related, org-scoped) — `modules/orgs/scouting/`
`callbacks/`, `dancers/`, `favorites/`, `notes/`, `rankings/`, `ratings/`, `selections/`, `schools/`, `showcases/`, `routes.ts`.

### Other org module actions — `modules/orgs/`
`get-org/`, `list-orgs/`, `register-dancer/`, `register-school/`, `invite-lookup-school/`, `update-settings/`.

---

## F. ORG EVENTS — database schema
| Path | Tables |
|---|---|
| `apps/backend/app/database/schema/org-events.ts` | `org_events` (name, startDate/endDate, venue, `isActive` w/ one-active-per-org partial unique index, schedulePdfUrl, startTime, timezone), `event_rosters` (userId nullable, type, bibNumber unique-per-event, email, name, expirationDate, checkedInAt), `event_dancer_profiles`, `csv_uploads` (rowsAdded/Updated/Errored, errorDetails), `event_video_categories`, `event_videos` (youtubeId, audioKey), `event_checklist`, `event_audit_log` (action/resource enums, parentId self-ref). |
| `apps/backend/app/database/schema/organizations.ts` | Orgs + memberships tables. |
| `apps/backend/app/database/schema/event-features.ts` | Event feature flags. |
| `apps/backend/app/database/schema/enums.ts` | `auditAction`, `auditResource`, `orgMemberType`, `danceEventType`, etc. |
| `apps/backend/app/database/schema/relations.ts` | Drizzle relations. |
| `apps/backend/app/database/schema/index.ts` | Schema barrel. |
| `apps/backend/app/database/drizzle/` | Generated migrations. |

After schema edits: `pnpm db:generate` → `pnpm db:migrate` (run from `apps/backend`).

---

## G. ORG EVENTS — middleware, shared utils, jobs/emails
| Path | What it is |
|---|---|
| `apps/backend/app/middleware/routes/org.ts` | Resolves org by `:slug`, attaches to ctx. (`org.spec.ts`) |
| `apps/backend/app/middleware/routes/org-member.ts` | Requires org membership. |
| `apps/backend/app/middleware/routes/org-admin.ts` | Requires org admin role. |
| `apps/backend/app/middleware/routes/org-coach.ts` / `org-dancer.ts` | Role gates. (`org-roles.spec.ts`) |
| `apps/backend/app/middleware/routes/org-event.ts` | Resolves/validates the org event. (`org-event.spec.ts`) |
| `apps/backend/app/middleware/routes/org-feature.ts` | Gates on org feature flag. (`org-feature.spec.ts`) |
| `apps/backend/app/shared/org/csv-parser.ts` | Roster CSV parsing (`csv-parser.spec.ts`). |
| `apps/backend/app/shared/org/invite-email.ts` | Org invite email. |
| `apps/backend/app/shared/org/roster-added-email.ts` | Roster-added notification email. |
| `apps/backend/app/shared/org/school-account-invite-email.ts` | School-account invite email. |
| `apps/backend/app/shared/org/preview-token.ts` | Signed preview tokens. |
| `apps/backend/app/shared/org/role-guard.ts` | Role-guard helper (`role-guard.spec.ts`). |
| `apps/backend/commands/backfill-org-memberships.ts`, `backfill-organizations.ts`, `backfill-school-favorites-org.ts` | One-off backfill commands. |

Middleware is named in `apps/backend/start/kernel.ts` (`org()`, `orgMember()`, `orgAdmin()`, `orgEvent()`, `orgFeature()`, ...).

---

## H. PLATFORM EVENTS (the OTHER events system — for disambiguation)

> Public school-hosted + global events browsed in the main app. **Not** the org events system.

### Backend — `apps/backend/app/modules/events/`
`routes.ts` (prefix `events`, `middleware.auth()`), `create-event/`, `edit-event/`, `delete-event/`, `get-event-by-id/`, `get-events/`, `get-event-filters/`, `get-global-events/`, `get-upcoming-events/`, `get-upcoming-global-events/`, `save-event/`, `unsave-event/`.
Schema: `apps/backend/app/database/schema/events.ts` (`dance_events`, `global_dance_events`, `dance_event_schedules`, `dance_event_attendees`, `global_dance_event_attendees`).
Utils: `apps/backend/app/utils/event-time.ts`.

### Frontend — `apps/frontend/src/features/events/`
`page.tsx`, `types.ts`, `api/queries.ts`, `api/mutations.ts`, `components/details/*` (event detail), `components/events/*` (cards/list/skeleton/save), `components/global-events/*`, `components/filters/*` + `filter-sidebar.tsx`.
Admin management: `_admin/.../admin/school-events.tsx`, `_admin/.../admin/global-events.tsx`, `features/admin/components/{school,global}-event-form.tsx`.

---

## Investigated behaviors / findings

> Running log of non-obvious things learned while working tickets, so we don't re-research.

### Roster data model — what populates the dancer/coach/scouting tables
**All** of these tables read from the single `event_rosters` table, filtered only by `eventId + type` (`coach`|`dancer`). None of them list org members by role — a row appears purely because a roster row exists. The 6 display queries:
| Query service | Backs |
|---|---|
| `modules/orgs/events/rosters/list/service.ts` | Admin **Dancers** & **Coaches** tables (`admin/dancers.tsx`, `admin/coaches.tsx`) |
| `modules/orgs/events/rosters/stats/service.ts` | The total/active/pending/checked-in counts on those pages |
| `modules/orgs/events/rosters/export/service.ts` | CSV export |
| `modules/orgs/events/rosters/filters/service.ts` | Coaches "Organization" filter dropdown |
| `modules/orgs/scouting/dancers/list/service.ts` | Coach-facing scouting **dancer search** (`coach/dancers/index.tsx`) |
| `modules/orgs/scouting/schools/list/service.ts` | Dancer-facing **schools** list (`dancer/schools.tsx`) |

How a roster row gets a `userId`: CSV upload (pending, no user) → claimed on register/attend/attach. `isRegistered = userId IS NOT NULL`. `eventDancerProfiles` (event-scoped) overrides `dancerProfiles` (account-level) via COALESCE in scouting.

**`attend` endpoint is admin-gated:** `POST :slug/events/attend` → `AttendEventService` inserts/claims a roster row for the *current user*, but its route middleware ends in `orgAdmin()` — so only org admins can call it, meaning every roster row it creates belongs to an admin. This is the main way admins land in roster tables.

### Admin exclusion → Staff preview rosters (`is_staff`)
**Current approach** (supersedes the earlier `excludeAdminRosters` join, now deleted):
`event_rosters.is_staff` boolean. A staff roster is a real row owned by an admin "viewing
as" a coach/dancer (see spec `docs/superpowers/specs/2026-06-24-admin-staff-preview-rosters-design.md`).
It anchors scouting/check-in FKs but is excluded from participant + aggregate queries via
`eq(eventRosters.isStaff, false)`. Applied to the 6 display queries above (+ planned: rankings,
admin-board). Admins are NEVER real participants, so any admin roster row is by definition a
sandbox. Indexes: email-uniqueness is partial (`WHERE is_staff = false`) so an admin can hold a
coach AND dancer sandbox; `event_rosters_staff_per_user` caps it at one per type per admin.
Backfill: `node ace backfill:staff-rosters` flags pre-existing admin-attended rows.
Two role systems: platform `role` (`admin`/`prodigy_admin`/`user`) on `users`; org `orgRole`
(`admin`/`member`) on `org_memberships`.

### Org member types vs roster types (`organizer`)
`org_member_type` is `coach`|`dancer`|`organizer`, but only `coach`|`dancer` can appear on a
Roster. `event_rosters.type` and `csv_uploads.type` are typed `RosterType` in TypeScript and carry
a `... type in ('coach','dancer')` CHECK, so an Organizer can never become a Roster Entry
(ADR 0003). Predicates are written positively rather than as `<> 'organizer'` — the DDL must not
name a label added in the same migration, and a member type added later then stays out of rosters
until someone decides otherwise.

An Organizer administers the org by definition, whatever `org_memberships.role` says: use
`grantsOrgAdmin()` (`#shared/org/membership`, mirrored in `@/lib/access`) rather than comparing
`role === "admin"` by hand. Coach and dancer remain mutually exclusive per person per org
(`org_memberships_user_id_org_id_index`, now partial), but an organizer membership sits alongside
them — someone who runs an event may also coach at it. That means a user can hold **more than one**
membership row per org: read them all and collapse with `resolveEffectiveMembership()`, and use
`hasMemberType()` for "is this person a coach here?" checks. Participant upserts must pass
`nonOrganizerMembershipConflict()` so Postgres infers the partial index.

**View-as flow (how staff rosters get created):** admin picks "Coach/Dancer" in the
`ViewSwitcher` → `POST :slug/events/view-as { type }` (`modules/orgs/events/view-as/`, admin-only)
upserts their `is_staff` roster. `OrgEventMiddleware` resolves `ctx.orgRoster` using the
`x-act-as-type` request header (set by `lib/api/client.ts` from the `/coach`|`/dancer` path) so an
admin holding both sandboxes gets the right one. `PreviewModeBanner`
(`features/org/components/preview-mode-banner.tsx`, in `coach/route.tsx` + `dancer/route.tsx`)
signals preview mode. Aggregates that must also exclude staff: `scouting/rankings`,
`scouting/callbacks/admin-board`, and the publish chain (`showcases/publish` excludes at source;
`published-callbacks` + `callbacks/dancer-callbacks` have defensive guards). Per-coach-scoped
reads (`favorites/list`, `selections/list`, `callbacks/list`, `dancers/get-by-id`) need no filter —
they key on the viewer's own roster. NOTE: regenerate `frontend types.d.ts` via `pnpm types`
(needs backend running) — the OpenAPI path renamed `/events/attend` → `/events/view-as`.

### ⚠️ Drizzle migration tooling (drizzle-kit 1.0.0-beta.12)
- Migration format is **per-folder**: `app/database/drizzle/<ts>_<name>/{migration.sql, snapshot.json}`.
  There is **no `meta/_journal.json`** — that's normal for v1.0-beta, not corruption.
- **`db:generate` baseline = the latest-timestamp folder's `snapshot.json`.** Parallel worktree
  branches each generate against their own base, so after merges the newest snapshot can be
  **stale** → `generate` re-emits already-merged columns (saw it re-add `checked_in_at`,
  `audio_key`, `start_time`, `timezone`). Shipping that bundled migration would fail (re-ADD
  existing columns).
- **Fix pattern:** run `db:generate` (its fresh snapshot captures true schema → fixes baseline),
  then trim `migration.sql` to only your genuinely-new statements (drifted columns already have
  their own merged migrations). Verify by re-running `db:generate` → must say "No schema changes".
- Apply path is effectively `pnpm db:push` for dev; `db:reset` = `push --force`.

---

## Conventions cheat-sheet
- **Backend module:** `modules/{domain}/{action}/` → `controller.ts` + `service.ts` + `validator.ts`; routes in `{domain}/routes.ts`; register in `start/routes.ts`. Services inject `DatabaseService` (`#database/connection` for raw `db`).
- **Backend aliases:** `#modules/*`, `#database/*`, `#middleware/*`, `#shared/*`, `#start/*`.
- **Frontend feature:** `features/{name}/` has `api/`, `components/`, schemas; features can't import each other; shared code in `components/`, `lib/`, `hooks/`. `@/*` → `src/*`.
- **Frontend types:** regenerate with `pnpm types` (needs backend running) after backend API changes.
- **Verify:** `pnpm typecheck` + `pnpm build` (frontend) / `pnpm typecheck` (backend). Backend tests can hang — don't block on a full test run.
