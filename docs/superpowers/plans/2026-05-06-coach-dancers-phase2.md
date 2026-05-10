# Phase 2: Coach Dancers Table & Interaction Quality — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hover quick-actions, multi-select checkboxes, and a floating action bar so coaches can scout faster without opening the DancerSheet for every action.

**Architecture:** Extends the shared `DancerTable` with optional row selection props and Tailwind `group/row` hover. New quick-action column definitions replace the static rating display and notes indicator for the search page only. A new `FloatingActionBar` component handles bulk favorite/rate using parallel individual mutations.

**Tech Stack:** React 19, TanStack Table, BaseUI Checkbox, Tailwind v4 group-hover, existing Rating component, existing `$api.useMutation` pattern.

**Design spec:** `docs/superpowers/specs/2026-05-06-coach-dancers-phase2-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx` | Modify | Add `group/row` class to body rows, accept optional selection props |
| `apps/frontend/src/features/org/components/dancer-table/columns.tsx` | Modify | Add `selectColumn()`, `ratingQuickActionColumn()`, `notesQuickActionColumn()` |
| `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts` | Modify | Update `useSearchColumns` signature to accept opts, wire new columns |
| `apps/frontend/src/features/org/components/floating-action-bar.tsx` | Create | Fixed-position bulk action bar with favorite/rate/clear |
| `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx` | Modify | Add selection state, bulk handlers, floating bar, wire column callbacks |

---

