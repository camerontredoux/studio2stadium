# Multi-Tenant Organization Platform Design

**Date:** 2026-04-01
**Status:** Draft
**Project:** Sharpen Up "The Summit" (and future org partners)

---

## Overview

S2S is expanding from a single-platform product to a multi-tenant system where external organizations (Summit, Prodigy, future partners) get white-labeled, feature-gated event management experiences built on shared S2S infrastructure.

Each org gets:
- Branded UI (logo, colors) served under path-based routes (`/summit/...`, `/prodigy/...`)
- One active managed event at a time with rich features (rosters, scouting, videos, schedules)
- Configurable feature set via a JSONB column (no code changes to enable/disable features)
- Admin dashboard for event and participant management
- Participants who are real S2S users from day one (not org-only accounts)

This replaces the existing `platform_name` enum and `user_platforms` table with a proper `organizations` + `org_memberships` model.

### Key Constraints

- **Event date:** June 13, 2026. Profile blast: May 22, 2026. Testing window: May 22 - June 6.
- **Prodigy has no features built yet** — clean migration to the new model.
- **Schools always have S2S accounts.** There are no org-only schools.
- **New dancers who register through an org event become full S2S users immediately** with a time-limited premium grant.

---

## 1. Data Model: Organizations & Membership

### `organizations`

Replaces the `platform_name` enum. Each partner org is a row.

```
organizations
  id              uuid PK
  name            varchar           "Sharpen Up - The Summit"
  slug            varchar UNIQUE    "summit" (used in URLs + routing)
  logo_url        varchar?
  primary_color   varchar?          hex color
  accent_color    varchar?          hex color
  features        jsonb             feature toggles (see below)
  settings        jsonb             non-boolean config (see below)
  created_at      timestamp
  updated_at      timestamp
```

**`features` JSONB shape:**

```json
{
  "callbacks": true,
  "qna": true,
  "school_selections": true,
  "video_library": true,
  "video_coach_assignment": false,
  "video_dancer_assignment": false,
  "schedule_pdf": true
}
```

**`settings` JSONB shape:**

```json
{
  "premium_period_days": 90,
  "max_school_selections": 3,
  "rating_scale_max": 10,
  "registration_url_path": "SharpenUpSummit"
}
```

Both validated by a VineJS schema on read/write for type safety without requiring migrations per new feature.

### `org_memberships`

Replaces `user_platforms`. A user's relationship to an org.

```
org_memberships
  id              uuid PK
  user_id         uuid FK -> users
  org_id          uuid FK -> organizations
  role            enum("admin", "member")
  type            enum("coach", "dancer")
  created_at      timestamp
  updated_at      timestamp

  UNIQUE(user_id, org_id)
```

- `role` controls permissions: admin can manage the org, member is a participant.
- `type` controls what you are: coach (school) or dancer.
- An org admin who is also a coach has `role: "admin", type: "coach"` — a single row. Admin role implies full org access, so middleware checks `role = 'admin' OR type = 'coach'` for coach routes.
- A user can be a dancer in one org and a coach in another (separate rows).
- S2S global roles stay on the `users` table: `admin` (superadmin) and `user`. The `prodigy_admin` role is removed from the global enum.

### Migration from existing model

1. Create `organizations` rows for `"core"` and `"prodigy"`.
2. Migrate `user_platforms` rows to `org_memberships` (core users become members, users with `prodigy_admin` role get `org_memberships.role = "admin"` for the prodigy org).
3. Replace `school_favorites.platformName` with `source_org_id uuid? FK -> organizations` (nullable; null = core S2S).
4. Drop `user_platforms` table, `platform_name` enum, and remove `prodigy_admin` from the `role` enum on `users`.

---

## 2. Data Model: Events & Rosters

### `org_events`

Managed events — rich, interactive, one active at a time per org. Distinct from the existing S2S "listing events" (informational cards).

```
org_events
  id                uuid PK
  org_id            uuid FK -> organizations
  name              varchar           "The Summit June 2026"
  start_date        date
  end_date          date
  venue_name        varchar?
  venue_address     text?
  contact_email     varchar?
  is_active         boolean
  schedule_pdf_url  varchar?
  created_at        timestamp
  updated_at        timestamp

  PARTIAL UNIQUE(org_id) WHERE is_active = true
    -- enforces one active event per org
```

