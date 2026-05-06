# Consolidate Favorites & Rankings into Dancers Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the separate Favorites and Rankings pages, consolidate their unique features (rank column + auto-sort by rating) into the main Dancers roster page via the existing "Rated" filter toggle.

**Architecture:** Frontend-only. When the "Rated" filter is activated, the table auto-sorts by rating descending and shows a Rank # column as the first column. When deactivated, the rank column hides and sort resets to default (name ascending). Delete the two standalone pages and their nav entries. Clean up now-unused column hooks and types.

**Tech Stack:** React 19 + TanStack Table/Router/Query, Tailwind v4.

---

## File Map

### Deleted
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/favorites.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/rankings.tsx`

### Modified
- `apps/frontend/src/features/org/components/coach-sidebar.tsx` — remove Favorites + Rankings nav items
- `apps/frontend/src/features/org/components/dancer-table/columns.tsx` — make `rankColumn` generic, remove `FavoriteDancerRow`, `RankedDancerRow`, `notePreviewColumn`
- `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts` — add `showRank` option to `useSearchColumns`, remove `useFavoritesColumns` and `useRankingsColumns`
- `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx` — support controlled sorting via `onSortingChange` prop
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx` — lift sorting state, toggle rank column + auto-sort when rated filter activates

---

### Task 1: Delete Favorites and Rankings pages

**Files:**
- Delete: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/favorites.tsx`
- Delete: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/rankings.tsx`

- [ ] **Step 1: Delete the two route files**

```bash
rm apps/frontend/src/routes/_org/\$orgSlug/_authenticated/coach/favorites.tsx
rm apps/frontend/src/routes/_org/\$orgSlug/_authenticated/coach/rankings.tsx
```

- [ ] **Step 2: Regenerate the route tree**

The TanStack Router file-based routing auto-generates `routeTree.gen.ts`. After deleting route files, regenerate:

```bash
cd apps/frontend && pnpm exec tsr generate
```

- [ ] **Step 3: Commit**

```bash
git add -A apps/frontend/src/routes/_org/\$orgSlug/_authenticated/coach/favorites.tsx apps/frontend/src/routes/_org/\$orgSlug/_authenticated/coach/rankings.tsx apps/frontend/src/routeTree.gen.ts
git commit -m "chore: delete standalone favorites and rankings pages"
```

---

### Task 2: Remove nav items from coach sidebar

**Files:**
- Modify: `apps/frontend/src/features/org/components/coach-sidebar.tsx:51-77`

- [ ] **Step 1: Remove the "My Lists" section and unused imports**

Replace the `navSections` array and clean up imports. The sidebar should only have the "Scouting" section with "Dancers".

In `coach-sidebar.tsx`, replace the `navSections` constant (lines 51-77):

```tsx
const navSections = [
  {
    title: "Scouting",
    items: [
      {
        label: "Dancers",
        icon: SearchIcon,
        to: "/$orgSlug/coach/dancers" as const,
      },
    ],
  },
];
```

Remove unused imports from the import block: `HeartIcon`, `TrophyIcon`.

```tsx
import {
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from "lucide-react";
```

- [ ] **Step 2: Verify the app builds**

```bash
cd apps/frontend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/coach-sidebar.tsx
git commit -m "feat: remove favorites and rankings from coach nav"
```

---

