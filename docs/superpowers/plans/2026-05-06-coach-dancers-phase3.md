# Phase 3: Compare View, Error Handling & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a side-by-side dancer comparison view, error toasts for mutation failures, skeleton loading states, and a keyboard shortcut for search focus.

**Architecture:** A new `CompareView` component replaces the main column content when compare mode is active. Error toasts use the existing BaseUI `toastManager`. Skeleton states extend `DancerTable` and `DancerSheet` with `Skeleton` components. A `keydown` listener on the page handles `/` to focus search and `Escape` to clear selection.

**Tech Stack:** React 19, TanStack Query, BaseUI Toast (`toastManager`), existing `Skeleton` component, existing `Rating`/`FavoriteButton` components.

**Design spec:** `docs/superpowers/specs/2026-05-06-coach-dancers-phase3-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx` | Modify | Skeleton loading rows |
| `apps/frontend/src/features/org/components/dancer-sheet.tsx` | Modify | Skeleton loading state |
| `apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx` | Modify | Accept `searchRef` prop |
| `apps/frontend/src/features/org/components/compare-view.tsx` | Create | Side-by-side compare component |
| `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx` | Modify | Compare mode, error toasts, keyboard shortcuts, sidebar loading |

---

### Task 1: Skeleton loading in DancerTable

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx`

- [ ] **Step 1: Add Skeleton import**

Add to the imports:

```typescript
import { Skeleton } from "@/components/ui/skeleton";
```

- [ ] **Step 2: Replace desktop loading state with skeleton rows**

Find the desktop loading branch inside `<TableBody>` (the `isLoading` ternary). Replace:

```tsx
            {isLoading ? (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  <div className="flex h-full items-center justify-center gap-2">
                    <Loader2Icon
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            )
```

With:

```tsx
            {isLoading ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={`skeleton-${i}`} className="pointer-events-none">
                  {Array.from({ length: columns.length }, (_, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      <Skeleton className="h-4 w-full rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )
```

- [ ] **Step 3: Replace mobile loading state with skeleton cards**

Find the mobile loading branch (the `isLoading` ternary inside `<div className="flex flex-col gap-2 sm:hidden">`). Replace:

```tsx
          <div className="flex h-24 items-center justify-center gap-2">
            <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
```

With:

```tsx
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={`skeleton-card-${i}`}
                className="flex flex-col gap-2 rounded-lg border p-3"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-10 rounded" />
                  <Skeleton className="size-4 rounded" />
                </div>
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
```

- [ ] **Step 4: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx
git commit -m "feat(dancer-table): replace loading spinner with skeleton rows and cards"
```

---

### Task 2: Skeleton loading in DancerSheet

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-sheet.tsx`

- [ ] **Step 1: Add Skeleton import**

Add to the imports:

```typescript
import { Skeleton } from "@/components/ui/skeleton";
```

- [ ] **Step 2: Replace text loading state with skeleton**

In `DancerSheetContent`, replace the loading branch:

```tsx
  if (isLoading || !dancer) {
    return (
      <SheetHeader>
        <SheetTitle>Loading...</SheetTitle>
      </SheetHeader>
    );
  }
```

With:

```tsx
  if (isLoading || !dancer) {
    return (
      <>
        <SheetHeader>
          <div className="flex items-start gap-3">
            <Skeleton className="size-16 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
          </div>
        </SheetHeader>
        <SheetContent className="px-4 py-3">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-10 w-24 rounded" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-24 w-full rounded" />
            </div>
          </div>
        </SheetContent>
      </>
    );
  }
```

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-sheet.tsx
git commit -m "feat(dancer-sheet): replace loading text with skeleton placeholder"
```

---

### Task 3: Add searchRef to DancerFilterToolbar

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx`

- [ ] **Step 1: Add ref prop to interface and component**

Add the import:

```typescript
import type { RefObject } from "react";
```

Add to `DancerFilterToolbarProps`:

```typescript
interface DancerFilterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  yearFilter: number | null;
  onYearFilterChange: (value: number | null) => void;
  gpaFilter: string | null;
  onGpaFilterChange: (value: string | null) => void;
  stateFilter: string | null;
  onStateFilterChange: (value: string | null) => void;
  interested: boolean;
  onInterestedChange: (value: boolean) => void;
  schoolName: string | null;
  availableYears: number[];
  availableStates: string[];
  searchRef?: RefObject<HTMLInputElement | null>;
}
```

- [ ] **Step 2: Destructure and wire the ref**

Add `searchRef` to the destructured props:

```typescript
export function DancerFilterToolbar({
  search,
  onSearchChange,
  yearFilter,
  onYearFilterChange,
  gpaFilter,
  onGpaFilterChange,
  stateFilter,
  onStateFilterChange,
  interested,
  onInterestedChange,
  schoolName,
  availableYears,
  availableStates,
  searchRef,
}: DancerFilterToolbarProps) {
```

Add `ref={searchRef}` to the `InputGroupInput`:

```tsx
        <InputGroupInput
          ref={searchRef}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name or bib #..."
          inputMode="search"
          data-size="sm"
        />
```

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS (searchRef is optional, existing callers unaffected)

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx
git commit -m "feat(filter-toolbar): accept searchRef for keyboard shortcut focus"
```

---

### Task 4: Create CompareView component

**Files:**
- Create: `apps/frontend/src/features/org/components/compare-view.tsx`

- [ ] **Step 1: Create the component file**

Create `apps/frontend/src/features/org/components/compare-view.tsx`:

```typescript
import { useMemo } from "react";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating, RatingItem } from "@/components/ui/rating";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { FavoriteButton } from "./favorite-button";
import { RatingInput } from "./rating-input";
import { cn } from "@/components/utils/cn";

interface CompareViewProps {
  compareIds: string[];
  onRemove: (rosterId: string) => void;
  onBack: () => void;
  onOpenSheet: (rosterId: string) => void;
}

export function CompareView({
  compareIds,
  onRemove,
  onBack,
  onOpenSheet,
}: CompareViewProps) {
  const { org } = useOrg();

  // Query all compared dancers in parallel via useQueries (hook-safe)
  const dancerQueries = useQueries({
    queries: compareIds.map((id) => scoutingQueries.dancer(org.slug, id)),
  });

  // Compute max GPA across all loaded dancers for best-value highlighting
  const dancerData = dancerQueries.map((q) => q.data);
  const maxGpa = useMemo(() => {
    const gpas = dancerData
      .map((d) => d?.gpa)
      .filter((g): g is number => g != null);
    return gpas.length > 0 ? Math.max(...gpas) : 0;
  }, [dancerData]);

  // Compute max rating across all loaded dancers
  const maxRating = useMemo(() => {
    const ratings = dancerData
      .map((d) => d?.rating)
      .filter((r): r is number => r != null);
    return ratings.length > 0 ? Math.max(...ratings) : 0;
  }, [dancerData]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="size-3.5" />
          Back to table
        </Button>
      </div>

      <div
        className={cn(
          "grid gap-4",
          compareIds.length === 2 ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {compareIds.map((rosterId, idx) => (
          <CompareColumn
            key={rosterId}
            rosterId={rosterId}
            query={dancerQueries[idx]}
            maxGpa={maxGpa}
            maxRating={maxRating}
            onRemove={onRemove}
            onOpenSheet={onOpenSheet}
          />
        ))}
      </div>
    </div>
  );
}

function CompareColumn({
  rosterId,
  query,
  maxGpa,
  maxRating,
  onRemove,
  onOpenSheet,
}: {
  rosterId: string;
  query: UseQueryResult;
  maxGpa: number;
  maxRating: number;
  onRemove: (rosterId: string) => void;
  onOpenSheet: (rosterId: string) => void;
}) {
  const dancer = query.data;

  if (query.isLoading || !dancer) {
    return (
      <div className="bg-card border-border flex flex-col gap-4 rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="size-12 rounded-lg" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-3 w-48 rounded" />
        <Skeleton className="h-10 w-16 rounded" />
        <Skeleton className="h-5 w-28 rounded" />
        <Skeleton className="h-20 w-full rounded" />
      </div>
    );
  }

  const isTopGpa = dancer.gpa != null && dancer.gpa >= maxGpa;
  const isTopRating = dancer.rating != null && dancer.rating >= maxRating;

  return (
    <div className="bg-card border-border flex flex-col gap-4 rounded-lg border p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Avatar className="size-12 rounded-lg">
            <AvatarImage src={dancer.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="rounded-lg">
              {dancer.firstName?.[0]}
              {dancer.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => onOpenSheet(rosterId)}
              className="text-left text-base font-semibold hover:underline"
            >
              {dancer.bibNumber != null && (
                <span className="text-muted-foreground mr-1 font-mono text-xs">
                  #{String(dancer.bibNumber).padStart(2, "0")}
                </span>
              )}
              {dancer.firstName} {dancer.lastName}
            </button>
            <p className="text-muted-foreground text-sm">
              {[
                dancer.gradYear ? `Class of ${dancer.gradYear}` : null,
                dancer.state,
                dancer.studio,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(rosterId)}
          className="text-muted-foreground hover:text-foreground p-0.5"
          aria-label="Remove from compare"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* GPA */}
      <div>
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          GPA
        </span>
        <p
          className={cn(
            "text-2xl font-semibold tabular-nums",
            isTopGpa ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {dancer.gpa != null ? dancer.gpa.toFixed(1) : "—"}
        </p>
      </div>

      {/* Rating */}
      <div>
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Rating
        </span>
        <div className={cn("mt-1", !isTopRating && dancer.rating != null && "opacity-60")}>
          <RatingInput value={dancer.rating ?? null} dancerRosterId={rosterId} />
        </div>
      </div>

      {/* Favorite */}
      <FavoriteButton dancerRosterId={rosterId} isFavorited={dancer.isFavorited} />

      {/* Notes */}
      <div>
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Notes
        </span>
        {dancer.note ? (
          <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
            {dancer.note}
          </p>
        ) : (
          <p className="text-muted-foreground mt-1 text-sm italic">
            No notes yet
          </p>
        )}
      </div>

      {/* Bio */}
      {dancer.bio && (
        <div>
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Bio
          </span>
          <p className="text-muted-foreground mt-1 line-clamp-4 text-sm whitespace-pre-wrap">
            {dancer.bio}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/compare-view.tsx
git commit -m "feat: create CompareView component for side-by-side dancer comparison"
```

---

### Task 5: Wire everything into the page component

**Files:**
- Modify: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx`

This task adds: compare mode state, error toasts, sidebar loading, keyboard shortcuts, search ref, and the compare view toggle.

- [ ] **Step 1: Add new imports**

Add to the imports at the top of the file:

```typescript
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { CompareView } from "@/features/org/components/compare-view";
import { toastManager } from "@/components/ui/toast-manager";
```

Note: `useRef` was not previously imported. Add it to the existing `react` import. Also add `CompareView` and `toastManager`.

- [ ] **Step 2: Add compare mode state and search ref**

Inside `DancerSearch`, after the selection state declarations, add:

```typescript
  /* --- Compare mode --- */
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    if (compareIds.length < 2) setCompareMode(false);
  }, [compareIds.length]);

  /* --- Search ref --- */
  const searchRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 3: Add error toasts to existing mutations**

Add `toastManager.add` calls to the `onError` callbacks of the three inline mutations.

For `addFav`, update the `onError`:

```typescript
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      toastManager.add({ title: "Couldn't favorite dancer", type: "error" });
    },
```

For `removeFav`, update the `onError`:

```typescript
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      toastManager.add({ title: "Couldn't remove favorite", type: "error" });
    },
```

For `upsertRating`, update the `onError`:

```typescript
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      toastManager.add({ title: "Couldn't save rating", type: "error" });
    },
```

- [ ] **Step 4: Add error handling to bulk operations**

Update `handleBulkFavorite` — replace the `try` block body:

```typescript
  const handleBulkFavorite = useCallback(async () => {
    setIsBulkLoading(true);
    try {
      const results = await Promise.allSettled(
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
      const failures = results.filter((r) => r.status === "rejected");
      if (failures.length > 0) {
        toastManager.add({
          title: `${failures.length} of ${selectedRosterIds.length} favorites failed`,
          type: "error",
        });
      }
    } finally {
      setIsBulkLoading(false);
      setRowSelection({});
    }
  }, [selectedRosterIds, dancers, addFav, orgSlug, addActivity]);
```

Update `handleBulkRate` — same pattern:

```typescript
  const handleBulkRate = useCallback(
    async (rating: number) => {
      setIsBulkLoading(true);
      try {
        const results = await Promise.allSettled(
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
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
          toastManager.add({
            title: `${failures.length} of ${selectedRosterIds.length} ratings failed`,
            type: "error",
          });
        }
      } finally {
        setIsBulkLoading(false);
        setRowSelection({});
      }
    },
    [selectedRosterIds, dancers, upsertRating, orgSlug, addActivity],
  );
```

- [ ] **Step 5: Add keyboard shortcut listener**

After the bulk handlers, add:

```typescript
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (e.key === "Escape" && !isInput && selectedRosterIds.length > 0) {
        setRowSelection({});
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedRosterIds.length]);
```

- [ ] **Step 6: Pass searchRef to DancerFilterToolbar**

Update the `<DancerFilterToolbar>` JSX to include `searchRef`:

```tsx
        <DancerFilterToolbar
          search={search}
          onSearchChange={setSearch}
          yearFilter={yearFilter}
          onYearFilterChange={setYearFilter}
          gpaFilter={gpaFilter}
          onGpaFilterChange={setGpaFilter}
          stateFilter={stateFilter}
          onStateFilterChange={setStateFilter}
          interested={interested}
          onInterestedChange={setInterested}
          schoolName={org.name}
          availableYears={availableYears}
          availableStates={availableStates}
          searchRef={searchRef}
        />
```

- [ ] **Step 7: Add compare mode toggle to the main column**

In the JSX, the main column currently renders: header → stat rail → filter toolbar → table. When `compareMode` is true, replace the stat rail + filter toolbar + table section with the `CompareView`.

Find the section starting with `<section aria-label="Scouting stats"` and wrap it plus the filter toolbar and table container in a conditional:

```tsx
        {compareMode ? (
          <CompareView
            compareIds={compareIds}
            onRemove={(id) =>
              setCompareIds((prev) => prev.filter((c) => c !== id))
            }
            onBack={() => setCompareMode(false)}
            onOpenSheet={(rosterId) => setSheetRosterId(rosterId)}
          />
        ) : (
          <>
            <section
              aria-label="Scouting stats"
              className="border-border flex items-stretch border-y"
            >
              <StatCell label="To Review" value={toReviewCount} accent="blue" />
              <StatCell label="Favorited" value={favCount} />
              <StatCell label="Avg GPA" value={avgGpa} />
            </section>

            <DancerFilterToolbar
              search={search}
              onSearchChange={setSearch}
              yearFilter={yearFilter}
              onYearFilterChange={setYearFilter}
              gpaFilter={gpaFilter}
              onGpaFilterChange={setGpaFilter}
              stateFilter={stateFilter}
              onStateFilterChange={setStateFilter}
              interested={interested}
              onInterestedChange={setInterested}
              schoolName={org.name}
              availableYears={availableYears}
              availableStates={availableStates}
              searchRef={searchRef}
            />

            <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
              <DancerTable<SearchDancerRow>
                {/* ... existing props ... */}
              />
            </div>
          </>
        )}
```

Keep the `<header>` outside the conditional — the page title stays visible in both modes.

- [ ] **Step 8: Add "View Comparison" button to CompareClipboard**

In the `CompareClipboard` component (same file), add a button after the pinned dancers list when 2+ are pinned. Find the closing `</ul>` inside `CompareClipboard` and add after it:

```tsx
        {pinned.length >= 2 && (
          <Button
            variant="default"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setCompareMode(true)}
          >
            View Comparison
          </Button>
        )}
```

`CompareClipboard` doesn't currently have access to `setCompareMode`. Add it as a prop:

Update the `CompareClipboard` function signature:

```typescript
function CompareClipboard({
  dancers,
  compareIds,
  onRemove,
  onViewCompare,
}: {
  dancers: DancerData[];
  compareIds: string[];
  onRemove: (id: string) => void;
  onViewCompare: () => void;
}) {
```

And use `onViewCompare` instead of `setCompareMode`:

```tsx
          <Button
            variant="default"
            size="sm"
            className="mt-2 w-full"
            onClick={onViewCompare}
          >
            View Comparison
          </Button>
```

Update the call site in `ScoutingSidebar` to pass the new prop:

```tsx
      <CompareClipboard
        dancers={dancers}
        compareIds={compareIds}
        onRemove={onRemoveCompare}
        onViewCompare={onViewCompare}
      />
```

And add `onViewCompare` to `ScoutingSidebar`'s props:

```typescript
function ScoutingSidebar({
  dancers,
  filteredUnreviewedCount,
  reviewedCount,
  totalCount,
  compareIds,
  onRemoveCompare,
  onViewCompare,
  activity,
  onActivityClick,
}: {
  dancers: DancerData[];
  filteredUnreviewedCount: number;
  reviewedCount: number;
  totalCount: number;
  compareIds: string[];
  onRemoveCompare: (id: string) => void;
  onViewCompare: () => void;
  activity: ActivityItem[];
  onActivityClick: (rosterId: string) => void;
}) {
```

Finally, update the `<ScoutingSidebar>` call in the page JSX to pass `onViewCompare`:

```tsx
      <ScoutingSidebar
        dancers={dancers ?? []}
        filteredUnreviewedCount={filteredData.filter(
          (d) => !d.isFavorited && d.rating == null && !d.hasNote,
        ).length}
        reviewedCount={reviewedCount}
        totalCount={dancerCount}
        compareIds={compareIds}
        onRemoveCompare={(id) =>
          setCompareIds((prev) => prev.filter((c) => c !== id))
        }
        onViewCompare={() => setCompareMode(true)}
        activity={activity}
        onActivityClick={(rosterId) => setSheetRosterId(rosterId)}
      />
```

- [ ] **Step 9: Add isLoading to ScoutingSidebar**

Add `isLoading` prop to `ScoutingSidebar`:

```typescript
function ScoutingSidebar({
  dancers,
  isLoading,
  filteredUnreviewedCount,
  // ... rest of props
}: {
  dancers: DancerData[];
  isLoading: boolean;
  filteredUnreviewedCount: number;
  // ... rest of types
}) {
```

Pass it from the page:

```tsx
      <ScoutingSidebar
        dancers={dancers ?? []}
        isLoading={isLoading}
        // ... rest
      />
```

In `TalentPoolBreakdown`, add an `isLoading` prop and render skeleton bars when true:

```typescript
function TalentPoolBreakdown({
  dancers,
  isLoading,
}: {
  dancers: DancerData[];
  isLoading?: boolean;
}) {
  // ... existing useMemo hooks ...

  if (isLoading) {
    return (
      <SidebarSection title="Talent pool">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, section) => (
            <div key={section} className="flex flex-col gap-1">
              <Skeleton className="mb-1.5 h-2.5 w-16 rounded" />
              {Array.from({ length: 3 }, (_, row) => (
                <div key={row} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-10 rounded" />
                  <Skeleton className="h-1.5 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-6 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </SidebarSection>
    );
  }

  if (dancers.length === 0) return null;

  // ... rest of existing render
```

Add `Skeleton` import at the top of the page file:

```typescript
import { Skeleton } from "@/components/ui/skeleton";
```

Pass `isLoading` down from `ScoutingSidebar` to `TalentPoolBreakdown`:

```tsx
      <TalentPoolBreakdown dancers={dancers} isLoading={isLoading} />
```

Similarly add skeleton for `ScoutingSession`:

In the `ScoutingSession` component, add `isLoading` prop:

```typescript
function ScoutingSession({
  reviewedCount,
  totalCount,
  filteredUnreviewed,
  activity,
  onActivityClick,
  isLoading,
}: {
  reviewedCount: number;
  totalCount: number;
  filteredUnreviewed: number;
  activity: ActivityItem[];
  onActivityClick: (rosterId: string) => void;
  isLoading?: boolean;
}) {
```

Add skeleton render at the top of the function:

```typescript
  if (isLoading) {
    return (
      <SidebarSection title="Your session">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-2.5 w-8 rounded" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <Skeleton className="h-3 w-48 rounded" />
        </div>
      </SidebarSection>
    );
  }
```

Pass `isLoading` from `ScoutingSidebar`:

```tsx
      <ScoutingSession
        reviewedCount={reviewedCount}
        totalCount={totalCount}
        filteredUnreviewed={filteredUnreviewedCount}
        activity={activity}
        onActivityClick={onActivityClick}
        isLoading={isLoading}
      />
```

- [ ] **Step 10: Verify typecheck**

Run: `cd apps/frontend && pnpm typecheck`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx
git commit -m "feat(coach-dancers): add compare view, error toasts, skeletons, keyboard shortcut"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start dev server**

Run: `cd apps/frontend && pnpm dev`

- [ ] **Step 2: Test compare view**

- Pin 2 dancers via the DancerSheet Compare button
- Sidebar should show "View Comparison" button
- Click it — main column replaces with side-by-side compare cards
- Each card shows avatar, name, GPA (highlighted for highest), rating (interactive), favorite, notes, bio
- Remove a dancer from compare — if only 1 remains, exits compare mode automatically
- "Back to table" button returns to normal view

- [ ] **Step 3: Test error toasts**

- Disconnect from network (or throttle to offline in DevTools)
- Try favoriting a dancer — should see "Couldn't favorite dancer" toast
- Try rating a dancer — should see "Couldn't save rating" toast
- Reconnect and verify normal behavior resumes

- [ ] **Step 4: Test skeleton loading**

- Hard refresh the page
- Table should show skeleton rows while data loads
- DancerSheet should show skeleton when opening a dancer
- Sidebar should show skeleton bars while data loads

- [ ] **Step 5: Test keyboard shortcut**

- Press `/` — search input should focus
- Type a search query, then press `Escape` — should blur search
- Select some rows, then press `Escape` — selection should clear
- Focus on the search input and press `/` — should type "/" (not captured since input is focused)

- [ ] **Step 6: Final typecheck and lint**

Run: `cd apps/frontend && pnpm typecheck && pnpm lint`
Expected: PASS for both
