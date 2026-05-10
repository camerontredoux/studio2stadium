# Callbacks Feature — Design Spec

**Date:** 2026-05-09
**Tickets:** SUM-58, SUM-59, SUM-60, SUM-61, SUM-62
**Supersedes:** `docs/superpowers/plans/2026-04-07-summit-07-callbacks.md`

## Overview

Callbacks let coaches mark dancers for a second-round audition during a live Summit event. Sharpen Up admin staff see a real-time, deduplicated dashboard of all callback bib numbers so they can organize groups on the spot.

**Data flow:** Coach toggles "Call Back" on dancer → API persists → Transmit broadcasts event → Admin dashboard auto-refetches deduplicated bib list.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Coach UI location | Existing dancers scouting page — new column + filter toggle | No page duplication; callbacks are a scouting action |
| Admin UI | New `/admin/callbacks` page, command center layout | Edge-to-edge, dense, matches other admin pages |
| Data model | New `eventCallbacks` table (mirrors `eventFavorites`) | Semantically distinct from favorites; clean separation |
| Real-time | `@adonisjs/transmit` (SSE) with TanStack Query invalidation | Native AdonisJS, one-directional push, Fly.io compatible, Redis pub/sub ready |
| Feature gate | `org.features.callbacks` | Entire feature invisible when disabled |

---

## 1. Database

New `eventCallbacks` table in `apps/backend/app/database/schema/event-features.ts`:

| Column | Type | Constraint |
|--------|------|------------|
| `id` | UUID | PK, defaultRandom |
| `eventId` | UUID FK → `orgEvents` | NOT NULL, cascade delete |
| `coachRosterId` | UUID FK → `eventRosters` | NOT NULL, cascade delete |
| `dancerRosterId` | UUID FK → `eventRosters` | NOT NULL, cascade delete |
| `createdAt` | timestamp | default now |
| `updatedAt` | timestamp | default now |

**Indexes:**
- Unique on `(eventId, coachRosterId, dancerRosterId)`
- Secondary on `(eventId, dancerRosterId)` — for admin aggregate query
- Secondary on `coachRosterId`

Schema goes in the existing `event-features.ts` file alongside `eventFavorites`, `eventRatings`, `eventNotes`, and `eventSchoolSelections`.

---

## 2. Backend API

### Coach endpoints

Added to the existing scouting route group in `apps/backend/app/modules/orgs/scouting/routes.ts` with the same middleware stack (`auth → org → orgEvent → orgMember → orgCoach`).

| Method | Route | Body/Params | Response | Notes |
|--------|-------|-------------|----------|-------|
| `POST` | `/orgs/{slug}/callbacks` | `{ dancerRosterId: uuid }` | 201 / 200 (idempotent) | `onConflictDoNothing`, return existing row if duplicate |
| `DELETE` | `/orgs/{slug}/callbacks/{dancerRosterId}` | path param | 204 | Delete by `(eventId, coachRosterId, dancerRosterId)` |
| `GET` | `/orgs/{slug}/callbacks` | — | Array of dancer summaries | Coach's own callbacks, joined with roster/profile data |

Controller/service/validator pattern identical to `favorites/create`, `favorites/delete`, `favorites/list`.

### Admin endpoint

Separate route group with admin middleware stack (`auth → org → orgEvent → orgMember → orgAdmin`).

| Method | Route | Response | Notes |
|--------|-------|----------|-------|
| `GET` | `/orgs/{slug}/admin/callbacks` | `{ bibs: [...], totalSchools, totalDancers, uniqueCallbacks }` | Deduplicated bib list with coach count per bib, plus summary stats |

**Admin board query:** Group `eventCallbacks` by `dancerRosterId`, join `eventRosters` for bib/name, count coaches per dancer, sort by bib ascending. Summary stats come from counting distinct roster entries by type.

Response shape:
```typescript
{
  bibs: Array<{
    dancerRosterId: string;
    bibNumber: number;
    firstName: string;
    lastName: string;
    coachCount: number;
  }>;
  totalSchools: number;
  totalDancers: number;
  uniqueCallbacks: number;
}
```

### Dancer list enhancement

In `apps/backend/app/modules/orgs/scouting/dancers/list/service.ts`, add an `isCalledBack` boolean subquery using the same EXISTS pattern as `isFavorited`:

```sql
EXISTS (
  SELECT 1 FROM event_callbacks
  WHERE event_callbacks.dancer_roster_id = event_rosters.id
    AND event_callbacks.coach_roster_id = :coachRosterId
    AND event_callbacks.event_id = :eventId
)
```

This field is returned alongside `isFavorited`, `rating`, `hasNote`, and `interestedInMySchool` in the dancer list response.

### Transmit broadcast

After callback create/delete, broadcast to channel `orgs/{slug}/callbacks`:

