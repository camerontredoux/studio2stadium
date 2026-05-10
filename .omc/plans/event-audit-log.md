# Event Audit Log — Full Implementation Plan

**Created:** 2026-04-15
**Branch:** `plan/summit-04-coach-scouting`
**Scope:** Backend schema + service wrapper + API endpoints + frontend audit log page

---

## Requirements Summary

Transform the placeholder "Uploads" page into a full **Audit Log** page that tracks every admin mutation within the org event context. The page follows the existing command-center aesthetic (matching dashboard + roster pages), uses a full-page DataGrid table with a right sidebar for stats and event selection, and provides hybrid detail views (expand in-place for simple actions, sheet/drawer for complex ones).

### What Gets Tracked

Every admin-initiated mutation on event data:

| Action | Resource | Trigger Point |
|--------|----------|---------------|
| `upload` | `csv_upload` | `UploadDancersService`, `UploadCoachesService` |
| `create` | `roster` | Child entries from CSV upload (linked via `parentId`) |
| `update` | `roster` | `UpdateRosterController` — inline cell edits |
| `delete` | `roster` | `DeleteRosterController` — bulk deletes |
| `resend_invite` | `invite` | `ResendInvitesController` |
| `create` | `event` | `CreateEventController` |
| `update` | `event` | `UpdateEventController` |
| `activate` | `event` | `UpdateEventController` (isActive toggle) |
| `create` | `checklist` | `CreateChecklistController` |
| `update` | `checklist` | `UpdateChecklistController` |
| `delete` | `checklist` | `DeleteChecklistController` |

**Not tracked:** System events (invite consumed, premium grant expired, etc.), read-only operations (list, stats, filters, export).

---

## Acceptance Criteria

1. **Schema**: `event_audit_log` table exists with columns: `id`, `eventId`, `actorId`, `action`, `resource`, `resourceId`, `metadata` (JSONB with full before/after diff), `parentId` (self-ref), `createdAt`
2. **withAudit wrapper**: `DatabaseService` exposes `withAudit(ctx, fn)` that wraps a transaction and inserts audit log entries; services call it instead of `tx()` for audited operations
3. **All 11 mutation endpoints** listed above produce audit log entries on success
4. **CSV uploads** produce a parent audit entry + child entries per roster row created/updated
5. **Bulk deletes** produce a parent entry + child entries per deleted roster
6. **API: list endpoint** returns paginated, filterable, searchable audit log entries for a given event; supports filters: `action`, `resource`, `actorId`, `dateRange`; supports search by actor name; supports sorting by `createdAt`
7. **API: stats endpoint** returns activity summary (today/week/month counts), top actors, recent error count, upload health (success rate), action breakdown — all scoped to the selected event
8. **Frontend: navigation** — sidebar item renamed from "Uploads" to "Audit Log" with updated icon
9. **Frontend: page layout** — three-zone layout matching dashboard pattern: main content area (DataGrid table), right sidebar (event selector + stats panels), fixed footer (pagination)
10. **Frontend: DataGrid** — read-only table (no inline editing, no bulk selection, no bulk actions) with columns: Timestamp, Actor, Action, Resource, Summary; toolbar has search + filters (action type, resource type, date range)
11. **Frontend: hybrid detail** — clicking a simple entry (single roster edit, checklist toggle) expands the row in-place showing the diff; clicking a complex entry (CSV upload with children, bulk delete with children) opens a detail sheet
12. **Frontend: right sidebar** — independent event selector dropdown (does not affect global active event), stats panels matching the agreed list (activity summary, top actors, recent errors, upload health, action breakdown)
13. **Frontend: fixed table footer** — pagination controls pinned to bottom (matching existing DataGrid footer pattern at `data-grid.tsx:656-722`)
14. **Design: visual consistency** — uses same `bg-muted/40` toolbar, `border-border` dividers, `text-xs`/`2xl:text-sm` typography scale, density toggle, column visibility toggle as existing DataGrid

---

## Implementation Steps