### `event_rosters`

The central participation record. One table for both coaches and dancers.

```
event_rosters
  id                uuid PK
  event_id          uuid FK -> org_events
  user_id           uuid? FK -> users       null until registered/linked
  type              enum("coach", "dancer")
  bib_number        integer?                dancers only, from CSV
  email             varchar                 from CSV, used for S2S matching
  first_name        varchar                 from CSV
  last_name         varchar                 from CSV
  organization      varchar?                coaches: school/program name
  is_registered     boolean                 true once S2S account linked
  expiration_date   date?                   event_end + premium_period_days
  csv_upload_id     uuid? FK -> csv_uploads
  created_at        timestamp
  updated_at        timestamp

  UNIQUE(event_id, email)
  UNIQUE(event_id, bib_number) WHERE bib_number IS NOT NULL
  INDEX(event_id, type)
  INDEX(user_id)
```

### `event_dancer_profiles`

Supplementary profile data for dancers within an event. Keeps `event_rosters` clean and generic. For existing S2S users, the source of truth for profile data is `dancer_profiles` — this table holds only event-specific overrides/extras.

```
event_dancer_profiles
  id                  uuid PK
  roster_id           uuid FK -> event_rosters (1:1)
  profile_photo_url   varchar?
  grad_year           integer?
  gpa                 decimal?
  studio              varchar?
  state               varchar?
  height              varchar?
  dance_styles        text[]?         postgres array
  bio                 text?
  extra               jsonb?          escape hatch for org-specific fields
  created_at          timestamp
  updated_at          timestamp

  UNIQUE(roster_id)
```

### Profile data strategy

- **Existing S2S dancer joins org event:** Coach view reads from `dancer_profiles` (source of truth). The `event_dancer_profiles` row is created but its typed columns (grad_year, gpa, studio, etc.) stay null — they are only used when `dancer_profiles` doesn't exist. The `bio` and `extra` fields hold event-specific data. Coach queries always JOIN `dancer_profiles` first, falling back to `event_dancer_profiles` columns only for unlinked rosters.
- **New dancer registers through org event:** Registration flow creates `users` row + `dancer_profiles` row (standard S2S onboarding). Profile data goes into `dancer_profiles`. `event_dancer_profiles` only holds event-specific fields (bio, extra).
- **Post-event:** `dancer_profiles` already exists. No conversion needed. Premium grant expires, access downgrades automatically.

**Coach query pattern:**

```sql
SELECT
  r.bib_number,
  COALESCE(dp.first_name, r.first_name) AS first_name,
  COALESCE(dp.last_name, r.last_name) AS last_name,
  dp.profile_photo_url,
  dp.gpa, dp.grad_year, dp.studio, dp.state,
  edp.bio AS event_bio,
  edp.extra
FROM event_rosters r
LEFT JOIN dancer_profiles dp ON dp.user_id = r.user_id
LEFT JOIN event_dancer_profiles edp ON edp.roster_id = r.id
WHERE r.event_id = :eventId AND r.type = 'dancer'
```

When `dancer_profiles` exists (user linked), its data is used. When not (unregistered dancer from CSV), the roster's CSV-provided name fields are the fallback.

### `csv_uploads`

Audit trail for admin CSV uploads.

```
csv_uploads
  id              uuid PK
  event_id        uuid FK -> org_events
  type            varchar         "coach" | "dancer"
  file_url        varchar         raw CSV stored
  uploaded_by     uuid FK -> users
  rows_added      integer
  rows_updated    integer
  rows_errored    integer
  error_details   jsonb?          [{ row: 3, reason: "missing email" }]
  created_at      timestamp
  updated_at      timestamp
```

### CSV Upload Flows

**Coach CSV upload:**

1. Parse and validate (email required, organization name required).
2. For each row, match email against `users` + `school_profiles`.
3. If match found: create `event_rosters` row with `user_id` linked, `is_registered: true`. Create `org_membership` if not exists.
4. If no match: create `event_rosters` row with `user_id: null`, `is_registered: false`. Send invite email to create S2S school account. Unregistered coaches appear in the roster for informational purposes but are not interactive (no clickable profile link) until they register.
5. Re-upload matches on email within the event — updates existing rows rather than duplicating.

**Dancer CSV upload:**

