# Roster Pages — Dancers & Coaches

**Status:** Design approved, ready for implementation plan  
**Date:** 2026-04-10  
**Branch:** `plan/summit-04-coach-scouting`  
**Parent spec:** `2026-04-08-org-admin-dashboard-design.md`

## Problem

The admin dashboard has a placeholder "Rosters" tab that shows summary stats but no way to view, search, filter, or edit individual roster entries. Admins currently rely on CSV uploads as the only way to manage roster data — there's no way to fix a typo, check activation status for a specific person, or bulk-update records after upload.

## Goals

1. Replace the single Rosters placeholder with two dedicated pages: **Dancers** and **Coaches**.
2. Build a lean, reusable `DataGrid` component using TanStack Table + BaseUI primitives for sortable, searchable, filterable tables with inline cell editing.
3. Provide a detail sheet (inset) for full record editing, including dancer profile fields.
4. Support bulk actions: delete, status change, CSV export, resend invite.
5. Mock backend endpoints that don't exist yet so the UI can be built without backend blocking.

## Non-goals

- Building backend endpoints (frontend-only, mocked where needed).
- Manual "Add row" — CSV remains the only intake method.
- Virtualization — not needed until roster sizes exceed thousands of rows. Can be added later.
- Undo/redo, cell selection ranges, copy/paste — not needed for v1.
- RTL support.

## Routing & navigation

### Sidebar update

Replace the single "Rosters" nav item with two entries:

```
• Dashboard
  Event
  Dancers       ← replaces "Rosters"
  Coaches       ← new
  Uploads
  Settings
```

### Route changes

- **Delete:** `admin/rosters.tsx`
- **Add:** `admin/dancers.tsx` — dancers data grid
- **Add:** `admin/coaches.tsx` — coaches data grid

## Page layout

Both pages share the same structure. Dancers shown here; coaches is identical minus the Bib# column and profile section in the detail sheet.