### Phase 1: Backend Schema & Migration

**Step 1.1 — Create `event_audit_log` table definition**
- File: `apps/backend/app/database/schema/org-events.ts` (append after `eventChecklist` at line 124)
- New enum: `auditAction` — `'upload' | 'create' | 'update' | 'delete' | 'activate' | 'resend_invite'`
- New enum: `auditResource` — `'roster' | 'event' | 'checklist' | 'csv_upload' | 'invite'`
- Table columns:
  ```
  id          uuid PK defaultRandom
  eventId     uuid FK → orgEvents.id (cascade delete)
  actorId     uuid FK → users.id (restrict delete) NOT NULL
  action      auditAction NOT NULL
  resource    auditResource NOT NULL
  resourceId  uuid nullable
  metadata    jsonb nullable  -- { before?: Record, after?: Record, diff?: Record, error?: string, counts?: { added, updated, errored } }
  parentId    uuid nullable FK → self (cascade delete)
  createdAt   timestamp defaultNow NOT NULL
  ```
- Indexes: `(eventId, createdAt)`, `(parentId)`, `(actorId)`

**Step 1.2 — Add relations**
- File: `apps/backend/app/database/schema/relations.ts`
- Add `eventAuditLog` relations: `eventId → orgEvents`, `actorId → users`, `parentId → self`

**Step 1.3 — Generate and run migration**
- Run `pnpm db:generate` then `pnpm db:migrate`

### Phase 2: Backend `withAudit` Wrapper

**Step 2.1 — Create audit service**
- File: `apps/backend/app/database/audit.ts` (new file)
- Export `AuditContext` type:
  ```typescript
  interface AuditContext {
    eventId: string
    actorId: string
  }
  ```
- Export `AuditEntry` type:
  ```typescript
  interface AuditEntry {
    action: AuditAction
    resource: AuditResource
    resourceId?: string
    metadata?: Record<string, unknown>
    parentId?: string
  }
  ```
- Export `AuditCollector` class — accumulates entries during a transaction:
  ```typescript
  class AuditCollector {
    private entries: AuditEntry[] = []
    log(entry: AuditEntry): void
    flush(tx: Transaction, ctx: AuditContext): Promise<void>  // bulk inserts all entries
  }
  ```

**Step 2.2 — Add `withAudit` to DatabaseService**
- File: `apps/backend/app/database/service.ts` (modify existing, after `tx()` at line 18)
- New method:
  ```typescript
  async withAudit<T>(
    ctx: AuditContext,
    fn: (tx: Transaction, audit: AuditCollector) => Promise<T>
  ): Promise<T> {
    return await db.transaction(async (tx) => {
      const audit = new AuditCollector()
      const result = await fn(tx, audit)
      await audit.flush(tx, ctx)
      return result
    }).catch((error) => { throw this.handleError(error) })
  }
  ```

### Phase 3: Instrument Existing Services

**Step 3.1 — CSV Upload Services** (`upload-dancers/service.ts`, `upload-coaches/service.ts`)
- Change `this.db.tx(...)` → `this.db.withAudit({ eventId, actorId: uploadedBy }, ...)`
- Log parent entry: `audit.log({ action: 'upload', resource: 'csv_upload', resourceId: upload.id, metadata: { type, rowsAdded, rowsUpdated, rowsErrored, errorDetails } })`
- Log child entries per roster row: `audit.log({ action: 'create' | 'update', resource: 'roster', resourceId: roster.id, parentId: upload.id, metadata: { after: rosterData } })`

**Step 3.2 — Roster Update** (`rosters/update/service.ts` or controller)
- Wrap in `withAudit`
- Read current row before update (for diff)
- Log: `{ action: 'update', resource: 'roster', resourceId, metadata: { before, after, diff } }`

**Step 3.3 — Roster Delete** (`rosters/delete/service.ts` or controller)
- Wrap in `withAudit`
- Read rows before delete (for diff)
- Log parent: `{ action: 'delete', resource: 'roster', metadata: { count: ids.length } }`
- Log children: one entry per deleted roster with `{ before: deletedRow }`

