# Org Admin Dashboard Redesign

**Status:** Design approved, ready for implementation plan
**Date:** 2026-04-08
**Scope branch:** `plan/summit-03-events-rosters` (worktree `.worktrees/summit-03`)
**Related project:** Summit multi-tenant org platform

## Problem

The current org admin landing page (`apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/index.tsx`) is functionally correct but visually plain. It renders a bare `<h1>` of the event name, four generic stat cards (coaches / dancers / registered / pending), and two CSV uploader cards. It does not use the rich UI primitives already available (`Frame`, `Empty`, `Command`, `Stepper`, etc.), shows only `id/name/isActive` of the event despite the backend exposing dates, venue, and contact data, and has no affordances for editing the event, previewing a CSV before upload, or driving actions via keyboard.

Summit staff will live in this dashboard during the weeks leading up to the June 13–15 event. It needs to feel like an **Event HQ** — the active event is the centerpiece — with a control-room flavor (density, keyboard, status) layered on top.

## Goals

1. Make the active event feel like the hero of the page, visually anchored to the org's brand.
2. Surface real data that already exists in `org_events` but isn't exposed: dates, venue, contact, schedule PDF.
3. Replace the four generic stat cards with a smaller set of meaningful metrics derived from real data (no fake denominators).
4. Turn CSV upload into an interactive, confidence-building flow with client-side validation and a row-level preview before any network call.
5. Establish the full admin shell (sidebar, routes, empty states, command palette) so future tabs have a home without building their full features.
6. Add the ability to edit event details (name, dates, venue, contact) via a sheet that reuses the create-event form pattern.

## Non-goals

- Building out the Rosters, Uploads, or Settings tab contents beyond placeholder shells. Those are owned by future tickets.
- Full dashboard "live event mode" for the day-of experience — stubbed via `useEventPhase()` but not implemented.
- Multi-org switching — the org switcher slot exists in the sidebar but only displays the current org in v1.
- Replacing the existing create-event form with a unified form component.
- Streaming CSV upload progress on the backend (captured as a follow-up task below).

## Visual design

### Hero region — Variant 1 (split hero, supporting stats below)

The event is the page. Org brand color (pulled from `organizations.features.brandColor`, or a neutral fallback) accents the hero. Event name is the largest type on the page. The progress ring supports the hero rather than competing with it.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▎THE SUMMIT 2026                         ┌───────────────┐          │
│ ▎━━━━━━━━━━━━━━━━━━                      │      71%      │          │
│ ▎Jun 13–15, 2026  ·  Chicago, IL         │   ╭───────╮   │          │
│ ▎Hilton Palmer House · 17 E Monroe St    │   │   ●   │   │          │
│ ▎✉ events@sharpenup.com                  │   ╰───────╯   │          │
│                                           │  roster       │          │
│ [Edit event]  [Schedule.pdf]  ⌘K          │  activation   │          │
│                                           │  847 / 1,200  │          │
│ ⏱ 47 days until event weekend            └───────────────┘          │
└──────────────────────────────────────────────────────────────────────┘

┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ Dancers    │ │ Coaches    │ │ Pending    │ │ Last upload│
│ 1,024      │ │ 176        │ │ 353        │ │ 2h ago     │
│ on roster  │ │ on roster  │ │ not active │ │ 1,024 rows │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

The thin brand-colored bar on the left of the hero (`▎`) is the org brand accent — a single visual element that instantly differentiates the org without requiring full theming. If `brandColor` is missing, falls back to the app's primary color.

**Critical reframe from first draft:** the progress ring was originally "registered / expected attendance," but `org_events` has no `expectedCount` column and inventing one ships fake math. The ring instead shows **roster activation rate** — `event_rosters` rows where `isRegistered = true` divided by total `event_rosters` rows. This is real data from day one, requires no schema change, and is the most meaningful number to staff ("who has actually logged in vs who is still a row in the CSV we uploaded").

### Event phase hook