### Task 1: Add row selection support and group/row class to DancerTable

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx`

- [ ] **Step 1: Add imports for row selection types**

At the top of `dancer-table.tsx`, add `RowSelectionState` and `OnChangeFn` to the `@tanstack/react-table` import:

```typescript
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
```

- [ ] **Step 2: Add optional selection props to DancerTableProps**

Replace the `DancerTableProps` interface:

```typescript
interface DancerTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  emptyState: ReactNode;
  onRowClick: (row: T) => void;
  renderCard: (row: T) => ReactNode;
  globalFilter?: string;
  sorting?: SortingState;
  pageSize?: number;
  enableSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
}
```

- [ ] **Step 3: Destructure new props in the component**

Update the component signature to destructure the new props:

```typescript
export function DancerTable<T extends { rosterId: string }>({
  data,
  columns,
  isLoading,
  emptyState,
  onRowClick,
  renderCard,
  globalFilter,
  sorting: initialSorting,
  pageSize = 25,
  enableSelection,
  rowSelection,
  onRowSelectionChange,
}: DancerTableProps<T>) {
```

- [ ] **Step 4: Wire selection into useReactTable**

Update the `useReactTable` call to include selection config:

```typescript
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
```

- [ ] **Step 5: Add group/row class to body TableRow**

Find the body `<TableRow>` that renders each data row (the one with `className="cursor-pointer"`). Change it to:

```tsx
                <TableRow
                  className="group/row cursor-pointer"
                  key={row.id}
                  onClick={() => onRowClick(row.original)}
                >
```

- [ ] **Step 6: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS (no consumers pass the new optional props yet, so nothing breaks)

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx
git commit -m "feat(dancer-table): add row selection support and group/row hover class"
```

---

### Task 2: Add new column definitions

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/columns.tsx`

- [ ] **Step 1: Add imports**

Add `Checkbox` and `cn` to the imports at the top of `columns.tsx`:

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import { Heart, PencilIcon, StarIcon } from "lucide-react";
import { Rating, RatingItem } from "@/components/ui/rating";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/components/utils/cn";
```

- [ ] **Step 2: Add selectColumn**

Add the following function after the existing exports (before `ratingDisplayColumn`):

```typescript
export function selectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    size: 40,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(!!checked)
        }
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked) => row.toggleSelected(!!checked)}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        aria-label="Select row"
      />
    ),
  };
}
```

- [ ] **Step 3: Add ratingQuickActionColumn**

Add after `selectColumn`:

```typescript
export function ratingQuickActionColumn(
  onRate: (rosterId: string, rating: number) => void,
): ColumnDef<SearchDancerRow> {
  return {
    accessorKey: "rating",
    header: "Rating",
    size: 120,
    cell: ({ row }) => {
      const rating = row.original.rating;
      return (
        <div
          className="flex items-center"
          onClick={(e) => e.stopPropagation()}
        >
          {rating == null && (
            <span className="text-muted-foreground text-sm group-hover/row:hidden group-focus-within/row:hidden">
              —
            </span>
          )}
          <Rating
            size="sm"
            value={rating ?? 0}
            onValueChange={(v) => onRate(row.original.rosterId, v)}
            className={cn(
              "transition-opacity",
              rating == null
                ? "hidden group-hover/row:flex group-focus-within/row:flex"
                : "pointer-events-none group-hover/row:pointer-events-auto group-focus-within/row:pointer-events-auto",
            )}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <RatingItem key={i} index={i} />
            ))}
          </Rating>
        </div>
      );
    },
  };
}
```

- [ ] **Step 4: Add notesQuickActionColumn**

Add after `ratingQuickActionColumn`:

```typescript
export function notesQuickActionColumn(
  onOpenNotes: (rosterId: string) => void,
): ColumnDef<SearchDancerRow> {
  return {
    id: "notes",
    header: () => (
      <span title="Notes">
        <PencilIcon className="text-muted-foreground size-3.5" />
      </span>
    ),
    size: 40,
    enableSorting: false,
    cell: ({ row }) => {
      const hasNote = row.original.hasNote;
      return (
        <div className="flex items-center justify-center">
          {hasNote && (
            <span className="bg-primary inline-block size-2 rounded-full group-hover/row:hidden group-focus-within/row:hidden" />
          )}
          <button
            type="button"
            className="hidden items-center justify-center group-hover/row:flex group-focus-within/row:flex"
            onClick={(e) => {
              e.stopPropagation();
              onOpenNotes(row.original.rosterId);
            }}
            aria-label="Edit notes"
          >
            <PencilIcon className="text-muted-foreground hover:text-foreground size-3.5 transition-colors" />
          </button>
        </div>
      );
    },
  };
}
```

- [ ] **Step 5: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS (new functions are exported but not called yet)

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/columns.tsx
git commit -m "feat(columns): add select, rating quick-action, and notes quick-action columns"
```

---

### Task 3: Update useSearchColumns with opts parameter

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts`

- [ ] **Step 1: Add imports for new column functions**

Update the imports to include the new column functions:

```typescript
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  bibColumn,
  nameColumn,
  gradYearColumn,
  studioColumn,
  gpaColumn,
  favoriteToggleColumn,
  notesIndicatorColumn,
  schoolInterestColumn,
  ratingDisplayColumn,
  rankColumn,
  notePreviewColumn,
  selectColumn,
  ratingQuickActionColumn,
  notesQuickActionColumn,
  type SearchDancerRow,
  type FavoriteDancerRow,
  type RankedDancerRow,
} from "./columns";
```

- [ ] **Step 2: Update useSearchColumns signature and body**

Replace the `useSearchColumns` function:

```typescript
export function useSearchColumns(
  onFavoriteToggle: (rosterId: string, current: boolean) => void,
  opts?: {
    enableSelection?: boolean;
    onRate?: (rosterId: string, rating: number) => void;
    onOpenNotes?: (rosterId: string) => void;
  },
): ColumnDef<SearchDancerRow>[] {
  return useMemo(() => {
    const cols: ColumnDef<SearchDancerRow>[] = [];

    if (opts?.enableSelection) {
      cols.push(selectColumn<SearchDancerRow>());
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
      cols.push(notesQuickActionColumn(opts.onOpenNotes));
    } else {
      cols.push(notesIndicatorColumn as ColumnDef<SearchDancerRow>);
    }

    cols.push(schoolInterestColumn);

    return cols;
  }, [onFavoriteToggle, opts?.enableSelection, opts?.onRate, opts?.onOpenNotes]);
}
```

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS (the page still calls `useSearchColumns(handleFavoriteToggle)` with no opts — that's fine, opts is optional)

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts
git commit -m "feat(use-dancer-columns): accept opts for selection, quick-rate, quick-notes"
```

---

### Task 4: Create FloatingActionBar component

**Files:**
- Create: `apps/frontend/src/features/org/components/floating-action-bar.tsx`

- [ ] **Step 1: Create the component file**

Create `apps/frontend/src/features/org/components/floating-action-bar.tsx` with:

```typescript
import { HeartIcon, Loader2Icon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Rating, RatingItem } from "@/components/ui/rating";
import { cn } from "@/components/utils/cn";

interface FloatingActionBarProps {
  selectedCount: number;
  isVisible: boolean;
  onFavoriteAll: () => void;
  onRateAll: (rating: number) => void;
  onClear: () => void;
  isLoading: boolean;
}

export function FloatingActionBar({
  selectedCount,
  isVisible,
  onFavoriteAll,
  onRateAll,
  onClear,
  isLoading,
}: FloatingActionBarProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center xl:pr-[320px]",
        "transition-all duration-200 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <div className="bg-background border-border pointer-events-auto flex items-center gap-3 rounded-lg border px-4 py-2.5 shadow-lg">
        <span className="text-sm font-medium tabular-nums">
          {isLoading ? `Updating ${selectedCount}...` : `${selectedCount} selected`}
        </span>

        <div className="bg-border h-4 w-px" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onFavoriteAll}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <HeartIcon className="size-3.5" />
          )}
          Favorite
        </Button>

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Rate all</span>
          <Rating
            size="sm"
            value={0}
            onValueChange={(v) => onRateAll(v)}
            disabled={isLoading}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <RatingItem key={i} index={i} />
            ))}
          </Rating>
        </div>

        <div className="bg-border h-4 w-px" />

        <Button variant="ghost" size="sm" onClick={onClear} disabled={isLoading}>
          <XIcon className="size-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/floating-action-bar.tsx