**Step 3.4 — Resend Invites** (`rosters/resend-invites/service.ts`)
- Wrap in `withAudit`
- Log: `{ action: 'resend_invite', resource: 'invite', metadata: { ids, sent, skipped, failed } }`

**Step 3.5 — Event Create/Update** (`create/service.ts`, `update/service.ts`)
- Wrap in `withAudit`
- For create: `{ action: 'create', resource: 'event', resourceId, metadata: { after: eventData } }`
- For update: read before, `{ action: 'update', resource: 'event', resourceId, metadata: { before, after, diff } }`
- Special case: if `isActive` changed, log additional `{ action: 'activate', resource: 'event' }`

**Step 3.6 — Checklist CRUD** (`checklist/create|update|delete`)
- Wrap in `withAudit`
- Create: `{ action: 'create', resource: 'checklist', resourceId, metadata: { after } }`
- Update: `{ action: 'update', resource: 'checklist', resourceId, metadata: { before, after, diff } }`
- Delete: `{ action: 'delete', resource: 'checklist', resourceId, metadata: { before } }`

### Phase 4: Backend API Endpoints

**Step 4.1 — List audit log endpoint**
- Route: `GET /orgs/:slug/events/:id/audit-log`
- Controller: `apps/backend/app/modules/orgs/events/audit-log/list/controller.ts`
- Query params: `page`, `limit`, `search` (actor name), `action` (enum filter), `resource` (enum filter), `from` (date), `to` (date), `sortDir` (asc/desc, default desc)
- Response: `{ data: AuditLogEntry[], total: number }`
- Each entry includes: `id`, `action`, `resource`, `resourceId`, `metadata`, `parentId`, `createdAt`, `actor: { id, firstName, lastName, email, avatarUrl }`, `childCount` (count of children), `csvUpload` (joined if resource=csv_upload)
- Children are NOT returned inline — fetched separately on expand

**Step 4.2 — Get audit log children endpoint**
- Route: `GET /orgs/:slug/events/:id/audit-log/:entryId/children`
- Returns all child entries for a parent (for expanded/sheet view)

**Step 4.3 — Audit log stats endpoint**
- Route: `GET /orgs/:slug/events/:id/audit-log/stats`
- Response:
  ```typescript
  {
    activity: { today: number, thisWeek: number, thisMonth: number }
    topActors: { id: string, name: string, avatarUrl: string, count: number }[]  // top 5
    recentErrors: number  // errored actions in last 7 days
    uploadHealth: { total: number, successRate: number, totalRows: number, erroredRows: number }
    actionBreakdown: { action: string, count: number }[]
  }
  ```

**Step 4.4 — Register routes**
- File: `apps/backend/app/modules/orgs/events/routes.ts` (append after checklist routes at line 58)
- All three endpoints use the same middleware chain as other event routes

**Step 4.5 — Regenerate OpenAPI types**
- Run `pnpm make:docs` in backend
- Run `pnpm types` in frontend to pull new types

### Phase 5: Frontend — API Layer

**Step 5.1 — Create audit log queries**
- File: `apps/frontend/src/features/org/api/audit-queries.ts` (new file)
- Export `auditQueries` object with:
  - `list(orgSlug, eventId, params)` — paginated list with filters
  - `children(orgSlug, eventId, entryId)` — children for expanded view
  - `stats(orgSlug, eventId)` — sidebar stats
- Follow same pattern as `rosterQueries` using `$api.queryOptions()`

### Phase 6: Frontend — Audit Log Page

**Step 6.1 — Update sidebar navigation**
- File: `apps/frontend/src/features/org/components/admin-sidebar.tsx`
- Change "Uploads" label → "Audit Log"
- Change icon from current to `ScrollTextIcon` or `ClipboardListIcon`
- Keep route path as `/admin/uploads` OR rename to `/admin/audit-log` (rename the route file accordingly)

