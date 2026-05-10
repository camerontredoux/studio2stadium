# Coach Portal — Dancer Discovery & Scouting

**Date:** 2026-04-23
**Branch:** plan/summit-04-coach-scouting
**Tickets:** SUM-17, SUM-18, SUM-19, SUM-20, SUM-21, SUM-22, SUM-23, SUM-24, SUM-26, SUM-27, SUM-28, SUM-29, SUM-30, SUM-31, SUM-32, SUM-33, SUM-39, SUM-40

## Overview

Client-facing coach portal for scouting dancers at live Summit events. Coaches log in via the `_org` login page and land on an information-dense event info page that doubles as the dashboard. The core workflow is searching and evaluating dancers through a table-based interface with side-sheet quick view, favorites, rankings, and private notes/ratings. Includes full end-to-end Top 3 school selection system with strict per-coach privacy enforcement.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Landing page | Event Info (dashboard-style) | Stat cards, countdown, quick links — coaches orient here then jump to search |
| Dancer detail | Side sheet (not page nav) | Rapid scouting at live events; table stays visible, no scroll position loss |
| Full profile | Link to `/$username` on S2S | Avoids duplicating profile page; deep review happens on main platform |
| Mobile pattern | Card list + full-screen sheet | Tables unusable below 640px; cards show condensed critical info |
| Rating scale | 1-5 stars (integer) | Uses existing Rating/RatingItem components; expandable later |
| Pagination | Client-side paginated (desktop), infinite scroll (mobile) | Dataset likely <500 dancers; avoids server round-trips during event |
| School selection storage | `coachRosterId` FK (not school string) | Proper FK, no string matching, trivial coach-side query |
| Callbacks | Deferred to separate phase | Marked optional in tickets, involves real-time/websocket concerns |
| Architecture | Extend `features/org/` module | Scouting already lives there; avoids refactoring or new feature boundaries |
| Nav items | 4 + footer dropdown | Search, Favorites, Rankings, Event Info in sidebar; Profile in footer menu |

## Route Structure

```
coach/
  route.tsx          # layout: sidebar + content area, coach/admin guard
  index.tsx          # redirect to /event-info (landing page)
  dancers/
    index.tsx        # dancer search table
  favorites.tsx      # favorites table
  rankings.tsx       # rankings table
  event-info.tsx     # event details + schedule PDF + stats
```

## Page Designs

### Event Info (Landing Page)

Information-dense layout inspired by admin dashboard. Right sidebar on xl breakpoint, stacks below on smaller screens.

**Main content area:**
- Event name + phase badge (Live/Upcoming/Imminent/Wrapped)
- 3-column stat cells: Dancers attending, Schools attending, Your Favorites count
- Event Schedule Frame with embedded PDF viewer (fallback: "Schedule coming soon")
- Quick Links Frame: Search Dancers, My Favorites, My Rankings, Edit Profile (external to S2S)

**Right sidebar (320px on xl):**
- Countdown: "Day X of Z total" + progress bar + percentage
- Details: date range, venue name + address, contact email, download PDF link
- Your Program card: coach's school logo/initials, university name, coach name, "Edit on S2S" link

**Responsive:** xl = side-by-side; <xl = details become inline 2-col bar above schedule; mobile = fully stacked.

### Dancer Search Page

```
Desktop/Tablet (>=640px):
  ┌─────────────────────────────────────────────────┐
  │ [Search by name or bib #...]        [Filter v]  │
  │ [ ] Show only dancers interested in [My School] │
  └─────────────────────────────────────────────────┘
  ┌─ Frame ─────────────────────────────────────────┐
  │ Bib# | Name        | Yr  | Studio | GPA |♥|✎|⭐│
  │ ─────┼─────────────┼─────┼────────┼─────┼──┼──┼─│
  │ 001  | Smith, Jane | 2027| Elite  | 3.8 |●|•|  │
  │ 002  | Lee, Amy    | 2026| Star D | 3.5 | | |★ │
  │ ...                                              │
  │ Viewing [1-25 v] of 147       [< Prev][Next >]  │
  └──────────────────────────────────────────────────┘

Mobile (<640px):
  Sticky search header, card list with infinite scroll.
  Cards show: bib (prominent), name, "yr · studio · gpa",
  note preview (1 line), rating stars, fav/interest icons.
  Tap card → full-screen sheet overlay.
```

**Table columns:** Bib# (60px, sort), Name (flex, sort by last), Grad Year (70px, sort), Studio (flex, ellipsis), GPA (60px, sort), Favorite toggle (40px), Notes indicator (40px), School Interest (40px).