git commit -m "feat: create FloatingActionBar component for bulk scouting actions"
```

---

### Task 5: Wire Phase 2 features into the page component

**Files:**
- Modify: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx`

This task adds: selection state, inline rating mutation, bulk operation handlers, new column opts, selection props on DancerTable, and the FloatingActionBar.

- [ ] **Step 1: Add imports**

Add the new imports to the top of the file. Add `RowSelectionState` from TanStack Table and `FloatingActionBar`:

```typescript
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  HeartIcon,
  PencilIcon,
  StarIcon,
  XIcon,
} from "lucide-react";
import { $api } from "@/lib/api/client";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { DancerFilterToolbar } from "@/features/org/components/dancer-filter-toolbar";
import { useSearchColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { SearchDancerRow } from "@/features/org/components/dancer-table/columns";
import { StatCell, SidebarSection } from "@/features/org/components/dashboard-shared";
import { Rating, RatingItem } from "@/components/ui/rating";
import { FloatingActionBar } from "@/features/org/components/floating-action-bar";
```

- [ ] **Step 2: Add selection state and reset on filter change**

Inside the `DancerSearch` component, after the existing filter state declarations (after `const deferredSearch = ...`), add:

```typescript
  /* --- Selection state --- */
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [yearFilter, gpaFilter, stateFilter, interested]);
```

- [ ] **Step 3: Add inline rating mutation with optimistic update**

After the `removeFav` mutation block, add:

```typescript
  const upsertRating = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      onMutate: async ({ params, body }) => {
        await qc.cancelQueries({ queryKey: dancersKey });
        const previous = qc.getQueryData(dancersKey);
        qc.setQueryData(dancersKey, (old: any) =>
          Array.isArray(old)
            ? old.map((d: any) =>
                d.rosterId === params?.path?.dancerRosterId
                  ? { ...d, rating: body?.rating ?? null }
                  : d,
              )
            : old,
        );
        return { previous };
      },
      onError: (_err, _vars, ctx: any) => {
        if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      },
      meta: {
        invalidateQueries: [
          dancersKey,
          scoutingQueries.rankings(orgSlug).queryKey,
        ],
      },
    },
  );
```

- [ ] **Step 4: Add handleRate and handleOpenNotes callbacks**

After `handleFavoriteToggle`, add:

```typescript
  const handleRate = useCallback(
    (rosterId: string, rating: number) => {
      const dancer = dancers?.find((d) => d.rosterId === rosterId);
      upsertRating.mutate({
        params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
        body: { rating },
      });
      if (dancer) {
        addActivity({
          type: "rate",
          rosterId,
          dancerName: `${dancer.firstName} ${dancer.lastName}`,
          bibNumber: dancer.bibNumber,
          rating,
        });
      }
    },
    [orgSlug, upsertRating, dancers, addActivity],
  );

  const handleOpenNotes = useCallback(
    (rosterId: string) => {
      setSheetRosterId(rosterId);
    },
    [],
  );
```

Note: `handleOpenNotes` references `setSheetRosterId` which is currently declared near the bottom of the component (after all the stats/derived data). Move the following line:

```typescript
  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);
```

from its current location to right after the activity feed state (after `const addActivity = useCallback(...)`), before `handleFavoriteToggle`. This ensures `setSheetRosterId` is available for `handleOpenNotes` without forward references.

- [ ] **Step 5: Update useSearchColumns call with opts**

Replace the existing `columns` line:

```typescript
  const columns = useSearchColumns(handleFavoriteToggle);
```