1. Parse and validate (email, first_name, last_name, bib_number required).
2. For each row, match email against `users` table.
3. If match found (existing S2S user): create `event_rosters` row with `user_id` linked, `is_registered: true`. Create `org_membership`. Create `premium_grant`. Send "your access is ready" email.
4. If no match: create `event_rosters` row with `user_id: null`, `is_registered: false`. Send registration invite email with token.
5. Bib numbers come from CSV — system does not auto-assign. Re-upload is idempotent on email.

### `premium_grants`

Time-limited premium access granted through org event participation. Sits alongside the existing Stripe-based `user_subscriptions`.

```
premium_grants
  id              uuid PK
  user_id         uuid FK -> users
  source_type     varchar         "org_event"
  source_id       uuid? FK -> org_events
  granted_at      timestamp
  expires_at      timestamp       event_end + premium_period_days
  revoked_at      timestamp?
  created_at      timestamp
  updated_at      timestamp

  INDEX(user_id, expires_at)
```

**Premium access check (updated logic):**

A user has premium access if:
- `user_subscriptions` has an active Stripe/RevenueCat subscription, OR
- `premium_grants` has a row where `expires_at > now()` AND `revoked_at IS NULL`, OR
- `users.role = 'admin'` (superadmin bypass)

This slots into the existing `SubscribedMiddleware` and `GET /subscriptions` endpoint with an OR clause. No new middleware needed.

**No expiration job needed.** The original ticket (STU-205) proposed a daily job to "convert Summit profiles to S2S freemium." With this design, dancers are already S2S users from registration. The premium grant simply expires by timestamp — the access check is time-based, not state-based. No background job, no conversion logic.

---

## 3. Data Model: Event Features

All event feature tables use `event_rosters` as the participant identity. Coach actions are keyed by `coach_roster_id`, ensuring full data isolation per coach.

### `event_favorites`

Coach shortlist during an event. Separate from core S2S `school_favorites`.

```
event_favorites
  id                  uuid PK
  event_id            uuid FK -> org_events
  coach_roster_id     uuid FK -> event_rosters
  dancer_roster_id    uuid FK -> event_rosters
  created_at          timestamp

  UNIQUE(event_id, coach_roster_id, dancer_roster_id)
```

### `event_notes`

Private coach notes on dancers.

```
event_notes
  id                  uuid PK
  event_id            uuid FK -> org_events
  coach_roster_id     uuid FK -> event_rosters
  dancer_roster_id    uuid FK -> event_rosters
  content             text
  created_at          timestamp
  updated_at          timestamp

  UNIQUE(event_id, coach_roster_id, dancer_roster_id)
```

### `event_ratings`

Coach numeric rating for dancers.

```
event_ratings
  id                  uuid PK
  event_id            uuid FK -> org_events
  coach_roster_id     uuid FK -> event_rosters
  dancer_roster_id    uuid FK -> event_rosters
  rating              smallint          1 to org.settings.rating_scale_max
  created_at          timestamp
  updated_at          timestamp

  UNIQUE(event_id, coach_roster_id, dancer_roster_id)
```

### `event_school_selections`

Dancer's top N school picks. Privacy-critical.

```
event_school_selections
  id                  uuid PK
  event_id            uuid FK -> org_events
  dancer_roster_id    uuid FK -> event_rosters
  coach_roster_id     uuid FK -> event_rosters   (the school selected)
  rank                smallint                    1, 2, or 3
  created_at          timestamp

  UNIQUE(event_id, dancer_roster_id, coach_roster_id)
```

**Privacy enforcement:**
- Coach API: returns only a boolean `favorited_my_school` — whether the dancer selected the requesting coach's school. Never returns other schools or rankings.
- Admin API: returns all selections for all dancers (aggregate view).
- Dancer API: returns their own selections, editable.

### `event_videos`

Video library entries (YouTube links).

```
event_videos
  id                  uuid PK
  event_id            uuid FK -> org_events
  title               varchar
  description         text?
  youtube_url         varchar
  thumbnail_url       varchar?
  sort_order          integer
  created_at          timestamp
  updated_at          timestamp
```

### `event_video_assignments` (feature-gated)

For orgs with `video_coach_assignment` or `video_dancer_assignment` enabled.

