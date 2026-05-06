# Phase 2: Table & Interaction Quality

Builds on Phase 1's restructured layout to make the table feel like a power tool. Adds hover quick-actions for inline scouting, multi-select checkboxes for bulk operations after group performances, and a floating action bar for batch favorite/rate.

**Assumes Phase 1 is implemented:** two-column layout, enriched API (`isFavorited`, `rating`, `hasNote`), filter toolbar, sidebar with activity feed, `SearchDancerRow` type with all fields.

---

## 1. Row Hover Quick-Actions (Desktop Only)

Reveal inline scouting controls on row hover so coaches can favorite and rate without opening the DancerSheet. Uses Tailwind `group/row` hover — no React state for hover tracking.

**DancerTable change:** `TableRow` gets `className="group/row cursor-pointer"` (existing `cursor-pointer` kept, `group/row` added).

### Rating Column — Inline on Hover

Replaces `ratingDisplayColumn()` in search columns with a new `ratingQuickActionColumn()`.

**Non-hover state:**
- Has rating: disabled `Rating` component at `size="sm"` showing current value (existing behavior)
- No rating: `text-muted-foreground text-sm` em-dash "—"

**Hover state:**
- Interactive `Rating` at `size="sm"` with `onValueChange` callback
- Click fires `useUpsertRating` mutation, appends to activity feed
- `stopPropagation` on the wrapper prevents row click from opening DancerSheet

**CSS approach** — single `Rating` component per row, toggled via group hover and focus-within (for keyboard accessibility):
- When no rating: `hidden group-hover/row:flex group-focus-within/row:flex` on the Rating, `group-hover/row:hidden group-focus-within/row:hidden` on the em-dash
- When has rating: `pointer-events-none group-hover/row:pointer-events-auto group-focus-within/row:pointer-events-auto` on the Rating

**Column function signature:**
```typescript
function ratingQuickActionColumn(
  onRate: (rosterId: string, rating: number) => void,
): ColumnDef<SearchDancerRow>
```

### Notes Column — Pencil Icon on Hover

Replaces static `notesIndicatorColumn` in search columns with `notesQuickActionColumn()`.

**Non-hover state:** Same dot indicator (`bg-primary size-2 rounded-full`) when `hasNote` is true. Nothing when false.

**Hover state:** Pencil icon (`PencilIcon size-3.5`) replaces the dot. Visible for ALL rows (not just ones with notes). Click opens `DancerSheet` for that dancer — `stopPropagation` prevents double-fire with row click.

**CSS approach:** Dot gets `group-hover/row:hidden group-focus-within/row:hidden`. Pencil button gets `hidden group-hover/row:flex group-focus-within/row:flex`.

**Column function signature:**
```typescript
function notesQuickActionColumn(
  onOpenNotes: (rosterId: string) => void,
): ColumnDef<SearchDancerRow>
```

### Favorite Column — No Change

`favoriteToggleColumn` already has inline click handling with `stopPropagation`. No hover enhancement needed — the heart is always visible and interactive.

### Mobile — No Hover Actions

Hover doesn't exist on touch. Mobile cards continue using the existing tap-to-open-sheet pattern. No changes to `DancerCard` or mobile card view.

---

## 2. Multi-Select Checkboxes (Desktop Only)

Adds a checkbox column for selecting multiple dancers. Selection state drives the floating action bar.

### DancerTable Props

New optional props on `DancerTableProps<T>`:

| Prop | Type | Purpose |
|------|------|---------|
| `enableSelection` | `boolean` | Enables TanStack Table `enableRowSelection` |
| `rowSelection` | `RowSelectionState` | Controlled selection state |
| `onRowSelectionChange` | `OnChangeFn<RowSelectionState>` | Selection state setter |

When `enableSelection` is falsy, these are ignored. Existing consumers (favorites page, rankings page) are unaffected.

### TanStack Table Config

In `useReactTable` call, conditionally add:
```typescript
enableRowSelection: enableSelection,
onRowSelectionChange,
state: {
  pagination,
  sorting,
  globalFilter,
  ...(rowSelection !== undefined && { rowSelection }),
},
```

### Select Column

New `selectColumn()` in `columns.tsx`. Prepended to the search columns array.

**Header cell:** `Checkbox` component — `checked` when all page rows selected, `indeterminate` when some selected. `onCheckedChange` toggles all page rows. `onClick` has `stopPropagation`.

**Body cell:** `Checkbox` component — `checked` when row selected. `onCheckedChange` toggles row. `onClick` has `stopPropagation`.

**BaseUI Checkbox API** (from existing `checkbox.tsx`):
- `checked: boolean` on `Checkbox` root
- `indeterminate: boolean` on `Checkbox` root (renders minus icon via indicator)
- `onCheckedChange: (checked: boolean, event) => void`

**Column definition:**
```typescript
function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    size: 40,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(!!checked)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        onClick={(e) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
  };
}
```

### Column Order (with selection)

Select | Bib | Name | Year | Studio | GPA | Rating | Favorite | Notes | Interested

### Selection State

Managed in the page component (`dancers/index.tsx`):
```typescript
const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
```

Passed to `DancerTable` via the new props. The `RowSelectionState` is a `Record<string, boolean>` keyed by row index (TanStack Table default).

**Deriving selected roster IDs** (in the page component, for the floating action bar):
```typescript
const selectedRosterIds = useMemo(() => {
  return Object.keys(rowSelection)
    .filter((k) => rowSelection[k])
    .map((idx) => tableData[Number(idx)]?.rosterId)
    .filter(Boolean);
}, [rowSelection, tableData]);
```