```
┌─────────────────────────────────────────────────────────────────┐
│  Dancers                                                        │
│  1,024 dancers on roster for The Summit 2026                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [🔍 Search...]  [Status ▾]  [Org ▾]  [Date added ▾]      │  │
│  │                                                           │  │
│  │ ☐ │ Bib# │ Name        │ Email          │ Org    │Status  │  │
│  │───┼──────┼─────────────┼────────────────┼────────┼────────│  │
│  │ ☐ │  042 │ Jane Smith  │ jane@ex.com    │StudioX │●Active │  │
│  │ ☐ │  107 │ Amy Lee     │ amy@dance.co   │DanceHQ │○Pending│  │
│  │ ☐ │  215 │ Sara Chen   │ sara@gmail.com │StudioX │●Active │  │
│  │   │      │             │                │        │        │  │
│  │───┴──────┴─────────────┴────────────────┴────────┴────────│  │
│  │ Showing 1-20 of 1,024          ◄ 1 2 3 ... 52 ►          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─── When rows selected: ───────────────────────────────────┐  │
│  │ 3 selected  [Mark active] [Mark pending] [Export] [Delete]│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- Wrapped in `Frame` + `FramePanel`
- Toolbar filters inside the frame, above the table
- Bulk action bar appears when rows are selected (sticky bottom of frame)
- Click row → inset detail sheet
- Double-click cell → inline edit that cell

### Columns

**Dancers:**
| Column | Sortable | Editable inline | Notes |
|--------|----------|-----------------|-------|
| ☐ (select) | No | No | Checkbox for bulk selection |
| Bib# | Yes | Yes | Integer |
| Name | Yes | Yes | Combined first + last, edits split |
| Email | Yes | Yes | Text |
| Organization | Yes | Yes | Text |
| Status | Yes | No | Badge: Active (green) / Pending (muted) |

**Coaches:**
Same as dancers minus Bib# column.

### Filters

- **Search** — single text input, filters across name, email, bib number (client-side for mocked data, server-side when real endpoint exists)
- **Status** — dropdown: All / Active / Pending
- **Organization** — dropdown populated from distinct organizations in the current roster data
- **Date added** — date range filter on `createdAt`

All filters compose — applying multiple narrows the result set (AND logic).

### Sorting

Click column header to cycle: none → ascending → descending → none. Single-column sort. Sort indicator (chevron) in the header.

### Pagination

- Page size: 20 rows default
- Controls: first/prev/next/last buttons, page number display
- "Showing X–Y of Z" text
- State held in URL search params for bookmarkability

## Detail sheet

Click a row to open an inset sheet (`SheetPopup variant="inset"`).

### Dancer detail sheet

```
┌──────────────────────────────────────────────┐
│  Jane Smith                          [Close] │
│  Bib #042 · StudioX · ● Active              │
│──────────────────────────────────────────────│
│                                              │
│  Roster Info                                 │
│  ─────────                                   │
│  First name        [Jane         ]           │
│  Last name         [Smith        ]           │
│  Email             [jane@ex.com  ]           │
│  Bib number        [042          ]           │
│  Organization      [StudioX      ]           │
│                                              │
│  Profile                                     │
│  ───────                                     │
│  Grad year         [2027         ]           │
│  GPA               [3.8          ]           │
│  Studio            [Elite Dance  ]           │
│  State             [IL           ]           │
│  Height            [5'6"         ]           │
│  Dance styles      [Jazz, Contemp]           │
│  Bio               [Lorem ipsum… ]           │
│                                              │
│──────────────────────────────────────────────│
│  [Resend invite]           [Delete] [Save]   │
└──────────────────────────────────────────────┘
```

### Coach detail sheet

Same structure, Roster Info section only (coaches have no `eventDancerProfiles`).

### Sheet behavior

- `SheetPopup variant="inset"` with padding on main content, matching `event-form-sheet.tsx` pattern
- Form: react-hook-form + zod validation
- Two sections for dancers (Roster Info + Profile), one for coaches
- Footer: Resend invite (only shown for pending), Delete (destructive, left side), Save (right side)
- Closing without saving discards changes (no confirmation dialog in v1)

## Inline cell editing

- **Trigger:** double-click a cell, or press Enter on a focused cell
- **Commit:** Enter key or blur
- **Cancel:** Escape key
- **Cell variants:** text input for strings, number input for bib#
- **Status column is not inline-editable** — use bulk actions or the detail sheet
- Edits call the same mutation as the detail sheet (update roster entry)

## Bulk actions

Appear in a bar when 1+ rows are selected:

- **Mark active** — set `isRegistered = true` for selected rows
- **Mark pending** — set `isRegistered = false` for selected rows
- **Export** — download selected rows as CSV
- **Delete** — remove selected rows, with confirmation dialog
- **Resend invite** — trigger invitation emails for selected pending rows

Select-all checkbox in the header selects all rows on the current page. Indeterminate state when some but not all are selected.

## Data layer

### Mock strategy

Since we're building frontend-first, data will be mocked where endpoints don't exist:

- Create a `mock-roster-data.ts` file with realistic faker-generated roster entries (50–100 rows)
- Mock queries return this data with simulated filtering/sorting/pagination
- Mutations update the mock data in memory (optimistic updates via TanStack Query)
- When real endpoints are built, swap mock functions for real API calls — the query keys, types, and component code stay the same

### Types

```ts
type RosterEntry = {
  id: string;
  eventId: string;
  type: "dancer" | "coach";
  email: string;
  firstName: string;
  lastName: string;
  bibNumber: number | null;
  organization: string | null;
  isRegistered: boolean;
  createdAt: string;
  // Dancer profile (null for coaches)
  profile: DancerProfile | null;
};

type DancerProfile = {
  profilePhotoUrl: string | null;
  gradYear: number | null;
  gpa: number | null;
  studio: string | null;
  state: string | null;
  height: string | null;
  danceStyles: string[] | null;
  bio: string | null;
};
```

### Queries (to be mocked initially)

- `adminQueries.roster(slug, eventId, params)` — paginated list with filters
  - Params: `{ type, page, limit, search, status, org, dateFrom, dateTo, sortBy, sortDir }`
  - Returns: `{ data: RosterEntry[], total: number }`

### Mutations (to be mocked initially)

- `updateRosterEntry(slug, eventId, entryId, body)` — partial update
- `deleteRosterEntries(slug, eventId, entryIds)` — bulk delete
- `updateRosterStatus(slug, eventId, entryIds, isRegistered)` — bulk status change
- `resendInvites(slug, eventId, entryIds)` — bulk invite
- `exportRoster(slug, eventId, entryIds)` — returns CSV blob

## Shared components

### New components (feature/org/components)

- **`data-grid.tsx`** — Lean TanStack Table wrapper. Props: columns, data, pagination, onRowClick, selection state. Uses `Frame` + `Table` + BaseUI primitives. Column cell variants defined via `meta.cell.variant` (`"text"`, `"number"`, `"badge"`). Handles inline editing state, keyboard nav (arrow keys between cells, Enter to edit, Escape to cancel).

- **`data-grid-toolbar.tsx`** — Search input + filter dropdowns. Reuses existing shared filter components (`select-filter`, `input-filter`, `date-filter`). Takes a `filters` config array to render the right controls.

- **`data-grid-pagination.tsx`** — Page controls with first/prev/next/last, page display, showing X of Y.

- **`roster-detail-sheet.tsx`** — Inset sheet for editing a roster entry. Takes `type: "dancer" | "coach"` to conditionally render the profile section. react-hook-form + zod.

- **`bulk-action-bar.tsx`** — Sticky bar showing selected count + action buttons. Takes an actions config array.

### Existing components reused

- `Frame`, `FramePanel` — page wrapper
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` — table markup
- `Checkbox` — row selection + select-all
- `Badge` — status display
- `Input`, `Select`, `Combobox` — filter controls + inline editors
- `Sheet`, `SheetPopup variant="inset"`, `SheetHeader`, `SheetContent`, `SheetFooter` — detail sheet
- `Button` — actions
- `Field`, `FieldLabel`, `FieldError` — form fields in detail sheet
- `Dialog` — delete confirmation

## Accessibility

- Table uses semantic `<table>` markup via the Table component
- Checkbox column has `aria-label="Select row"` / `"Select all rows"`
- Status badges have text labels, not color only
- Inline editing cells announce state changes via `aria-label`
- Detail sheet traps focus, returns focus to triggering row on close
- Keyboard: Tab between toolbar and table, arrow keys within table, Enter to edit/open sheet

## Testing notes

- Component test for DataGrid: renders columns, sorts on header click, filters narrow rows
- Component test for inline editing: double-click activates, Enter commits, Escape cancels
- Component test for roster detail sheet: renders correct fields for dancer vs coach, validates, submits
- Component test for bulk actions: select rows, action buttons appear, actions dispatch
- Mock data tests: filtering, sorting, pagination return correct subsets
