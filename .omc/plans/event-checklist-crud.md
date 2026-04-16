# Event Checklist CRUD

## Requirements Summary

Add an `event_checklist` table so org admins can track pre-event tasks (e.g. "Venue Confirmed": "Contract signed, space held") from the dashboard. Replace the current hardcoded `DEFAULT_CHECKLIST` array + local `useState` in the admin index with server-backed CRUD. Each checklist item belongs to an org event, has a title, description, and a `completed` boolean.

## Acceptance Criteria

- [ ] `event_checklist` table exists with columns: `id` (uuid PK), `event_id` (FK -> org_events.id, cascade delete), `title` (varchar 160, not null), `description` (text, nullable), `completed` (boolean, default false), `position` (integer, for ordering), `created_at`, `updated_at`
- [ ] Migration generated and runnable via `pnpm db:generate && pnpm db:migrate`
- [ ] Backend CRUD endpoints under `orgs/:slug/events/:id/checklist`:
  - `GET` — list all items for an event (ordered by position)
  - `POST` — create a new item
  - `PATCH /:itemId` — update title/description/completed/position
  - `DELETE /:itemId` — delete an item
- [ ] All endpoints gated behind `auth + org + orgMember + orgAdmin` middleware
- [ ] Frontend `adminQueries.checklist(slug, eventId)` query added
- [ ] Frontend dialog with react-hook-form for create/edit checklist items
- [ ] `PreEventChecklist` component fetches from server instead of using hardcoded array
- [ ] Toggle completion calls PATCH endpoint
- [ ] OpenAPI types regenerated after backend is wired up
- [ ] No tests required (simple CRUD, per user request)

## Implementation Steps

### Step 1: Database schema + migration

**File: `apps/backend/app/database/schema/org-events.ts`** (append after `csvUploads` table, ~line 107)

Add `eventChecklist` table:
```ts
export const eventChecklist = pg.pgTable(
  "event_checklist",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    title: pg.varchar({ length: 160 }).notNull(),
    description: pg.text(),
    completed: pg.boolean().notNull().default(false),
    position: pg.integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [pg.index().on(table.eventId)],
);
```

**File: `apps/backend/app/database/schema/index.ts`** — already re-exports `org-events.ts`, no changes needed.

Run: `cd apps/backend && pnpm db:generate && pnpm db:migrate`

### Step 2: Backend CRUD module

Create module at `apps/backend/app/modules/orgs/events/checklist/` with 4 operations:

#### 2a: List — `checklist/list/`

**`controller.ts`**
- Inject `ListChecklistService`
- `GET` handler, reads `ctx.params.id` (eventId) and `ctx.org!.id`
- Returns array of checklist items ordered by `position`

**`service.ts`**
- Inject `DatabaseService`
- Query: `db.select().from(eventChecklist).where(eq(eventChecklist.eventId, eventId)).orderBy(asc(eventChecklist.position), asc(eventChecklist.createdAt))`

#### 2b: Create — `checklist/create/`

**`validator.ts`**
```ts
vine.compile(vine.object({
  title: vine.string().trim().minLength(1).maxLength(160),
  description: vine.string().trim().optional(),
}))
```

**`controller.ts`** — validates input, calls service, returns `201`

**`service.ts`**
- Get max position for this event, insert with `position = max + 1`
- `db.insert(eventChecklist).values({ eventId, title, description, position }).returning()`

#### 2c: Update — `checklist/update/`

**`validator.ts`**
```ts
vine.compile(vine.object({
  title: vine.string().trim().minLength(1).maxLength(160).optional(),
  description: vine.string().trim().nullable().optional(),
  completed: vine.boolean().optional(),
  position: vine.number().min(0).optional(),
}))
```

**`controller.ts`** — validates, reads `ctx.params.itemId`, calls service

**`service.ts`**
- `db.update(eventChecklist).set({...input}).where(and(eq(id, itemId), eq(eventId, eventId))).returning()`

#### 2d: Delete — `checklist/delete/`

**`controller.ts`** — reads `ctx.params.itemId`, calls service, returns `204`

**`service.ts`**
- `db.delete(eventChecklist).where(and(eq(id, itemId), eq(eventId, eventId)))`

### Step 3: Routes

**File: `apps/backend/app/modules/orgs/events/routes.ts`** (~line 48, before `.prefix("orgs")`)

Add 4 routes:
```
router.get(":slug/events/:id/checklist", [ListChecklistController])
  .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
router.post(":slug/events/:id/checklist", [CreateChecklistController])
  .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
router.patch(":slug/events/:id/checklist/:itemId", [UpdateChecklistController])
  .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
router.delete(":slug/events/:id/checklist/:itemId", [DeleteChecklistController])
  .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
```

### Step 4: Generate OpenAPI types

Run from backend: `pnpm make:docs`
Run from frontend: `pnpm types` (regenerates `types.d.ts` from OpenAPI spec)

### Step 5: Frontend query + mutations

**File: `apps/frontend/src/features/org/api/admin-queries.ts`**

Add `ChecklistItem` type and `checklist` query:
```ts
export type ChecklistItem = {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

// in adminQueries object:
checklist: (slug: string, eventId: string) =>
  queryOptions({
    queryKey: ["orgs", slug, "events", eventId, "checklist"],
    queryFn: () => fetchJson<ChecklistItem[]>(`/orgs/${slug}/events/${eventId}/checklist`),
  }),
```

### Step 6: Frontend checklist dialog

**File: `apps/frontend/src/features/org/components/checklist-item-dialog.tsx`** (new)

- Zod schema: `{ title: z.string().min(1).max(160), description: z.string().optional() }`
- `useForm` with `zodResolver`, Controller-based fields (same pattern as `event-form-sheet.tsx`)
- Dialog (not Sheet) with title/description fields
- Props: `{ orgSlug, eventId, open, onOpenChange, item?: ChecklistItem }` (omit `item` for create)
- Create mutation: `POST /orgs/${slug}/events/${eventId}/checklist`
- Update mutation: `PATCH /orgs/${slug}/events/${eventId}/checklist/${item.id}`
- Invalidate `adminQueries.checklist(slug, eventId)` on success
- Toast on success/error

### Step 7: Rewire PreEventChecklist component

**File: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/index.tsx`**

- Remove `DEFAULT_CHECKLIST` constant and `ChecklistItem` type (~lines 264-277)
- Remove `useState` for `checked` in `PreEventChecklist`
- Add `useSuspenseQuery(adminQueries.checklist(orgSlug, activeEvent.id))`
- Toggle completion via `PATCH` mutation (flip `completed` boolean)
- Add "+" button in checklist header to open `ChecklistItemDialog` for creating
- Click on item label opens edit dialog
- Add delete action (small trash icon or within edit dialog)
- Keep urgency display logic and progress bar (use `items.filter(i => i.completed).length`)

## Risks and Mitigations

| Risk | Mitigation |
|------|-----------|
| Migration fails on existing data | Table is brand new with no existing rows — zero risk |
| `position` gaps after deletes | Acceptable — ordering still works; could add reorder endpoint later if needed |
| Race condition on position assignment | Low risk for single-admin use; `max(position) + 1` is sufficient |

## Verification Steps

1. Run `pnpm db:generate` — confirm a new migration SQL file appears in `apps/backend/app/database/drizzle/`
2. Run `pnpm db:migrate` — confirm table `event_checklist` exists
3. Start backend dev server, hit endpoints manually or via frontend
4. Open admin dashboard — checklist loads from server
5. Create item via dialog — appears in list
6. Toggle completion — persists on reload
7. Edit item — changes persist
8. Delete item — removed from list