### Task 3: Clean up unused column definitions and types

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/columns.tsx:40-49,286-308`
- Modify: `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts:66-94`

- [ ] **Step 1: Make rankColumn generic and remove dead types/columns**

In `columns.tsx`:

Remove the `FavoriteDancerRow` interface (lines 40-43):
```tsx
export interface FavoriteDancerRow extends DancerRow {
  rating: number | null;
  hasNotes: boolean;
}
```

Remove the `RankedDancerRow` interface (lines 45-49):
```tsx
export interface RankedDancerRow extends DancerRow {
  rating: number | null;
  note: string | null;
  isFavorited: boolean;
}
```

Change `rankColumn` type from `ColumnDef<RankedDancerRow>` to generic (lines 286-296). It only uses `row.index` so it works with any row type:

```tsx
export function rankColumn<T>(): ColumnDef<T> {
  return {
    id: "rank",
    header: "#",
    size: 40,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-sm">
        {row.index + 1}
      </span>
    ),
  };
}
```

Remove the `notePreviewColumn` (lines 298-308) — it was only used by the Rankings page.

- [ ] **Step 2: Remove useFavoritesColumns and useRankingsColumns**

In `use-dancer-columns.ts`, delete the `useFavoritesColumns` function (lines 66-79) and the `useRankingsColumns` function (lines 81-94).

Remove their unused imports at the top. The imports block should become:

```ts
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  bibColumn,
  nameColumn,
  gradYearColumn,
  studioColumn,
  gpaColumn,
  favoriteToggleColumn,
  notesQuickActionColumn,
  schoolInterestColumn,
  rankColumn,
  selectColumn,
  ratingQuickActionColumn,
  ratingDisplayColumn,
  type SearchDancerRow,
} from "./columns";
```

- [ ] **Step 3: Verify the app builds**

```bash
cd apps/frontend && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/columns.tsx apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts
git commit -m "chore: remove unused favorites/rankings column defs and types"
```

---

### Task 4: Support controlled sorting in DancerTable

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx:42-96`

- [ ] **Step 1: Add onSortingChange prop for controlled sorting**

The DancerTable currently manages sorting internally via `useState`. Add an optional `onSortingChange` callback. When provided along with `sorting`, the component uses controlled mode (parent owns the state). When omitted, it falls back to internal state as before.

In `dancer-table.tsx`, update the interface (around line 42):

```tsx
interface DancerTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  emptyState: ReactNode;
  onRowClick?: (row: T) => void;
  renderCard: (row: T) => ReactNode;
  globalFilter?: string;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pageSize?: number;
  enableSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}
```

Update the component body to support controlled mode (around lines 57-96):

```tsx
export function DancerTable<T extends { rosterId: string }>({
  data,
  columns,
  isLoading,
  emptyState,
  onRowClick,
  renderCard,
  globalFilter,
  sorting: sortingProp,
  onSortingChange: onSortingChangeProp,
  pageSize = 25,
  enableSelection,
  rowSelection,
  onRowSelectionChange,
}: DancerTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [internalSorting, setInternalSorting] = useState<SortingState>(sortingProp ?? []);

  const isControlled = onSortingChangeProp !== undefined;
  const sorting = isControlled ? (sortingProp ?? []) : internalSorting;
  const setSorting = isControlled ? onSortingChangeProp : setInternalSorting;

  const table = useReactTable({
    columns,
    data,
    enableSortingRemoval: false,
    enableRowSelection: enableSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    state: {
      pagination,
      sorting,
      globalFilter,
      ...(rowSelection !== undefined && { rowSelection }),
    },
  });
  // ... rest unchanged
```

- [ ] **Step 2: Verify the app builds**

```bash
cd apps/frontend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx
git commit -m "feat: support controlled sorting in DancerTable"
```

---

### Task 5: Add rank column + auto-sort when "Rated" filter is active

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts:23-63`
- Modify: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx:52-504`

- [ ] **Step 1: Add showRank option to useSearchColumns**

In `use-dancer-columns.ts`, add `showRank` to the options object:

```ts
export function useSearchColumns(
  onFavoriteToggle: (rosterId: string, current: boolean) => void,
  opts?: {
    enableSelection?: boolean;
    onRate?: (rosterId: string, rating: number) => void;
    onOpenNotes?: (rosterId: string) => void;
    showRank?: boolean;
  },
): ColumnDef<SearchDancerRow>[] {
  return useMemo(() => {
    const cols: ColumnDef<SearchDancerRow>[] = [];

    if (opts?.enableSelection) {
      cols.push(selectColumn<SearchDancerRow>());
    }

    if (opts?.showRank) {
      cols.push(rankColumn<SearchDancerRow>());
    }

    cols.push(
      bibColumn as ColumnDef<SearchDancerRow>,
      nameColumn as ColumnDef<SearchDancerRow>,
      gradYearColumn as ColumnDef<SearchDancerRow>,
      studioColumn as ColumnDef<SearchDancerRow>,
      gpaColumn as ColumnDef<SearchDancerRow>,
    );

    if (opts?.onRate) {
      cols.push(ratingQuickActionColumn(opts.onRate));
    } else {
      cols.push(ratingDisplayColumn() as ColumnDef<SearchDancerRow>);
    }

    cols.push(favoriteToggleColumn(onFavoriteToggle));

    if (opts?.onOpenNotes) {
      cols.push(notesQuickActionColumn(opts.onOpenNotes) as ColumnDef<SearchDancerRow>);
    }

    cols.push(schoolInterestColumn);

    return cols;
  }, [onFavoriteToggle, opts?.enableSelection, opts?.onRate, opts?.onOpenNotes, opts?.showRank]);
}
```

- [ ] **Step 2: Lift sorting state and wire rated filter to auto-sort + rank column**

In `dancers/index.tsx`, add sorting state at the top of the `DancerSearch` component, near the other filter state (around line 59):

```tsx
const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
```

Add an effect that auto-sorts when the `rated` filter changes (after the existing filter-related effect around line 73):

```tsx
useEffect(() => {
  if (rated) {
    setSorting([{ id: "rating", desc: true }]);
  } else {
    setSorting([{ id: "name", desc: false }]);
  }
}, [rated]);
```

Update the `useSearchColumns` call to pass `showRank: rated` (around line 249):

```tsx
const columns = useSearchColumns(handleFavoriteToggle, {
  enableSelection: true,
  onRate: handleRate,
  onOpenNotes: handleOpenNotes,
  showRank: rated,
});
```

Update the `DancerTable` usage to pass controlled sorting (around line 482):

```tsx
<DancerTable<SearchDancerRow>
  data={filteredData}
  columns={columns}
  isLoading={isLoading}
  globalFilter={deferredSearch}
  emptyState={
    <p className="text-muted-foreground text-sm">
      {deferredSearch
        ? `No dancers matched "${deferredSearch}".`
        : "No dancers registered for this event yet."}
    </p>
  }
  renderCard={(row) => (
    <DancerCard
      dancer={row}
      onClick={() => setSheetRosterId(row.rosterId)}
    />
  )}
  sorting={sorting}
  onSortingChange={setSorting}
  enableSelection
  rowSelection={rowSelection}
  onRowSelectionChange={setRowSelection}
/>
```

Add `SortingState` to the tanstack import at the top of the file:

```tsx
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
```

- [ ] **Step 3: Verify the app builds**

```bash
cd apps/frontend && pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts apps/frontend/src/routes/_org/\$orgSlug/_authenticated/coach/dancers/index.tsx
git commit -m "feat: show rank column and auto-sort by rating when rated filter is active"
```

---

### Task 6: Verify and clean up

- [ ] **Step 1: Run lint**

```bash
cd apps/frontend && pnpm lint
```

Fix any lint errors (unused imports, etc.).

- [ ] **Step 2: Run type check**

```bash
cd apps/frontend && pnpm build
```

- [ ] **Step 3: Manual smoke test**

Start the dev server (`pnpm dev`) and verify:

1. Coach sidebar shows only "Event Info" and "Dancers" — no Favorites or Rankings links
2. Navigating to `/coach/favorites` or `/coach/rankings` returns 404 / redirects
3. On the Dancers page, clicking the "Rated" (star) filter toggle:
   - Table auto-sorts by rating descending
   - A "#" rank column appears as the first data column (after checkbox)
   - Rank numbers are sequential: 1, 2, 3...
4. Deactivating the "Rated" filter:
   - Rank column disappears
   - Sort returns to name ascending
5. Coaches can still manually re-sort by clicking column headers while the rated filter is active
6. All other filters (favorited, notes, interested, year, GPA, state) still work

- [ ] **Step 4: Final commit if any cleanup was needed**

```bash
git add -A
git commit -m "chore: lint and cleanup after favorites/rankings consolidation"
```
