# Roster Pages Command Center Design

**Date:** 2026-04-11
**Branch of work:** continues `plan/summit-04-coach-scouting` roster lineage
**Related pages:** `/admin/dancers`, `/admin/coaches`

## Summary

Refresh `/admin/dancers` and `/admin/coaches` so they feel like part of the same operator command-center product as `/admin`. Replace the generic `title + search + two selects` toolbar with a proper page header (stat strip + coverage bar) that mirrors the landing page's visual language, replace the Status dropdown with clickable stat cells, and add real B2B SaaS toolbar affordances: columns popover, density toggle, always-visible Export, active filter chips.

## Motivation

The admin landing page speaks a specific visual language: an `EventHeader` with phase + coverage, a 4-cell `StatCell` strip with `border-y`, tracking-wide uppercase section labels, `bg-muted/40` panel headers, a right-rail for meta. The dancers/coaches pages drop a stock shadcn-datatable toolbar (`title | search | Status select | Org select`) on top of a well-styled table. Two problems:

1. The pages don't feel like part of the same product as `/admin` — there is no shared typographic or structural language.
2. The toolbar reads as AI-generated / template-scaffolded. Two selects sitting next to an input is the single most common "we made a data table" shape, and it carries no signal that this is a real operator console.

This spec fixes both.

## Scope

**In scope:**

- New backend endpoint `GET /orgs/:slug/events/:id/rosters/stats?type=dancer|coach` returning `{ total, active, pending }`.
- New frontend component `<RosterPageHeader>` that renders the title row + stat strip and owns the status filter.
- `DataGrid` refactor: columns popover, density toggle, always-visible Export button, active-filter chips row, localStorage persistence for columns + density, removal of the `title`/`subtitle` props now that the page header owns that space.
- Rewire `dancers.tsx` and `coaches.tsx` to render `<RosterPageHeader>` above `DataGrid`, source stats from the new query, remove the Status filter from `DataGrid`'s `filters` prop, pass the new `storageKey` + `onExport` props.
- Rename the bulk-actions Export to `Export selection` so the toolbar Export and the bulk-action Export are two unambiguous verbs.

**Out of scope:**

- Saved views / named filter presets.
- Server-stored user preferences (columns / density persist to `localStorage` only).
- Bib coverage stat cell for dancers (would require a second backend addition; defer until someone asks).
- Right-rail context panel on the roster pages.
- Any rework of `roster-detail-sheet.tsx` or `roster-bulk-actions.tsx` beyond the Export label rename and the extraction of an export handler.

## Decision Log

From the brainstorming session, in order:

1. **Shared `<RosterPageHeader>` component, not diverging components.** Both pages render the same 4-cell strip: Total / Active / Pending / Orgs. Shipping-friendly; can upgrade to a pluggable 4th cell later when bib coverage lands.
2. **The stat strip IS the status filter.** Click `Total` to clear status, click `Active` or `Pending` to filter. `Orgs` is read-only telemetry (no pointer cursor, no `data-active` treatment). The small inconsistency of "three cells are buttons, one is a div" is worth the payoff of having exactly one status-filter surface on the page.
3. **Include the full operator toolbar.** Columns popover, density toggle, always-visible Export. User explicitly wanted the page to feel "complete."
4. **`localStorage` keyed per page.** Columns and density persist across reloads, do not sync across devices. Keys: `s2s:datagrid:roster-dancers:columns`, `s2s:datagrid:roster-dancers:density`, and same for coaches. No backend preferences change.
5. **Two density levels.** `Comfortable` (current default: `py-1.5 text-xs`) and `Compact` (`py-1 text-[11px]`). Three levels is overkill for a roster table.
6. **Toolbar Export = export current filtered view.** Bulk-actions Export stays but renames to `Export selection` so the two verbs are unambiguous. (Both call the same helper today — they will in the future diverge when ids-based export is added, but that's out of scope.)
7. **Skip saved views.** It's a real feature with its own UX (naming, listing, default, sharing). Adding it here would balloon the PR.
8. **Add a new backend endpoint; do not triple-fetch from the frontend.** One Drizzle query with `count(*) filter (where …)` is the right long-term shape and costs one handler to write.

## Backend Spec

### Location

`apps/backend/app/modules/orgs/events/rosters/stats/` — a new module folder that mirrors the existing `rosters/filters/` module exactly.

### Files to create

**`controller.ts`** — one-method class, copy of `filters/controller.ts` with the class name and service type swapped:

```ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { StatsRosterService } from "./service.ts";
import { schema } from "./validator.ts";

export default class StatsRosterController {
  @inject()
  async handle(ctx: HttpContext, service: StatsRosterService) {
    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(ctx.params.id, payload);
    return ctx.response.ok(result);
  }
}
```

**`service.ts`** — single Drizzle query using Postgres `count(*) filter (…)`, which returns all three numbers in one round trip:

```ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, eq, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class StatsRosterService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, q: Validator) {
    const [row] = await this.db.use((db) =>
      db
        .select({
          total: sql<number>`count(*)::int`,
          active: sql<number>`count(*) filter (where ${eventRosters.userId} is not null)::int`,
          pending: sql<number>`count(*) filter (where ${eventRosters.userId} is null)::int`,
        })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, q.type),
          ),
        ),
    );
    return {
      total: row?.total ?? 0,
      active: row?.active ?? 0,
      pending: row?.pending ?? 0,
    };
  }
}
```

Rationale: "active" = `userId IS NOT NULL`, "pending" = `userId IS NULL`. This matches the conventions used by the list service (`rosters/list/service.ts`), which already filters by the same columns.

**`validator.ts`** — identical in shape to `filters/validator.ts`:

```ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    type: vine.enum(["dancer", "coach"] as const),
  }),
);
export type Validator = Infer<typeof schema>;
```

**`service.spec.ts`** — Japa test, mirroring `filters/service.spec.ts`. At minimum:

1. Returns `{ total: 0, active: 0, pending: 0 }` when the event has no rosters.
2. Correctly counts active vs pending dancers (seed: 2 dancers with `userId`, 1 dancer without) and returns `{ total: 3, active: 2, pending: 1 }` for `type: 'dancer'`.
3. Does not count the wrong type — seeding coaches alongside dancers must not affect the dancer counts.
4. Filters by `eventId` — rosters in a different event must not appear in the counts.

### Route registration

One new line in `apps/backend/app/modules/orgs/events/routes.ts`, placed next to the existing `rosters/filters` route (near line 35):

```ts
router.get(
  "/orgs/:slug/events/:id/rosters/stats",
  [() => import("./rosters/stats/controller.ts")],
);
```

### OpenAPI + Tuyau regeneration

From `apps/backend`:

```bash
pnpm make:docs
```

This runs `node ace tuyau:generate && node ace generate:openapi` and updates:

- `apps/backend/.adonisjs/api.ts`
- `apps/backend/openapi.json`

From `apps/frontend`:

```bash
pnpm types
```

This regenerates `apps/frontend/src/lib/api/types.d.ts` from the backend OpenAPI spec so the new endpoint is typed end-to-end.

## Frontend Spec

### New file: `apps/frontend/src/features/org/components/roster-page-header.tsx`

Exports `<RosterPageHeader>`. Props:

```ts
interface RosterPageHeaderProps {
  title: string;                    // "Dancers" | "Coaches"
  eventName: string;
  stats: {
    total: number;
    active: number;
    pending: number;
    orgCount: number;
  };
  isLoading?: boolean;
  status: "all" | "active" | "pending";
  onStatusChange: (status: "all" | "active" | "pending") => void;
}
```

Layout — intentionally mirrors `admin/index.tsx:169-260` structurally:

- **Outer wrapper:** `<section>` containing two children.
- **Title row** (matches `EventHeader`):
  `<header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">`
  - Left: `<h1 className="text-lg font-semibold tracking-tight">{title}</h1>` followed by a muted tabular-nums `<span>` with the event name.
  - Right: activation indicator — `{active}/{total} activated` using the same progress bar pattern as `EventHeader` (`bg-border h-0.5 w-[120px]` outer, `bg-foreground` inner set via inline `width` style, `aria-valuenow` etc.). Percent reuses the `activationPct` calculation.
- **Stat strip** (matches `StatCell` row):
  `<div className="border-border flex items-stretch border-y">`
  Four cells:
  - `Total` — `<button type="button">` with `data-active={status === "all"}`. Clicking calls `onStatusChange("all")`.
  - `Active` — same pattern, `data-active={status === "active"}`. Clicking calls `onStatusChange("active")`.
  - `Pending` — same pattern, `data-active={status === "pending"}`. Clicking calls `onStatusChange("pending")`.
  - `Orgs` — plain `<div>`, no button semantics, no pointer cursor, label color `text-muted-foreground` kept but slightly dimmer weight than the active-cell label.
- **Active cell styling:** when `data-active` is set, the cell gains a 2px top accent in `bg-foreground` (rendered as a `before:` pseudo-element or an inner top-border div — additive, does *not* replace the existing `border-l` between cells), and the uppercase label flips from `text-muted-foreground` to `text-foreground`. The goal is that at a glance the active cell reads as "selected tab" without any separate control.
- **Loading state:** when `isLoading`, render each cell with a `–` in the number slot instead of a skeleton, keeping `tabular-nums` so the layout does not jump when the real numbers arrive.

A local `StatCell` helper function lives in the same file. It is not shared with `admin/index.tsx:249-260` — the structural overlap is small and the active-state needs of this component would require the shared version to grow unbounded props. Keep them diverged.

### Modified file: `apps/frontend/src/features/org/components/data-grid.tsx`

1. **Remove `title` / `subtitle` props** from `DataGridProps`. Delete the title/subtitle block inside the toolbar (currently lines 262-270). Both roster pages will be updated in the same PR so there is no lingering consumer.
2. **Add a required `storageKey: string` prop.** Used to namespace `localStorage` keys for columns and density. Values: `"roster-dancers"`, `"roster-coaches"`.
3. **Columns popover:**
   - State: `const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(...)`, hydrated from `localStorage.getItem(\`s2s:datagrid:\${storageKey}:columns\`)` (JSON-parsed; fall back to empty object on parse error) and persisted via `useEffect` on every change.
   - Apply to the table via `useReactTable({ state: { columnVisibility, ... }, onColumnVisibilityChange: setColumnVisibility })`.
   - Toolbar button: small `Button` with a `SlidersHorizontalIcon` and label `Columns` (label hidden below `sm` breakpoint). Opens a `Popover` with a `<Checkbox>` per column, excluding `id === "select"` and `id === "lastName"` (Name is the non-hideable anchor).
4. **Density toggle:**
   - State: `const [density, setDensity] = useState<"comfortable" | "compact">(...)`, hydrated/persisted under `s2s:datagrid:${storageKey}:density`. Default: `"comfortable"`.
   - Applied via a `data-density` attribute on the scrollable table wrapper `<div>`. A small set of conditional classes on `<th>` / `<td>` handles the two densities: comfortable = `px-2 py-1.5 text-xs`, compact = `px-2 py-1 text-[11px]`. Keep both in the component — no separate CSS file.
   - Toolbar button: `Button` with a `RowsIcon` (or equivalent from lucide-react) and label `Density`. Opens a `Popover` with two `<MenuItem>`s ("Comfortable" / "Compact").
5. **Export button:**
   - New `onExport?: () => void` prop.
   - When set, render a `Button` with a `DownloadIcon` and label `Export` in the toolbar, right-aligned after the filters (before the filter popover on small screens).
   - The button calls `onExport()` directly.
6. **Active filter chips row:**
   - Rendered only when `filters?.some((f) => f.value !== f.options[0]?.value)`. When no filter is applied, nothing renders — no spacer — so the table does not shift on unrelated interactions.
   - Location: directly below the toolbar `<div>`, inside the main `DataGrid` root `<div>` but above the scrollable table wrapper. Uses a thin separator-less row with horizontal padding matching the toolbar.
   - Each chip: `<span>` with `border border-border bg-muted/40 px-2 py-0.5 text-[11px] rounded-md inline-flex items-center gap-1`, content `{filter.label}: {activeOptionLabel}`, followed by an `<XIcon className="size-3">` inside a small button that calls `filter.onChange(filter.options[0].value)` on click. Active option label resolved by `filter.options.find(o => o.value === filter.value)?.label ?? filter.value`.
7. **Internal toolbar layout:** ordering after refactor (left to right):
   - Search input (`flex-1` with `sm:max-w-56` cap, unchanged).
   - Org filter `Select` (unchanged structure, just no more Status filter to its left).
   - Spacer or `ml-auto` on the next group.
   - Columns button.
   - Density button.
   - Export button (only if `onExport` is set).
   - Filter popover for small screens (unchanged).
8. **Bulk-actions toolbar unchanged** except for the Export label rename, which happens in `roster-bulk-actions.tsx`, not here.

### Modified file: `apps/frontend/src/features/org/components/roster-bulk-actions.tsx`

Rename the Export action's `label` from `"Export"` to `"Export selection"`. No behavioral change.

### Modified file: `apps/frontend/src/features/org/api/roster-queries.ts`

1. Add a new query option:

    ```ts
    stats: (slug: string, eventId: string, type: RosterType) =>
      $api.queryOptions(
        "get",
        "/orgs/{slug}/events/{id}/rosters/stats",
        { params: { path: { slug, id: eventId }, query: { type } } },
      ),
    ```

2. Add `ROSTER_STATS_KEY_PREFIX` at the top of the file:

    ```ts
    const ROSTER_STATS_KEY_PREFIX = [
      "get",
      "/orgs/{slug}/events/{id}/rosters/stats",
    ] as const;
    ```

3. Add the new prefix to the `invalidateQueries` arrays on `useUpdateRoster` and `useDeleteRosters` so the stat strip refreshes whenever the roster changes. **Not** `useResendInvites` — resending invites doesn't flip pending → active (that only happens when the recipient registers), and the current `useResendInvites` declaration has no `meta.invalidateQueries` array at all, so adding one just for stats would be an inconsistency.

### Modified files: `dancers.tsx` and `coaches.tsx`

Identical structural changes in both files. The existing "no active event" early return at the top of each component is preserved unchanged — the new header and DataGrid only render in the active-event branch, so no guarding against `active` being undefined is needed below.

Using dancers as the example:

```tsx
const statsQuery = useQuery({
  ...rosterQueries.stats(orgSlug, active?.id ?? "", "dancer"),
  enabled: !!active,
});

const orgCount = filtersQuery.data?.organizations.length ?? 0;

const handleExport = useCallback(async () => {
  if (!active) return;
  try {
    await downloadRosterCsv(orgSlug, active.id, {
      type: "dancer",
      search: search || undefined,
      status: status === "all" ? undefined : status,
      org: org === "all" ? undefined : org,
    });
  } catch {
    toastManager.add({ title: "Export failed", type: "error" });
  }
}, [active, orgSlug, search, status, org]);

return (
  <div className="flex min-h-0 flex-1 flex-col">
    <RosterPageHeader
      title="Dancers"
      eventName={active.name}
      stats={{
        total: statsQuery.data?.total ?? 0,
        active: statsQuery.data?.active ?? 0,
        pending: statsQuery.data?.pending ?? 0,
        orgCount,
      }}
      isLoading={statsQuery.isLoading}
      status={status}
      onStatusChange={(next) => {
        setStatus(next);
        setPage(0);
      }}
    />
    <DataGrid
      storageKey="roster-dancers"
      columns={columns}
      data={data}
      pagination={{
        page,
        limit,
        total,
        onPageChange: setPage,
        onLimitChange: setLimit,
      }}
      search={search}
      onSearchChange={(v) => { setSearch(v); setPage(0); }}
      searchPlaceholder="Search by name, email, bib #..."
      filters={[
        // Status filter removed — RosterPageHeader owns it now.
        {
          id: "org",
          label: "Organization",
          value: org,
          onChange: (v) => { setOrg(v); setPage(0); },
          options: [
            { label: "All orgs", value: "all" },
            ...orgs.map((o) => ({ label: o, value: o })),
          ],
        },
      ]}
      sorting={sorting}
      onSortingChange={setSorting}
      onRowClick={handleRowClick}
      onCellEdit={handleCellEdit}
      bulkActions={bulkActions}
      onExport={handleExport}
      emptyMessage={listQuery.isLoading ? "Loading dancers…" : "No dancers found"}
      itemLabel="dancers"
    />
    <RosterDetailSheet
      entry={selectedEntry}
      orgSlug={orgSlug}
      eventId={active.id}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
    />
  </div>
);
```

Changes from the existing file:

- Add `statsQuery` after `filtersQuery`.
- Compute `orgCount` from `filtersQuery.data?.organizations.length`.
- Extract `handleExport` from the current `bulkActions.onExport` body, so it can be shared between the toolbar Export button and the bulk-action "Export selection".
- Wrap the return in a `<div className="flex min-h-0 flex-1 flex-col">` (to compose header + grid + sheet).
- Render `<RosterPageHeader>` before `<DataGrid>`.
- Remove the `title` / `subtitle` props from the `DataGrid` call.
- Remove the Status filter from the `filters` array.
- Add `storageKey="roster-dancers"` and `onExport={handleExport}` to `DataGrid`.

Coaches gets the same treatment with `type: "coach"`, `title: "Coaches"`, `storageKey: "roster-coaches"`, and its existing columns / search placeholder / label strings.

## Data Flow

1. On page mount, three queries fire in parallel: `rosterQueries.list`, `rosterQueries.filters`, and the new `rosterQueries.stats`.
2. The user clicks a stat cell. `onStatusChange` fires → `setStatus` → the `list` query re-runs with the new filter. The stats query is **not** refetched — stats are cross-status by design (clicking Pending must not change the Pending count).
3. The user edits or deletes a row. The mutation invalidates all three prefixes (`ROSTER_LIST_KEY_PREFIX`, `ROSTER_FILTERS_KEY_PREFIX`, `ROSTER_STATS_KEY_PREFIX`) and all three refetch.
4. The user toggles a column visibility in the Columns popover. State updates, `useEffect` writes JSON to `localStorage`. No network traffic.
5. The user changes density. Same pattern, different key.
6. The user clicks the toolbar Export button. `handleExport()` runs, calling the existing `downloadRosterCsv` helper with the current search / status / org filters.
7. The user applies an Org filter. The chip row appears below the toolbar. The user clicks the `×` on the chip → `filter.onChange("all")` → the filter clears, the chip row disappears, the list refetches. Stats unchanged.

## Error Handling

- **Stats query failure.** Fall back to zeros in the header cells. Do not block the page — the table is the primary surface, and the header degrades gracefully to "? / 0 activated" rather than throwing. Let the `useQuery` retry logic handle transient errors silently.
- **Columns / density `localStorage` parse failure.** Wrap the `JSON.parse` in a try/catch and fall back to defaults. Do not crash on a corrupted key (e.g., left over from a prior incompatible shape).
- **Export failure.** Existing toast pattern: `toastManager.add({ title: "Export failed", type: "error" })`. No change.
- **Backend endpoint 404 for a stale eventId.** Same as the existing list query: TanStack Query surfaces the error and the stat cells show zeros.

## Testing

### Backend

- New Japa spec file `apps/backend/app/modules/orgs/events/rosters/stats/service.spec.ts` with the four cases listed in the Backend Spec section. Run via `node ace test --files "app/modules/orgs/events/rosters/stats/service.spec.ts"`.

### Frontend

- New unit test `apps/frontend/src/features/org/components/roster-page-header.test.tsx`:
  - Renders the four stat cells with the provided numbers.
  - Clicking `Active` calls `onStatusChange("active")`.
  - Clicking `Total` calls `onStatusChange("all")`.
  - The active cell has `data-active` set to `true`.
  - Clicking the `Orgs` cell does not call `onStatusChange`.
- Extend `data-grid.test.tsx` (or create it if it does not exist):
  - Toggling a column off updates `localStorage` and hides the column.
  - Density toggle persists and changes the `data-density` attribute on the wrapper.
  - The filter chips row renders only when a non-default filter is active and clicking a chip's `×` clears the filter.
- No Playwright tests. User verifies visually in their own browser.

## Parallelization Plan

Work breaks into four independent chunks plus one sequential finalization. This is the dispatch plan for the subagent execution step:

1. **Backend stats endpoint.** New files under `rosters/stats/`, route registration, Japa test, then `pnpm make:docs`. Fully independent of frontend work. Owns: `apps/backend/app/modules/orgs/events/rosters/stats/**`, `apps/backend/app/modules/orgs/events/routes.ts`, regenerated `apps/backend/.adonisjs/api.ts` and `apps/backend/openapi.json`.
2. **`<RosterPageHeader>` component.** New file, no dependencies beyond shared UI primitives. Can be authored against the agreed stats shape without the backend. Owns: `apps/frontend/src/features/org/components/roster-page-header.tsx` and its test file.
3. **`DataGrid` refactor.** Columns popover, density, export prop, filter chips row, `storageKey` prop, localStorage. Independent of 1 and 2. Owns: `apps/frontend/src/features/org/components/data-grid.tsx`, its test file, and the one-word rename in `apps/frontend/src/features/org/components/roster-bulk-actions.tsx`.
4. **Roster queries + invalidation.** Edit `apps/frontend/src/features/org/api/roster-queries.ts` to add the new stats query and the invalidation prefix. Depends on the OpenAPI regen output from chunk 1 (needs the new endpoint in `types.d.ts`) — so it either runs after 1 or starts first against a temporary `any` and gets tightened up once types regenerate.
5. **Page wiring (sequential, depends on 1–4).** Update `dancers.tsx` and `coaches.tsx` to import the new header, call the new query hook, and pass the new `DataGrid` props. Runs last because it consumes outputs of every prior chunk. Runs in the foreground in the main session.

Dispatch pattern: spawn subagents for chunks 1, 2, and 3 in parallel. Chunk 4 starts in parallel with them using a temporary `any` type for the stats shape, and gets a follow-up tightening commit once chunk 1's types land. Chunk 5 runs in the foreground after the others are done and verified.

## Success Criteria

- Dancers and coaches pages render a header that visually matches `/admin`'s section-header / stat-cell language. The casual glance test: a screenshot of `/admin/dancers` and `/admin/` should feel like two pages from the same product.
- Clicking a stat cell filters the table. Clicking `Total` clears the status. The active cell visibly reads as "selected."
- Columns popover toggles column visibility and persists across reloads. `Name` is not hideable.
- Density toggle changes row heights immediately and persists across reloads.
- Toolbar Export button downloads the current filtered view as CSV. The floating bulk-actions button is now labeled `Export selection`.
- Active filter chips appear below the toolbar when any non-default filter is applied and can be dismissed individually by clicking `×`.
- Backend stats endpoint returns correct `{ total, active, pending }` counts, verified by the new Japa test.
- `pnpm types` cleanly picks up the new endpoint into `types.d.ts`.
- User opens both `/admin/dancers` and `/admin/coaches` in their own browser and agrees the pages now feel coherent with `/admin`.
