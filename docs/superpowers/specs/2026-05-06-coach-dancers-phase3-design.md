# Phase 3: Compare View, Error Handling & Polish

Finishes the coach dancers overhaul with a side-by-side compare view, error feedback via toasts, skeleton loading states, and a keyboard shortcut for search.

**Assumes Phase 1 + Phase 2 are implemented:** two-column layout, enriched API, filter toolbar, sidebar with compare clipboard, hover quick-actions, multi-select, floating action bar.

---

## 1. Compare View

Replaces the main column content (stat rail + filter toolbar + table) with a side-by-side dancer comparison when the coach activates it from the sidebar.

### Activation

New "View Comparison" button in the sidebar `CompareClipboard` section. Appears only when 2+ dancers are pinned. `Button variant="default" size="sm" className="w-full"`. Sets a `compareMode` boolean state in the page component.

A "Back to table" button at the top of the compare view exits compare mode.

### Layout

```
┌──────────────────────────────────────────────┐  ┌────────────────┐
│ ← Back to table                              │  │  Sidebar       │
│                                              │  │  (unchanged)   │
│ ┌─────────────┐ ┌─────────────┐ ┌──────────┐│  │                │
│ │  #02         │ │  #07         │ │  #15      ││  │                │
│ │  Jane Doe    │ │  Alex Kim    │ │  Sam Rao  ││  │                │
│ │  2027 · TX   │ │  2026 · CA   │ │  2027 · FL││  │                │
│ │  3.8 GPA ★   │ │  3.5 GPA     │ │  3.9 GPA ★│  │                │
│ │              │ │              │ │           ││  │                │
│ │  ★★★★☆      │ │  ★★★☆☆      │ │  ★★★★★   ││  │                │
│ │  ♡ Favorited │ │              │ │  ♡ Fav'd  ││  │                │
│ │              │ │              │ │           ││  │                │
│ │  "Great      │ │  "Needs work │ │  "Top     ││  │                │
│ │   technique" │ │   on turns"  │ │   pick"   ││  │                │
│ │              │ │              │ │           ││  │                │
│ │  Bio text... │ │  Bio text... │ │  Bio...   ││  │                │
│ └─────────────┘ └─────────────┘ └──────────┘│  │                │
└──────────────────────────────────────────────┘  └────────────────┘
```

**Container:** `grid gap-4` with `grid-cols-2` when 2 dancers pinned, `grid-cols-3` when 3.

**Each column** is a card: `bg-card border-border rounded-lg border p-4` — matches existing card patterns (no shadows, no nested cards).

### Column Content (top to bottom)

Each column fetches full dancer data via `scoutingQueries.dancer(slug, rosterId)`. While loading, shows a skeleton placeholder.

1. **Header** — Avatar (size-12 rounded-lg), bib number (`font-mono text-xs text-muted-foreground`), full name (`text-base font-semibold`). Remove button top-right (XIcon, removes from compare and exits compare mode if fewer than 2 remain).

2. **Metadata row** — `text-sm text-muted-foreground` dot-separated: "Class of {year} · {state} · {studio}".

3. **GPA** — `text-2xl font-semibold tabular-nums` with label `text-xs text-muted-foreground uppercase tracking-wide` "GPA" above. The highest GPA among compared dancers gets `text-foreground`; others get `text-muted-foreground`. This makes the "winner" instantly visible.

4. **Rating** — Interactive `Rating` component (not disabled) with `onValueChange` calling `useUpsertRating`. Label "Rating" above in `text-xs text-muted-foreground uppercase tracking-wide`. Shows "Not rated" in `text-sm text-muted-foreground italic` if null.

5. **Favorite status** — `FavoriteButton` component (reused from existing). Compact layout.

6. **Notes** — The dancer's note content displayed in `text-sm text-muted-foreground whitespace-pre-wrap`. If no note: `text-sm text-muted-foreground italic` "No notes yet". Not editable inline — clicking opens DancerSheet for that dancer.

7. **Bio** — `text-sm text-muted-foreground whitespace-pre-wrap` with `line-clamp-4` and a "Show more" toggle if truncated. If no bio: omitted entirely.

### Best-Value Highlighting

For GPA: the highest value gets `text-foreground` weight, others stay `text-muted-foreground`. Simple numeric comparison.

For Rating: the highest rated dancer's stars use the default filled color; others are slightly muted via `opacity-60`. If tied, all show full opacity.

No highlighting for other fields — keeps it subtle.

### State Management

```typescript
const [compareMode, setCompareMode] = useState(false);
```

When `compareIds.length < 2`, `compareMode` auto-resets to `false`:

```typescript
useEffect(() => {
  if (compareIds.length < 2) setCompareMode(false);
}, [compareIds.length]);
```

When a dancer is removed from compare inside the compare view, if the remaining count drops below 2, the effect handles the exit.

### Component

`CompareView` — new component in `apps/frontend/src/features/org/components/compare-view.tsx`.

Props:
```typescript
interface CompareViewProps {
  compareIds: string[];
  onRemove: (rosterId: string) => void;
  onBack: () => void;
  onOpenSheet: (rosterId: string) => void;
}
```

Each dancer column is a `CompareColumn` sub-component within the same file. Uses `useQuery(scoutingQueries.dancer(...))` per dancer.

---

## 2. Error Toasts

Add toast notifications when mutations fail so coaches know their action didn't persist.

### Import Pattern

```typescript
import { toastManager } from "@/components/ui/toast-manager";
```

Existing codebase pattern: `toastManager.add({ title: "...", type: "error" })`.

### Where to Add

All error toasts go into `onError` callbacks of the inline mutations in the page component (`dancers/index.tsx`):

| Mutation | Toast title |
|----------|------------|
| `addFav` onError | "Couldn't favorite dancer" |
| `removeFav` onError | "Couldn't remove favorite" |
| `upsertRating` onError | "Couldn't save rating" |
| `handleBulkFavorite` catch | "Some favorites failed to save" |
| `handleBulkRate` catch | "Some ratings failed to save" |

For bulk operations, check `Promise.allSettled` results for rejected entries and only show a toast if any failed.

### Implementation

Each `onError` gets a one-line addition:

```typescript
onError: (_err, _vars, ctx: any) => {
  if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
  toastManager.add({ title: "Couldn't favorite dancer", type: "error" });
},
```

For bulk handlers, after `Promise.allSettled`:

```typescript
const results = await Promise.allSettled(...);
const failures = results.filter((r) => r.status === "rejected");
if (failures.length > 0) {
  toastManager.add({
    title: `${failures.length} of ${selectedRosterIds.length} favorites failed`,
    type: "error",
  });
}
```

---

## 3. Loading Skeletons

Replace text-based loading indicators with skeleton placeholders.

### Table Skeleton

When `isLoading` is true, the `DancerTable` currently shows a single `<Loader2Icon>` spinner cell. Replace with skeleton rows that match the table structure.

**Desktop:** Render 5 skeleton `<TableRow>`s, each containing `<TableCell>`s with `<Skeleton>` elements matching column widths. This preserves the table's visual structure while loading.

**Mobile:** Render 3 skeleton cards matching `DancerCard` proportions.

**Implementation:** New prop `skeletonColumns?: number` on `DancerTable` (defaults to `columns.length`). The loading branch renders skeleton rows with that many cells.

### Sidebar Skeleton

The sidebar sections use data from the dancers array. When `dancers` is loading (`isLoading` and no data), render skeleton bars in each section:
- Talent Pool: 3 skeleton bar rows per subsection
- Compare: unaffected (compare uses pinned IDs, not loading state)
- Session: skeleton progress bar + placeholder text

**Implementation:** Add an `isLoading` prop to `ScoutingSidebar`. When true, each section renders skeletons instead of computed data.

### DancerSheet Skeleton

Already has a loading state (`<SheetTitle>Loading...</SheetTitle>`). Replace with:
- Skeleton avatar (size-16 rounded-lg)
- Skeleton text lines for name and metadata
- Skeleton blocks for rating and notes areas

---

## 4. Keyboard Shortcut

### `/` to Focus Search

Pressing `/` anywhere on the page (when not inside an input/textarea) focuses the search input in the filter toolbar.

**Implementation:** `useEffect` in the page component with a `keydown` listener. Checks `event.key === "/"` and `document.activeElement` is not an input/textarea/contenteditable. Calls `.focus()` on a ref passed to the search input.

The `DancerFilterToolbar` accepts an optional `searchRef: React.RefObject<HTMLInputElement>` prop, forwarded to the `InputGroupInput`.

### `Escape` to Clear Selection

When the floating action bar is visible and no input is focused, pressing `Escape` clears the row selection. Added in the same `keydown` listener.

---

## Files Changed

### Frontend — New
- `apps/frontend/src/features/org/components/compare-view.tsx` — side-by-side compare component with per-dancer columns

### Frontend — Modified
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx` — compare mode state, error toasts on mutations, sidebar loading prop, keyboard shortcut listener, search ref
- `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx` — skeleton loading rows replacing spinner
- `apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx` — accept searchRef prop
- `apps/frontend/src/features/org/components/dancer-sheet.tsx` — skeleton loading state replacing text

### Backend — None
No backend changes.