**Step 6.2 — Replace uploads page with audit log page**
- File: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/uploads.tsx` (full rewrite)
- Three-zone layout (matching dashboard `index.tsx:91` pattern):
  ```
  ┌─────────────────────────────────┬──────────────┐
  │  Toolbar (search + filters)     │              │
  ├─────────────────────────────────┤  Right       │
  │                                 │  Sidebar     │
  │  DataGrid Table                 │  - Event     │
  │  (scrollable, read-only)        │    Selector  │
  │                                 │  - Stats     │
  │                                 │    Panels    │
  ├─────────────────────────────────┤              │
  │  Fixed Footer (pagination)      │              │
  └─────────────────────────────────┴──────────────┘
  ```
- On `xl+`: side-by-side with sidebar at ~280px width
- Below `xl`: sidebar collapses above table (or behind a toggle)

**Step 6.3 — Table columns**
- `createdAt` — relative time ("2m ago"), tooltip shows absolute datetime
- `actor` — avatar + name
- `action` — colored badge: upload=blue, create=green, update=amber, delete=red, activate=purple, resend_invite=cyan
- `resource` — text label with icon: roster/event/checklist/csv_upload/invite
- `summary` — auto-generated from metadata: "Updated bib number 12→15", "Uploaded 45 dancers (3 errors)", "Deleted 8 roster entries", "Toggled checklist: Venue confirmed"

**Step 6.4 — Toolbar filters**
- Search input (actor name) — same style as DataGrid search
- Action type select — multi-value or single-select with "All actions" default
- Resource type select — "All resources" default
- Date range picker — from/to date inputs
- Column visibility toggle + density toggle (reuse from DataGrid)

**Step 6.5 — Hybrid detail view**

*Simple entries* (no children, not a csv_upload reference):
- Use TanStack Table `getExpandedRowModel()` with `row.getCanExpand()` / `row.toggleExpanded()`
- Expanded row renders a diff view: before/after side-by-side or inline diff
- Styling: `bg-muted/20` expanded area, monospace for changed values

*Complex entries* (has `childCount > 0` or `resource === 'csv_upload'`):
- Click opens a `Sheet` from the right side
- Sheet header: action badge, actor, timestamp
- Sheet body: summary stats at top, then scrollable table of child entries
- For CSV uploads: pull in `csvUpload` data (fileUrl, rowsAdded/Updated/Errored, errorDetails table)

**Step 6.6 — Right sidebar**
- **Event selector**: dropdown of all org events (matching dashboard's `EventSidebar` pattern at `index.tsx:147`), defaults to active event, independent of global context
- **Activity summary card**: today / this week / this month counts in a 3-column mini grid
- **Top actors panel**: ranked list with avatar, name, action count (top 5)
- **Recent errors**: count with red accent if > 0
- **Upload health**: success rate percentage with progress bar
- **Action breakdown**: horizontal stacked bar or mini bar chart showing action distribution

**Step 6.7 — Fixed footer**
- Reuse the same fixed-footer pattern from DataGrid (`data-grid.tsx:656-722`)
- Shows: `{start}–{end} of {total} entries`, rows per page selector, page navigation
- Accounts for sidebar width (same `style.left` calculation)

### Phase 7: Design Critique Checklist

Evaluate the implementation against these criteria before marking complete:

- [ ] **Visual hierarchy**: action badges use consistent color coding and are scannable at a glance; timestamp and actor columns don't compete for attention
- [ ] **Information density**: comfortable density shows enough rows without feeling sparse; compact density is usable for power users scanning large logs
- [ ] **Consistency with roster pages**: toolbar height, search input size, filter select styling, footer positioning all match `data-grid.tsx` exactly
- [ ] **Consistency with dashboard**: right sidebar width, section spacing, card styling match `index.tsx` EventSidebar
- [ ] **Empty states**: no events → "No events yet" with CTA; no audit entries → "No activity recorded" with icon; stats show zeros gracefully (not "NaN%" or broken bars)
- [ ] **Loading states**: skeleton loaders for table rows and sidebar stats while data loads
- [ ] **Responsive behavior**: below `xl` the sidebar stacks above the table or collapses; below `sm` the date range filter moves into the filter popover; action/resource columns stay visible
- [ ] **Color palette**: action badges use semantic colors from the existing theme (`text-success-foreground` for create, `text-destructive` for delete) — no custom hex colors
- [ ] **Typography**: follows the existing `text-xs 2xl:text-sm` scale; no font size outliers
- [ ] **Expanded row transitions**: smooth expand/collapse animation; no layout shift in surrounding rows
- [ ] **Sheet detail view**: consistent with `RosterDetailSheet` pattern; proper scroll containment; close button visible
- [ ] **Diff rendering**: before/after values clearly distinguished; unchanged fields not shown (noise reduction)
- [ ] **Accessibility**: all interactive elements keyboard-navigable; color badges have text labels (not color-only); proper `aria-label` on icon-only buttons
- [ ] **No feature creep**: no export button (read-only log), no bulk actions, no inline editing — the table is purely observational

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `withAudit` adds latency to every write | Medium | Audit entries are bulk-inserted in a single INSERT at end of transaction, not per-row |
| Large CSV uploads create many child audit entries | Medium | Children are lazy-loaded via separate endpoint, not included in list response; `childCount` is a computed count |
| Diff metadata grows large for bulk operations | Low | JSONB storage is efficient; individual diffs are small; storage is not a concern per requirements |
| Instrumenting 11 endpoints is error-prone | Medium | Implement `withAudit` wrapper first, then instrument one endpoint at a time with a test for each |
| Frontend DataGrid needs modification for read-only + expandable rows | Medium | Create a new `AuditGrid` component that composes from DataGrid patterns but is purpose-built (no selection, no editing, adds expansion) rather than adding more props to DataGrid |

---

## Verification Steps

1. **Schema**: Run `pnpm db:migrate` — migration applies without errors
2. **withAudit wrapper**: Write a unit test that calls `db.withAudit(ctx, fn)` and verifies entries appear in `event_audit_log`
3. **Each instrumented endpoint**: Make a mutation via API, then query `event_audit_log` and verify the entry exists with correct `action`, `resource`, `metadata`
4. **CSV upload audit**: Upload a CSV with 5 valid rows and 2 errors → verify 1 parent + 5 child entries + parent metadata contains error details
5. **Bulk delete audit**: Delete 3 roster entries → verify 1 parent + 3 child entries with `before` snapshots
6. **List endpoint**: Query with filters (action=upload, dateRange=today) → verify filtered results
7. **Stats endpoint**: Verify counts match actual audit log entries for the event
8. **Frontend**: Navigate to audit log page → table loads with entries, sidebar shows stats, filters work, clicking simple row expands in-place, clicking upload row opens detail sheet
9. **Visual QA**: Compare toolbar, footer, sidebar styling against dashboard and roster pages — no visual drift
10. **Responsive**: Resize to mobile → sidebar collapses, table remains usable, filters move to popover

---

## Staged Execution Order

```
Phase 1 (Schema)          → can be done independently
Phase 2 (withAudit)       → depends on Phase 1
Phase 3 (Instrument)      → depends on Phase 2; each step (3.1–3.6) is independent
Phase 4 (API endpoints)   → depends on Phase 1; can parallel with Phase 3
Phase 5 (Frontend API)    → depends on Phase 4
Phase 6 (Frontend page)   → depends on Phase 5; steps 6.1–6.7 are mostly sequential
Phase 7 (Design critique) → depends on Phase 6
```

Recommended parallelization:
- **Wave 1**: Phase 1
- **Wave 2**: Phase 2 + Phase 4.1–4.4 (API can use raw inserts for testing while wrapper is built)
- **Wave 3**: Phase 3 (all sub-steps in parallel) + Phase 4.5 (type gen)
- **Wave 4**: Phase 5 + 6 (frontend, sequential)
- **Wave 5**: Phase 7 (critique)