```
event_video_assignments
  id                  uuid PK
  video_id            uuid FK -> event_videos
  roster_id           uuid FK -> event_rosters    (coach or dancer)
  assigned_by         uuid FK -> users             (admin)
  created_at          timestamp

  UNIQUE(video_id, roster_id)
```

When the feature is off, all videos are visible to all participants. When on, admins can assign videos to specific coaches or dancers, enabling filtered views.

### `event_callbacks` (feature-gated)

Coach callback selections. Structurally identical to favorites but semantically different.

```
event_callbacks
  id                  uuid PK
  event_id            uuid FK -> org_events
  coach_roster_id     uuid FK -> event_rosters
  dancer_roster_id    uuid FK -> event_rosters
  created_at          timestamp

  UNIQUE(event_id, coach_roster_id, dancer_roster_id)
```

Admin dashboard shows deduplicated bib numbers across all coaches.

### Data isolation enforcement

All coach-scoped queries (notes, ratings, favorites, callbacks) filter by `coach_roster_id`. This ID is never accepted from the client — it is resolved server-side from the authenticated user's session + active event roster. This prevents any cross-coach data leakage.

```sql
-- Example: get notes for a dancer
SELECT * FROM event_notes
WHERE event_id = :eventId
  AND coach_roster_id = :resolvedFromSession
  AND dancer_roster_id = :dancerRosterId
```

### Table hierarchy

```
org_events
  +-- csv_uploads
  +-- event_rosters
  |     +-- event_dancer_profiles (1:1, dancers only)
  +-- event_favorites
  +-- event_notes
  +-- event_ratings
  +-- event_school_selections
  +-- event_videos
  |     +-- event_video_assignments (feature-gated)
  +-- event_callbacks (feature-gated)
```

---

## 4. Auth & Routing

### Backend Middleware

Existing S2S middleware remains unchanged: `auth`, `dancer`, `school`, `premium`, `profile`.

New org-scoped middleware:

| Middleware | Purpose |
|---|---|
| `org` | Resolves org from `:slug` URL param, attaches `ctx.org`. 404 if not found. |
| `orgEvent` | Resolves the org's active event, attaches `ctx.orgEvent`. 404 if no active event. |
| `orgMember` | Checks user has `org_memberships` row for this org. Resolves `event_rosters` row, attaches `ctx.orgRoster`. 403 if not a member. |
| `orgAdmin` | Checks `org_memberships.role = "admin"` for this org. 403 if not admin. |
| `orgCoach` | Checks `org_memberships.type = "coach"`. 403 if not coach. |
| `orgDancer` | Checks `org_memberships.type = "dancer"`. 403 if not dancer. |
| `orgFeature(key)` | Checks `ctx.org.features[key] === true`. 404 if feature disabled. |

**Composition examples:**

```
GET  /orgs/:slug/dancers        → auth, org, orgEvent, orgMember, orgCoach
POST /orgs/:slug/admin/upload   → auth, org, orgEvent, orgAdmin
POST /orgs/:slug/callbacks      → auth, org, orgEvent, orgMember, orgCoach, orgFeature("callbacks")
GET  /orgs/:slug (public)       → org only (no auth — login page needs branding)
```

**Context after middleware runs:**

```typescript
ctx.org          // { id, slug, name, features, settings, logoUrl, ... }
ctx.orgEvent     // { id, name, startDate, endDate, ... }
ctx.orgRoster    // { id, type, bibNumber, isRegistered, ... }
```

### Backend Route Structure

All org routes live under `app/modules/orgs/routes.ts`, prefixed with `/orgs/:slug`.

**Public routes (no auth):**
- `GET /orgs/:slug` — org info + branding (login page needs this)
- `POST /orgs/:slug/register` — dancer self-registration

**Admin routes (auth + org + orgEvent + orgAdmin):**
- `POST /orgs/:slug/events` — create event
- `PUT /orgs/:slug/events/:id` — update/activate event
- `POST /orgs/:slug/events/schedule` — upload schedule PDF
- `POST /orgs/:slug/coaches/upload` — coach CSV upload
- `POST /orgs/:slug/dancers/upload` — dancer CSV upload
- `PUT /orgs/:slug/coaches/:id` — edit coach record
- `PUT /orgs/:slug/dancers/:id` — edit dancer record
- `GET /orgs/:slug/stats` — dashboard stats
- `GET /orgs/:slug/school-selections` — all selections (admin only)