Uses `tableData` (the filtered array passed to `DancerTable`) so indexes align. Passed as a prop to `FloatingActionBar`.

### useSearchColumns Update

`useSearchColumns` gains an `enableSelection` parameter. When true, prepends `selectColumn()`:

```typescript
function useSearchColumns(
  onFavoriteToggle: ...,
  opts?: {
    enableSelection?: boolean;
    onRate?: (rosterId: string, rating: number) => void;
    onOpenNotes?: (rosterId: string) => void;
  },
): ColumnDef<SearchDancerRow>[]
```

### Mobile — No Checkboxes

Selection is desktop-only. The mobile card view does not render checkboxes. The `selectColumn` is hidden on mobile via the desktop-only table view (`hidden sm:block` already on the `Frame`).

---

## 3. Floating Action Bar

Fixed-position bar appearing at the bottom of the viewport when rows are selected. Provides bulk favorite and bulk rate operations.

### Layout & Position

```
┌─────────────────────────────────────────────────┐
│                     Page                         │
│                                                  │
│     ┌────────────────────────────────────┐       │
│     │ 3 selected  │  ♡ Favorite  ★★★★★  │  ✕    │
│     └────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

**Container positioning:**
- `fixed bottom-6 left-1/2 z-50 -translate-x-1/2 xl:pr-[320px]`
- The `xl:pr-[320px]` accounts for the sidebar width so the bar centers within the main column at xl+ breakpoints
- Outer wrapper is `pointer-events-none`, inner content is `pointer-events-auto`

**Inner bar styling** — matches admin toolbar aesthetic:
- `bg-background border-border flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-lg`

### Animation

CSS transition — bar is always rendered but visually hidden when no selection:
- `transition-all duration-200 ease-out`
- Visible: `translate-y-0 opacity-100`
- Hidden: `pointer-events-none translate-y-4 opacity-0`

No animation library needed.

### Contents (left to right)

1. **Count** — `text-sm font-medium tabular-nums` — "{n} selected"

2. **Separator** — `bg-border h-4 w-px`

3. **Favorite All** — `Button variant="ghost" size="sm"` with `HeartIcon size-3.5` + "Favorite" label. Fires bulk favorite for all selected dancers.

4. **Inline Rating Picker** — `Rating size="sm"` with 5 `RatingItem`s. Interactive. Clicking a star applies that rating to all selected dancers. Label `text-xs text-muted-foreground` "Rate all" before the stars.

5. **Separator** — `bg-border h-4 w-px`

6. **Clear** — `Button variant="ghost" size="sm"` with `XIcon size-3.5`. Clears `rowSelection` state.

### Bulk Operations

**Favorite All:** Fires individual `useAddFavorite` mutations in parallel via `Promise.allSettled`. TanStack Query deduplicates the resulting cache invalidations. After all settle, clears selection.

**Rate All:** Fires individual `useUpsertRating` mutations in parallel via `Promise.allSettled`. Same dedup behavior. After all settle, clears selection.

**Loading state:** While mutations are in-flight, the action buttons show `Loader2Icon animate-spin` and are disabled. Count text changes to "Updating {n}...".

**Activity feed integration:** Each bulk action appends one activity item per dancer to the Phase 1 activity feed. For bulk favorite: `type: 'favorite'`. For bulk rate: `type: 'rate'` with the chosen rating value.

### No Backend Changes

Reuses existing individual endpoints:
- `POST /orgs/{slug}/favorites` (per dancer)
- `PUT /orgs/{slug}/dancers/{dancerRosterId}/rating` (per dancer)

For typical selections of 3–10 dancers, parallel individual requests perform well. Bulk endpoints can be added later if needed.

---

## 4. Keyboard Accessibility

### Checkbox Navigation

- `Tab` focuses the first checkbox (header or first body row)
- `Space` toggles the focused checkbox
- `Shift+Click` on a checkbox selects a range (from last selected to clicked) — uses TanStack Table's built-in range selection if available, otherwise deferred to Phase 3

### Hover Actions via Keyboard

Row focus (via `Tab` through checkboxes) also reveals the hover actions, since the row gets `:focus-within`:
- Add `focus-within:` variants alongside `group-hover/row:` for all hover-reveal styles
- Example: `hidden group-hover/row:flex focus-within:flex` on the pencil icon

---

## Files Changed

### Frontend — Modified
- `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx` — add `group/row` to TableRow, add optional selection props, wire TanStack Table row selection
- `apps/frontend/src/features/org/components/dancer-table/columns.tsx` — new `selectColumn()`, `ratingQuickActionColumn()`, `notesQuickActionColumn()`
- `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts` — update `useSearchColumns` signature with opts, prepend select column, swap in quick-action columns
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx` — add selection state, floating action bar, bulk operation handlers, wire new column callbacks

### Frontend — New
- `apps/frontend/src/features/org/components/floating-action-bar.tsx` — floating action bar component

### Backend — None
No backend changes. Reuses existing mutation endpoints.

### Build Sequence
1. Frontend: modify DancerTable for selection support + group/row class
2. Frontend: add new column definitions (select, rating quick-action, notes quick-action)
3. Frontend: update useSearchColumns
4. Frontend: create FloatingActionBar component
5. Frontend: wire everything together in the page component