A `useEventPhase(event)` hook returns one of four phases based on `now` relative to `startDate` / `endDate`:

- **upcoming** (now < startDate − 7d): "47 days until event weekend" countdown chip
- **imminent** (startDate − 7d ≤ now < startDate): "6 days out" with a warmer color treatment
- **live** (startDate ≤ now ≤ endDate): "Day 2 of 3" with a live pulse indicator, stubbed visually
- **wrapped** (now > endDate): "Wrapped 2 days ago" with countdown chip replaced by a summary

Only `upcoming` and `wrapped` are fully implemented in v1. `imminent` gets color treatment but no other change. `live` renders the pulse indicator so the hook is wired end-to-end, but full live-mode UI (activity feed, on-site check-in counts) is deferred.

### Sidebar + shell

```
┌────────────────┐┌────────────────────────────────────────────────┐
│ ◆ Sharpen Up   ││  header: [☰] Admin                              │
│   The Summit ▾ ││                                                  │
│ ─────────────  ││  ┌──────────────────────────────────────────┐  │
│                ││  │         (dashboard hero + stats)         │  │
│ • Dashboard    ││  └──────────────────────────────────────────┘  │
│   Event        ││                                                  │
│   Rosters      ││                                                  │
│   Uploads      ││                                                  │
│   Settings     ││                                                  │
│                ││                                                  │
│                ││                                                  │
│ ─────────────  ││                                                  │
│ 👤 Cameron ⌘K  ││                                                  │
└────────────────┘└────────────────────────────────────────────────┘
```

- **Org switcher** at the top: combobox displaying current org. In v1 it only shows the current org and is non-interactive (or opens a disabled menu with "more orgs coming soon"). Structure is there for future multi-org work.
- **Nav items:** Dashboard (active), Event, Rosters, Uploads, Settings. "Event" routes to the edit sheet (see below) rather than its own page.
- **User footer:** combines user menu and a small `⌘K` hint. The earlier proposed "⌘K Commands" dedicated row was removed — redundant with the hint and wasted space.
- Uses existing shadcn `Sidebar` primitives (already in `components/ui/sidebar.tsx`).

### Placeholder tabs

Rosters, Uploads, and Settings each live at their own route but ship as **informative shells**, not "coming soon" voids. Each shell:

1. Uses the `Frame` component as the page wrapper.
2. Has a real page title + one-line subtitle.
3. Shows a read-only summary of data that already exists (for Rosters: count by type; for Uploads: count of past `csv_uploads` rows; for Settings: org name + slug).
4. Uses the `Empty` component to show the disabled/preview UI with copy like "Full search, filter, and bulk edit land in the next release."
5. No "coming soon" phrasing anywhere.