**Search:** Single input, auto-detects numeric (bib exact match) vs text (name partial, case-insensitive). Debounced 300ms. The search page fetches the full dancer dataset on mount (events are <500 dancers) and filters client-side via TanStack Table's `getFilteredRowModel()`. The existing server-side `search`/`bib` query params remain available as a fallback but are not used in the default flow.

**School interest filter:** Toggle "Interested in [School Name]". Additive with search. Only shows boolean — never reveals other selections.

### DancerSheet (Side Sheet / Mobile Full-Screen)

Opens on row/card click from search, favorites, or rankings.

**Desktop:** 420px slide-from-right sheet. ESC or click-outside to close.
**Mobile:** Full-screen overlay. Back button or swipe to close.

**Content:**
- Photo, bib, name, class year, studio, high school, state, GPA
- Favorite toggle button + "Interested in your school" badge (read-only)
- Rating: 1-5 star input (interactive, saves immediately)
- Notes: autosaving textarea (2s debounce, beforeunload guard)
- Bio preview (truncated)
- "View Full Profile" link to `/$username`

Opening the sheet does NOT change the URL. Scroll position preserved on close.

### Favorites Page

Same DancerTable component, filtered to favorited dancers only.

**Header:** "My Favorites (N)"
**Columns:** Bib, Name, Grad Year, Studio, GPA, Rating (inline stars), Notes indicator
**Sort:** Rating DESC, then favorited-at DESC
**Empty state:** "No favorites yet. Tap the heart on any dancer to add them here." + [Search Dancers] link
**Behavior:** Unfavoriting removes row immediately (optimistic).

### Rankings Page

All dancers the coach has interacted with (favorited OR rated OR noted).

**Header:** "My Rankings (N)" + [Copy Notes] button
**Columns:** Rank #, Bib, Name, Grad Year, GPA, Rating (inline stars), Note preview
**Sort:** Rating DESC (primary, immutable), secondary columns re-sortable
**Copy Notes:** Exports to clipboard as `#BIB First Last (rating/5)\nNote text`
**Empty state:** "No ratings yet. Rate dancers from the search list to build your rankings."

## Top 3 School Selection System

### Database Schema

```sql
CREATE TABLE event_school_selections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES org_events(id),
  dancer_roster_id UUID NOT NULL REFERENCES event_rosters(id),
  coach_roster_id  UUID NOT NULL REFERENCES event_rosters(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (event_id, dancer_roster_id, coach_roster_id)
);

CREATE INDEX idx_ess_dancer ON event_school_selections (event_id, dancer_roster_id);
CREATE INDEX idx_ess_coach  ON event_school_selections (event_id, coach_roster_id);
```

Max 3 selections per dancer per event enforced at service layer.

### Backend Endpoints

**Dancer-facing (behind orgDancer middleware):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/orgs/{slug}/schools` | List all coach programs for active event |
| GET | `/orgs/{slug}/my-selections` | Dancer's current picks (max 3) |
| POST | `/orgs/{slug}/my-selections` | Add a selection `{ coachRosterId }` |
| DELETE | `/orgs/{slug}/my-selections/{id}` | Remove a selection |

**Coach-facing (modified existing):**

| Method | Path | Change |
|--------|------|--------|
| GET | `/orgs/{slug}/dancers` | Add `interested` query param, add `interestedInMySchool` boolean to response |

### Privacy Enforcement (SUM-40)

- Coach endpoints return ONLY `interestedInMySchool: boolean` — a single bit per dancer
- No endpoint returns a dancer's full selection list to coach-level users
- No endpoint returns count of selections to coaches
- The `GET /orgs/{slug}/my-selections` endpoint is dancer-only (behind orgDancer middleware)
- Admin-only: `GET /orgs/{slug}/admin/dancer-selections` can return full lists (SUM-41, future)

### Dancer-Side UI

Page at dancer portal route (not coach portal). Shows:
- "Selected (N of 3)" header with selected school chips (removable via X)
- Slots remaining indicator
- Searchable list of all coach programs for the event
- Each program shows [+ Add] or [Added ✓]
- 4th selection blocked with message: "Remove one to add another."
- Selections save immediately on add/remove

## Shared Component Architecture

### DancerTable

Reusable component used by search, favorites, and rankings pages.

```
Props:
  data: T[]
  columns: ColumnDef<T>[]
  isLoading: boolean
  emptyState: ReactNode
  onRowClick: (row: T) => void
  pagination: "client" | "none"
  mobileCard: (row: T) => ReactNode
  