With:

```typescript
  const columns = useSearchColumns(handleFavoriteToggle, {
    enableSelection: true,
    onRate: handleRate,
    onOpenNotes: handleOpenNotes,
  });
```

- [ ] **Step 6: Add selectedRosterIds computation and bulk handlers**

After the `filteredData` computation, add:

```typescript
  const selectedRosterIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => filteredData[Number(idx)]?.rosterId)
      .filter(Boolean);
  }, [rowSelection, filteredData]);

  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const handleBulkFavorite = useCallback(async () => {
    setIsBulkLoading(true);
    try {
      await Promise.allSettled(
        selectedRosterIds.map((rosterId) => {
          const dancer = dancers?.find((d) => d.rosterId === rosterId);
          if (dancer) {
            addActivity({
              type: "favorite",
              rosterId,
              dancerName: `${dancer.firstName} ${dancer.lastName}`,
              bibNumber: dancer.bibNumber,
            });
          }
          return addFav.mutateAsync({
            params: { path: { slug: orgSlug } },
            body: { dancerRosterId: rosterId },
          });
        }),
      );
    } finally {
      setIsBulkLoading(false);
      setRowSelection({});
    }
  }, [selectedRosterIds, dancers, addFav, orgSlug, addActivity]);

  const handleBulkRate = useCallback(
    async (rating: number) => {
      setIsBulkLoading(true);
      try {
        await Promise.allSettled(
          selectedRosterIds.map((rosterId) => {
            const dancer = dancers?.find((d) => d.rosterId === rosterId);
            if (dancer) {
              addActivity({
                type: "rate",
                rosterId,
                dancerName: `${dancer.firstName} ${dancer.lastName}`,
                bibNumber: dancer.bibNumber,
                rating,
              });
            }
            return upsertRating.mutateAsync({
              params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
              body: { rating },
            });
          }),
        );
      } finally {
        setIsBulkLoading(false);
        setRowSelection({});
      }
    },
    [selectedRosterIds, dancers, upsertRating, orgSlug, addActivity],
  );
```

- [ ] **Step 7: Pass selection props to DancerTable**

Update the `<DancerTable>` JSX to include selection props:

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
            onRowClick={(row) => setSheetRosterId(row.rosterId)}
            renderCard={(row) => (
              <DancerCard
                dancer={row}
                onClick={() => setSheetRosterId(row.rosterId)}
              />
            )}
            sorting={[{ id: "name", desc: false }]}
            enableSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
```

- [ ] **Step 8: Add FloatingActionBar after the DancerTable container div**

After the closing `</div>` of the main column (the one containing the DancerTable), add the FloatingActionBar. Place it right before the `{/* Sidebar */}` comment:

```tsx
      <FloatingActionBar
        selectedCount={selectedRosterIds.length}
        isVisible={selectedRosterIds.length > 0}
        onFavoriteAll={handleBulkFavorite}
        onRateAll={handleBulkRate}
        onClear={() => setRowSelection({})}
        isLoading={isBulkLoading}
      />

      {/* Sidebar */}
```

- [ ] **Step 9: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx
git commit -m "feat(coach-dancers): wire selection, hover quick-actions, and floating action bar"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start dev server**

Run: `cd apps/frontend && pnpm dev`

- [ ] **Step 2: Test hover quick-actions**

Navigate to an org's coach dancers page. Hover over a table row:
- Rating column: empty rows show 5 interactive stars on hover; rated rows become clickable on hover
- Notes column: dot indicator hides and pencil icon appears on hover
- Click a star — rating should persist (visible when you hover again)
- Click pencil — DancerSheet should open

- [ ] **Step 3: Test multi-select**

- Click checkbox on 2-3 rows — checkboxes should check
- Click header checkbox — all visible page rows should select
- Click header checkbox again — all deselect
- Change a filter dropdown — selection should clear

- [ ] **Step 4: Test floating action bar**

- Select 2+ rows — floating bar appears with slide-up animation at bottom center
- Click "Favorite" — all selected dancers get favorited, selection clears
- Select 2+ rows again — click a star in the "Rate all" section — all selected dancers get that rating, selection clears
- Click "Clear" — selection clears, bar disappears

- [ ] **Step 5: Test activity feed**

- After bulk favorite/rate, check the sidebar "Your Session" section — activity items should appear for each dancer in the bulk action

- [ ] **Step 6: Final typecheck and lint**

Run: `cd apps/frontend && pnpm typecheck && pnpm lint`
Expected: PASS for both