**Coach routes (auth + org + orgEvent + orgMember + orgCoach):**
- `GET /orgs/:slug/dancers` — search/list dancers (query params: `?search=`, `?bib=`, `?favorited_my_school=true`)
- `GET /orgs/:slug/dancers/:id` — full dancer profile
- `POST /orgs/:slug/favorites` — favorite a dancer
- `DELETE /orgs/:slug/favorites/:id` — unfavorite
- `GET /orgs/:slug/favorites` — my favorites list
- `POST /orgs/:slug/dancers/:id/notes` — add note
- `PUT /orgs/:slug/notes/:id` — edit note
- `DELETE /orgs/:slug/notes/:id` — delete note
- `POST /orgs/:slug/dancers/:id/rating` — set rating
- `GET /orgs/:slug/rankings` — my ranked dancers

**Dancer routes (auth + org + orgEvent + orgMember + orgDancer):**
- `GET /orgs/:slug/profile` — my event profile
- `PUT /orgs/:slug/profile` — edit event profile
- `PUT /orgs/:slug/school-selections` — set top 3
- `GET /orgs/:slug/school-selections` — my selections

**Shared routes (auth + org + orgEvent + orgMember):**
- `GET /orgs/:slug/videos` — video library
- `GET /orgs/:slug/event-info` — event details + schedule

**Feature-gated routes (+ orgFeature check):**
- `POST /orgs/:slug/callbacks` — callback a dancer (callbacks)
- `DELETE /orgs/:slug/callbacks/:id` — remove callback (callbacks)
- `GET /orgs/:slug/callbacks` — my callbacks (callbacks)
- `GET /orgs/:slug/admin/callbacks` — admin callback dashboard (callbacks)

### Frontend Route Structure

```
src/routes/
  _org/                                   NEW — org layout wrapper
    route.tsx                             OrgProvider: loads org, sets theme
    $orgSlug/
      login.tsx                           org-branded login
      register.tsx                        dancer registration from invite
      _authenticated/                     requires auth + org membership
        route.tsx                         checks membership, resolves roster
        admin/
          index.tsx                       admin dashboard + stats
          events.tsx                      create/manage events
          coaches.tsx                     coach list + CSV upload
          dancers.tsx                     dancer list + CSV upload
          videos.tsx                      video library management
          callbacks.tsx                   feature-gated
        coach/
          index.tsx                       coach dashboard/landing
          dancers/
            index.tsx                     search + roster table
            $dancerId.tsx                 full dancer profile (notes, rating, favorite)
          favorites.tsx                   my favorites list
          rankings.tsx                    my ranked dancers
          event-info.tsx                  event details + schedule PDF
          callbacks.tsx                   feature-gated
        dancer/
          index.tsx                       dancer dashboard
          profile.tsx                     view/edit profile
          schools.tsx                     top 3 school selection
          videos.tsx                      video library
```

---

## 5. Frontend Architecture

### OrgProvider & Context

Every org page is wrapped in `OrgProvider`, loaded by the `_org/route.tsx` layout.

```typescript
// OrgContext shape
interface OrgContext {
  org: { id: string; slug: string; name: string; logoUrl: string | null; primaryColor: string | null; accentColor: string | null }
  features: Record<string, boolean>
  settings: Record<string, unknown>
  event: OrgEvent | null
  roster: EventRoster | null
  membership: { role: "admin" | "member"; type: "coach" | "dancer" } | null
  isAdmin: boolean
  isCoach: boolean
  isDancer: boolean
  hasFeature: (key: string) => boolean
}
```

**Loading flow:**

1. User hits `/:orgSlug/*`.
2. `_org/route.tsx` calls `GET /orgs/:slug` (public, no auth needed).
3. Sets CSS variables from org branding (`--org-primary`, `--org-accent`).
4. Provides `OrgContext` to all child routes.
5. `_authenticated/route.tsx` checks auth, loads membership + roster.

### Theming

Pure CSS variables set by `OrgProvider`. No conditional rendering for branding.

```css
:root {
  --org-primary: #1a1a2e;
  --org-accent: #e94560;
}
```

Components use `var(--org-primary)` etc. Adding a new org with different branding is just different values — no component changes.