Routes to add:
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/rosters.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/uploads.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/settings.tsx`

### Edit-event sheet

Clicking `[Edit event]` opens a right-side `Sheet` (not a dialog — event editing is a substantial form that benefits from side-panel height) with fields: name, startDate, endDate, venueName, venueAddress, contactEmail, schedulePdfUrl. Reuses the same field patterns as `CreateEventForm`. Submit calls a new backend endpoint.

**New backend endpoint:** `PATCH /orgs/:slug/events/:id` with Vine validator, service that updates the `org_events` row and invalidates related queries. Follows the module pattern in `apps/backend/app/modules/orgs/`.

### CSV upload dialog — 5 states

Replaces the inline upload card behavior. The uploader on the dashboard becomes a **trigger** (drop file OR click to pick); once a file is selected, the dialog opens and walks through the states.

**State 1: Trigger card on dashboard** — file input + last upload summary (timestamp + row count).

**State 2: Preview (the interactive heart of the flow)**
- Parses the CSV client-side using `papaparse` (~15kb gzipped, streaming, handles quoted fields correctly).
- Validates required columns against a schema (`csvSchemas.ts`, new file, defines dancer and coach schemas).
- Shows first 10 rows in a `Table`. Rows with warnings get a muted background + warning icon.
- Header shows: filename, total rows detected, file size, column-match status, warning count.
- "Upload" button label shows the **real** number that will be sent (`detected − warnings`), not the detected count.
- If required columns are missing, shows an error state (see failure mode below) with "Choose different file" — no "did you mean?" redirect in v1 (cut during critique).

**State 3: Uploading** — progress bar. Derives from streaming backend response when available (see follow-up task); otherwise indeterminate shimmer.

**State 4: Result** — replaces state 3 in the same dialog. Shows added / updated / errored counts as three stat blocks, followed by a table of error rows (from `csv_uploads.errorDetails`). Includes a "Done" button and optionally "Download error report" (CSV of errored rows). `UploadResultCard` is deleted from its current page-level slot — the result lives in the dialog now.

**Failure mode: wrong columns** — the dialog never advances past state 2. Shows: "This file doesn't look like a dancer roster. Missing required column: bibNumber" with a "Choose different file" button.

**New component:** `CsvUploadDialog` — single component reused for both dancer and coach uploads, takes a `schema` prop plus existing `onUpload` / `isPending` props. Dialog composed from existing `Dialog` + `Table` primitives.

### Command palette

Wired to `components/ui/command.tsx` (already installed). Keyboard shortcut `⌘K` / `Ctrl+K` registered globally at the admin layout level. Inside the palette, navigation uses arrow keys and letter-sequence filtering — no global `⌘D` / `⌘E` shortcuts that collide with browser behavior.

Initial actions:

- **Actions group:** Upload dancer roster, Upload coach roster, Edit event details, Open schedule PDF (if present)
- **Navigate group:** Dashboard, Rosters, Uploads, Settings
- **Event group:** Switch active event (disabled when only one event exists)

Each action is a function: `() => void`. Actions that open dialogs (`Upload dancer roster`) dispatch a shared dialog open state via a small `useAdminCommands()` hook. Actions that navigate use `router.navigate()`.

## Data & API changes

### Frontend type extension

`OrgEvent` type in `admin-queries.ts` expands to:

```ts
export type OrgEvent = {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;     // ISO date
  endDate: string;       // ISO date
  venueName: string | null;
  venueAddress: string | null;
  contactEmail: string | null;
  schedulePdfUrl: string | null;
};
```

### Backend endpoint changes

1. **`GET /orgs/:slug/events`** — extend response to include all `org_events` columns listed above, plus `organizations.features.brandColor` (read from the features JSONB, returned as a string hex or null) on the org summary field. Currently the endpoint returns only `id/name/isActive`.

2. **`GET /orgs/:slug/events/:eventId/stats`** — replace the current `{ coaches, dancers, registered, pending }` with:
   ```ts
   {
     dancers: number;        // total event_rosters where type = 'dancer'
     coaches: number;        // total event_rosters where type = 'coach'
     registered: number;     // event_rosters where isRegistered = true
     pending: number;        // event_rosters where isRegistered = false
     lastUploadAt: string | null;  // max(csv_uploads.created_at)
     lastUploadRows: number | null; // rows_added + rows_updated from latest csv_upload
   }
   ```
   `registered / (dancers + coaches)` drives the roster activation ring.

3. **`PATCH /orgs/:slug/events/:eventId`** — new endpoint. Partial update of `name`, `startDate`, `endDate`, `venueName`, `venueAddress`, `contactEmail`, `schedulePdfUrl`. Standard AdonisJS module structure (controller + service + validator). Returns the updated event.

### No schema changes

No new columns or tables. Brand color lives in the existing `organizations.features` JSONB. Activation rate is derived from existing columns. Streaming upload progress is a pure transport change, not a schema change.

## Component inventory

**New components (feature/org/components):**
- `event-hero.tsx` — hero card with brand accent, event meta, countdown chip, action buttons
- `roster-activation-ring.tsx` — the progress ring, takes `registered` and `total`
- `stat-card.tsx` — **reworked**, not replaced. Current version is kept and extended to show a secondary line (the "on roster" / "not active" / "2h ago" subtitle).
- `edit-event-sheet.tsx` — the right-side Sheet with the edit form
- `csv-upload-dialog.tsx` — replaces inline upload card trigger; walks all 5 states
- `csv-upload-trigger-card.tsx` — dashboard card that shows last-upload info and opens the dialog
- `command-palette.tsx` — wraps `components/ui/command.tsx` with the Summit action set
- `admin-sidebar.tsx` — **reworked**. Adds org switcher header and palette-shortcut hint in the footer.

**New hooks:**
- `use-event-phase.ts` — returns `'upcoming' | 'imminent' | 'live' | 'wrapped'` + human-readable label
- `use-admin-commands.ts` — shared command palette action state

**New utilities:**
- `csv-schemas.ts` — dancer and coach column definitions + per-field validators

**New dependency:**
- `papaparse` + `@types/papaparse` (frontend only)

**Components deleted:**
- Current inline upload handling on `admin/index.tsx` is moved into `csv-upload-dialog.tsx`
- `UploadResultCard` usage on `admin/index.tsx` is removed (content moves into the dialog result state)

## Accessibility

- Progress ring has an accessible text label (`aria-label="847 of 1,200 roster members activated, 71 percent"`) — the number should never be vision-only.
- Stat cards have semantic heading structure.
- Command palette inherits shadcn `Command` accessibility behavior (focus trap, arrow keys, escape to close).
- CSV preview table uses semantic `<table>` markup; warning indicators are paired with `aria-label` text, not color only.
- Brand color accent is decorative only — not used to convey status.
- Edit sheet traps focus and returns focus to the trigger on close.

## Out of scope / follow-ups

Explicitly captured so they don't get lost:

1. **Streaming CSV upload progress (backend).** The frontend dialog has a progress state that can consume a number. Wire the backend to emit chunked response or SSE events as rows are processed. File: `apps/backend/app/modules/orgs/upload-dancers` + `upload-coaches`. Pattern: stream row counters as they're processed inside the transaction.
2. **Full Rosters tab** — searchable table, filter pills, bulk edit, per-row edit dialog.
3. **Full Uploads tab** — paginated list of `csv_uploads`, view results, re-download file, retry failed rows.
4. **Full Settings tab** — org branding (color picker writes to `organizations.features`), member management.
5. **Multi-org switcher** — currently shows only the active org; expand when a user belongs to multiple orgs.
6. **Live-event-mode dashboard** — activity feed, on-site check-in counts, day-of surfacing when `useEventPhase()` returns `'live'`.
7. **"Did you mean coach upload?" cross-redirect** in the CSV wrong-file state. Deferred until we have usage data showing people actually make this mistake.
8. **Sparklines / time-series deltas** on stat cards. Requires a `registration_events` log or daily snapshot table. Dropped from v1.
9. **Error-report CSV download** from the upload result state — nice-to-have, not a blocker.

## Testing notes

- Unit tests for `use-event-phase` covering all four phase transitions (upcoming, imminent, live, wrapped) and boundary cases (exactly startDate, exactly endDate, DST day).
- Unit tests for `csv-schemas` validators.
- Integration test for the `PATCH /orgs/:slug/events/:id` endpoint following the Japa pattern in existing modules.
- Integration test for the updated stats endpoint asserting real counts from seeded `event_rosters` rows.
- Component test for `CsvUploadDialog` covering the column-mismatch failure mode and the happy path (parse → preview → confirm → result).
- Manual smoke test of keyboard shortcut ⌘K registration on the admin layout (it should work on every admin route, not just Dashboard).

## Open questions

None blocking. The two judgment calls most open to revision during implementation:

1. **Progress ring vs. progress bar.** The ring is more distinctive but takes more space and is harder to make accessible. If it feels heavy during implementation, replace with a thick horizontal bar + large percentage — semantically identical.
2. **Sheet vs. full-page edit.** A side Sheet is less disruptive but constrains form width. If the form feels cramped, promote to a full dialog or a dedicated `/admin/event/edit` route.