Desktop (>=sm): Frame > Table > sortable headers > pagination footer
Mobile (<sm): Card list, infinite scroll or paginated
```

### Column Modules

Composable column definitions in `features/org/components/dancer-table/columns/`:

| Column | Used By | Notes |
|--------|---------|-------|
| bib | all 3 | Left-aligned numeric, sortable |
| name | all 3 | "Last, First" format, sortable by last name |
| grad-year | search, favorites | 4-digit year, sortable |
| studio | search, favorites | Truncate with ellipsis |
| gpa | all 3 | One decimal place, sortable |
| favorite-toggle | search | Inline heart icon, optimistic toggle |
| notes-indicator | search, rankings | Dot if notes exist |
| school-interest | search | Star icon if dancer selected coach's school |
| rating-display | favorites, rankings | Inline 1-5 stars |
| rank | rankings | Auto-numbered position |

### Column Composition per Page

```
Search:    [bib, name, gradYear, studio, gpa, favoriteToggle, notesIndicator, schoolInterest]
Favorites: [bib, name, gradYear, studio, gpa, ratingDisplay, notesIndicator]
Rankings:  [rank, bib, name, gradYear, gpa, ratingDisplay, notesIndicator]
```

### Mutation Module

New file `features/org/api/scouting-mutations.ts` following the pattern in `features/dancer/api/mutations.ts`:

- `useToggleFavorite()` — POST/DELETE with favorites + dancers invalidation
- `useUpsertRating()` — PUT with dancer + rankings invalidation
- `useUpsertNote()` — PUT with dancer + rankings invalidation
- `useDeleteNote()` — DELETE with dancer + rankings invalidation
- `useAddSchoolSelection()` — POST with my-selections invalidation, enforce max 3
- `useRemoveSchoolSelection()` — DELETE with my-selections invalidation

### Schemas

New file `features/org/api/scouting-schemas.ts`:

- `dancerSearchForm` — `{ search: string, interested: boolean }`
- `noteForm` — `{ content: string (max 2000) }`
- `ratingForm` — `{ rating: int (1-5) }`
- `schoolSelectionForm` — `{ coachRosterId: uuid }`

## Backend Changes

### Modified Endpoints

**GET /orgs/{slug}/dancers:**
- New query param: `interested?: boolean`
- New response field: `interestedInMySchool: boolean`
- LEFT JOIN on `eventSchoolSelections` WHERE `coachRosterId = requestingCoach`
- When `interested=true`, add WHERE `interestedInMySchool = true`

**PUT /orgs/{slug}/dancers/{rosterId}/rating:**
- Validate rating range 1-5 (was unconstrained smallint)

### New Endpoints

See Top 3 School Selection System section above.

### New Schema

`eventSchoolSelections` table with Drizzle schema in `app/database/schema/event-features.ts`.

### Type Regeneration

After all backend changes:
1. Backend: regenerate OpenAPI spec
2. Frontend: `pnpm types` to pull updated `types.d.ts`

## Sidebar Navigation

4 items + footer user menu:

| Item | Icon | Route | Active When |
|------|------|-------|-------------|
| Search Dancers | SearchIcon | `/$orgSlug/coach/dancers` | `/dancers` |
| My Favorites | HeartIcon | `/$orgSlug/coach/favorites` | `/favorites` |
| My Rankings | TrophyIcon | `/$orgSlug/coach/rankings` | `/rankings` |
| Event Info | CalendarIcon | `/$orgSlug/coach/event-info` | `/event-info` |

**Footer dropdown (avatar + name):**
- Edit Profile on S2S (external link)
- Sign Out

## Technical Constraints

1. **No `as` casts** — types flow from openapi-react-query through auto-generated types.d.ts
2. **BaseUI components** — Select uses `items` prop, Combobox pattern for searchable lists
3. **Buttons/inputs h-10 desktop, h-9 mobile** — consistent heights, never shrink on resize
4. **Frame wraps every table** — `<Frame><Table>...</Table><FrameFooter>pagination</FrameFooter></Frame>`
5. **Optimistic updates** — React 19 `useOptimistic` for favorite toggles
6. **Notes autosave** — 2s debounce, beforeunload guard, status indicator
7. **RHF** — search form, notes form, school selection form
8. **TanStack Table** — all table instances, shared column defs, client-side sort/pagination
9. **openapi-react-query** — all data fetching via `$api.queryOptions()` and `$api.useMutation()`

## Out of Scope

- **Callbacks** (SUM-58-62) — deferred to separate phase
- **Full dancer profile page** — link to `/$username` instead
- **Coach profile editing** — redirects to S2S
- **Cross-platform auth handoff** (SUM-05/44/45/46) — separate initiative
- **Admin-only school selection view** (SUM-41) — future admin feature