```typescript
transmit.broadcast(`orgs/${slug}/callbacks`, { type: 'callback-updated' });
```

No payload data — the client just invalidates and refetches.

---

## 3. Frontend — Coach Side

All changes are on the **existing** dancers scouting page (`/coach/dancers`). No new coach route for callbacks.

### 3a. Filter toggle

New `calledBack` boolean state alongside `favorited`, `rated`, `hasNotes`. New `IconToggle` in `dancer-filter-toolbar.tsx` using a `Megaphone` icon (from lucide-react), labeled "Called back". Client-side filtering: `result.filter(d => d.isCalledBack)`.

### 3b. Table column

New last column in the dancer table: "Call Back" button.

- **Default state:** Outlined button, label "Call Back"
- **Active state:** Filled black background, white checkmark + label "Called Back"
- Click toggles the callback with optimistic update (same pattern as favorite heart toggle)
- Mutation: `POST /orgs/{slug}/callbacks` or `DELETE /orgs/{slug}/callbacks/{dancerRosterId}`
- On mutation success, invalidate `scoutingQueries.dancers` query

### 3c. Callback count indicator

At the top of the dancer list area, show:
- "My callbacks: **X** dancers selected"
- Subtitle: "Your selections go directly to Sharpen Up."

Count derived from filtering the loaded dancer list by `isCalledBack === true`. Updates immediately via optimistic state.

### 3d. Dancer sheet

Add callback button to the dancer detail sheet/drawer, alongside the existing favorite button. Same toggle behavior.

---

## 4. Frontend — Admin Callbacks Page

### Route

New file: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`

Route gated: if `org.features.callbacks` is falsy, redirect to admin index in `beforeLoad`.

### Admin sidebar

New entry in `admin-sidebar.tsx`. Add a "Live Event" section (or add to existing section):
- Label: "Callbacks"
- Icon: `Megaphone` (lucide-react)
- Route: `/$orgSlug/admin/callbacks`
- Only rendered when `org.features.callbacks` is truthy

### Page layout (command center, edge-to-edge)

**Stat cards row** — Three cards side by side at top:

| Card | Value | Style |
|------|-------|-------|
| Total Schools | Count from coach roster | Standard card |
| Total Dancers | Count from dancer roster | Standard card |
| Callbacks Selected | Unique bib count | Dark/highlighted card, visually distinct |

**Live indicator** — Below stats: "Live — updating as coaches select" with a pulsing dot.

**Bib number grid** — Full-width grid of bib tiles:
- Large rounded black tiles with white bib number text
- Sorted numerically ascending
- Each bib appears once (deduplicated across coaches)
- Grid is responsive — wraps naturally

**Footer:**
- Left: "{X} numbers · no repeats"
- Right: "Sharpen Up staff decides how to split these into groups based on total count."

### Real-time via Transmit

Admin page subscribes to `orgs/{slug}/callbacks` channel using `@adonisjs/transmit-client`. On receiving any event, call `queryClient.invalidateQueries()` on the admin callbacks query key. This triggers a refetch of the deduplicated bib list.

Coach pages do NOT subscribe to transmit — they use optimistic updates locally.

---

## 5. Real-time Infrastructure (Transmit)

### Backend setup

1. Install `@adonisjs/transmit`
2. Configure transmit provider in `adonisrc.ts`
3. Register transmit routes (transmit handles its own SSE endpoint)
4. Define authorized channel: `orgs/:slug/callbacks` — verify the connecting user has admin membership for the org

### Frontend setup

1. Install `@adonisjs/transmit-client`
2. Create a `useTransmitSubscription(channel, onEvent)` hook that:
   - Connects to the transmit SSE endpoint
   - Subscribes to the specified channel
   - Calls `onEvent` callback on each event
   - Cleans up subscription on unmount
3. Use in admin callbacks page to invalidate queries on events

### Channel authorization

The `orgs/:slug/callbacks` channel should verify the subscribing user is an admin member of the org. Transmit supports channel authorization middleware.

---

## 6. Feature Gate

The entire callback feature is behind `org.features.callbacks`:

- **Backend:** All callback routes return 404 when feature is disabled (middleware or route-level check)
- **Frontend coach:** Filter toggle, table column, sheet button, and count indicator are not rendered
- **Frontend admin:** Sidebar link hidden, route redirects to admin index
- **Feature flag check:** Use existing `hasFeature("callbacks")` pattern from org context

---

## 7. Data Isolation

Callbacks follow the same isolation rules as favorites, ratings, and notes:

- Stored with composite key `(eventId, coachRosterId, dancerRosterId)`
- Coach endpoints only return/modify the authenticated coach's own callbacks
- Admin endpoint returns aggregated data (deduplicated bibs with coach count) — never individual coach selections
- Dancers are never notified of callback selections