### Feature Gating

```typescript
// In components:
const { hasFeature } = useOrg()

{hasFeature("callbacks") && <CallbackButton />}
```

### Component Organization

```
src/features/org/
  context/
    org-provider.tsx
    use-org.ts
  components/
    org-nav.tsx               role-aware navigation
    org-header.tsx            branded header
    roster-table.tsx          reusable participant table
    csv-uploader.tsx          drag-and-drop CSV upload
    stat-card.tsx             dashboard stat display
    favorite-button.tsx       heart toggle
    rating-input.tsx          1-10 scale
    notes-editor.tsx          add/edit/delete notes
    school-selector.tsx       ranked multi-select
    video-card.tsx            youtube thumbnail + title
    pdf-viewer.tsx            schedule PDF viewer
  hooks/
    use-org-api.ts            org-scoped API calls
    use-roster.ts             current user's roster
    use-event.ts              active event data
  api/
    org-api.ts                typed client for /orgs/:slug/*
```

Nothing in `features/org/` imports from a specific org. Components are generic and adapt via `OrgContext`. Adding a new org is a database row — zero new frontend components.

### Role-Based Routing

```typescript
// _authenticated/route.tsx
const { isAdmin, isCoach, isDancer } = useOrg()

if (pathname.includes('/admin') && !isAdmin) redirect(`/${slug}/login`)
if (pathname.includes('/coach') && !isCoach) redirect(`/${slug}/login`)
if (pathname.includes('/dancer') && !isDancer) redirect(`/${slug}/login`)
```

The existing `access.ts` permission system stays for core S2S pages. The org system is separate and simpler.

---

## 6. Existing System Changes

### `school_favorites` table

Replace `platformName` enum column with:

```
source_org_id   uuid? FK -> organizations
```

- `null` = found on core S2S
- UUID = found via org event

Purely metadata. Does not restrict the favorite in any way.

### `user_subscriptions` / Premium check

`SubscribedMiddleware` and `GET /subscriptions` endpoint updated to check:

```
user has premium if:
  user_subscriptions has active sub (existing logic)
  OR premium_grants has unexpired, unrevoked row
  OR users.role = 'admin'
```

### `GET /subscriptions` response (updated)

```json
{
  "subscribed": true,
  "currentPeriodEnd": "2026-09-13T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "source": "org_event",
  "grantedBy": "summit"
}
```

### Tables/enums removed

- `user_platforms` table — replaced by `org_memberships`
- `platform_name` enum — replaced by `organizations.slug`
- `prodigy_admin` value from `role` enum — replaced by `org_memberships.role = "admin"`

### Middleware updated

- `SubscribedMiddleware` — add `premium_grants` check
- `isAdmin()` utility — remove `prodigy_admin` check (no longer exists)
- Admin middleware — unchanged (still checks global `role = "admin"` for S2S superadmin)

---

## 7. Ticket Mapping

The 62 Linear tickets from the Summit project map to this design as follows. Tickets marked with * are eliminated or simplified by the architecture.

| Phase | Tickets | Design Section |
|---|---|---|
| Foundation (events, auth) | STU-207, 208, 157, 160, 158, 159 | Sections 2, 4 |
| CSV Upload & Linking | STU-162, 163, 164, 165 | Section 2 (CSV flows) |
| Coach Core | STU-170, 171, 172, 173, 174, 168 | Sections 4, 5 |
| Dancer Core | STU-190, 191, 192, 193, 194, 198, 199, 169 | Sections 2, 4, 5 |
| Coach Scouting | STU-175, 176, 177, 178, 179, 180, 181, 182, 183, 184 | Section 3 |
| School Selections | STU-195, 196, 197 | Section 3 |
| Notes & Rankings | STU-185, 186, 187, 188, 189 | Section 3 |
| Admin Dashboards | STU-166, 167, 209 | Section 5 |
| Video Library | STU-219, 220, 221, 210 | Section 3 |
| Cross-Platform | STU-200, 201, 202, 161, 203 | Sections 1, 4 |
| Lifecycle* | STU-204, 205*, 206 | Section 2 (premium_grants) |
| Callbacks | STU-222, 223, 224, 225, 226 | Section 3 |

*STU-205 (auto-conversion job) is eliminated — premium grants expire by timestamp, no job needed.*
