# Callbacks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let coaches mark dancers for callback during a live Summit event, and give admins a real-time deduplicated bib list via SSE.

**Architecture:** New `eventCallbacks` table mirrors `eventFavorites`. Coach endpoints (create/delete/list) follow the exact favorites pattern. Admin endpoint aggregates across coaches. `@adonisjs/transmit` broadcasts on mutations; admin page subscribes via SSE and invalidates TanStack Query. Coach-side uses optimistic updates only.

**Tech Stack:** AdonisJS 6, Drizzle ORM, VineJS, React 19, TanStack Router + Query, `@adonisjs/transmit` for SSE.

**Spec:** `docs/superpowers/specs/2026-05-09-callbacks-design.md`

---

## File Map

**Backend create:**
- `apps/backend/app/modules/orgs/scouting/callbacks/create/validator.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/create/service.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/create/controller.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/delete/service.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/delete/controller.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/list/service.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/list/controller.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/admin-board/service.ts`
- `apps/backend/app/modules/orgs/scouting/callbacks/admin-board/controller.ts`
- `apps/backend/config/transmit.ts`

**Backend modify:**
- `apps/backend/app/database/schema/event-features.ts` — add `eventCallbacks` table
- `apps/backend/app/modules/orgs/scouting/dancers/list/service.ts` — add `isCalledBack` subquery
- `apps/backend/app/modules/orgs/scouting/routes.ts` — register callback routes
- `apps/backend/adonisrc.ts` — register transmit provider
- `apps/backend/start/transmit.ts` — channel authorization

**Frontend create:**
- `apps/frontend/src/features/org/components/callback-button.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`
- `apps/frontend/src/features/org/hooks/use-transmit.ts`

**Frontend modify:**
- `apps/frontend/src/features/org/api/scouting-queries.ts` — add callback queries
- `apps/frontend/src/features/org/components/dancer-table/columns.tsx` — add `isCalledBack` to `SearchDancerRow`, add callback toggle column
- `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts` — wire callback column
- `apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx` — add callback toggle
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx` — add callback state, mutations, filter, count indicator
- `apps/frontend/src/features/org/components/dancer-sheet.tsx` — add callback button
- `apps/frontend/src/features/org/components/admin-sidebar.tsx` — add Callbacks nav item

---

## Task 1: Schema + Migration

**Files:**
- Modify: `apps/backend/app/database/schema/event-features.ts`

- [ ] **Step 1: Add `eventCallbacks` table to schema**

Add the following to the end of `apps/backend/app/database/schema/event-features.ts`, after the `eventSchoolSelections` definition:

```typescript
export const eventCallbacks = pg.pgTable(
  "event_callbacks",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.eventId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);
```

The table is already barrel-exported because `apps/backend/app/database/schema/index.ts` has `export * from "./event-features.ts";`.

- [ ] **Step 2: Generate migration**

Run:
```bash
cd apps/backend && pnpm db:generate
```

Expected: A new migration file is created in `apps/backend/app/database/drizzle/` with a `CREATE TABLE "event_callbacks"` statement.

- [ ] **Step 3: Apply migration**

Run:
```bash
cd apps/backend && pnpm db:migrate
```

Expected: Migration applied successfully.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/app/database/schema/event-features.ts apps/backend/app/database/drizzle/
git commit -m "feat: add eventCallbacks schema and migration"
```

---

## Task 2: Create Callback — Backend

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/create/validator.ts`
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/create/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/create/controller.ts`

- [ ] **Step 1: Create validator**

Create `apps/backend/app/modules/orgs/scouting/callbacks/create/validator.ts`:

```typescript
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    dancerRosterId: vine.string().uuid(),
  })
);

export type Validator = Infer<typeof schema>;
```

- [ ] **Step 2: Create service**

Create `apps/backend/app/modules/orgs/scouting/callbacks/create/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class CreateCallbackService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    const [row] = await this.db.use((db) =>
      db
        .insert(eventCallbacks)
        .values({ eventId, coachRosterId, dancerRosterId })
        .onConflictDoNothing()
        .returning()
    );

    if (row) return row;

    const [existing] = await this.db.use((db) =>
      db
        .select()
        .from(eventCallbacks)
        .where(
          and(
            eq(eventCallbacks.eventId, eventId),
            eq(eventCallbacks.coachRosterId, coachRosterId),
            eq(eventCallbacks.dancerRosterId, dancerRosterId)
          )
        )
        .limit(1)
    );
    return existing;
  }
}
```

- [ ] **Step 3: Create controller**

Create `apps/backend/app/modules/orgs/scouting/callbacks/create/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { CreateCallbackService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateCallbackController {
  @inject()
  async handle(ctx: HttpContext, service: CreateCallbackService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const payload = await ctx.request.validateUsing(schema);
    const row = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      payload.dancerRosterId
    );
    return ctx.response.created(row);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/callbacks/create/
git commit -m "feat: add create callback service, controller, validator"
```

---

## Task 3: Delete Callback — Backend

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/delete/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/delete/controller.ts`

- [ ] **Step 1: Create service**

Create `apps/backend/app/modules/orgs/scouting/callbacks/delete/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteCallbackService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    coachRosterId: string,
    dancerRosterId: string
  ) {
    await this.db.use((db) =>
      db
        .delete(eventCallbacks)
        .where(
          and(
            eq(eventCallbacks.eventId, eventId),
            eq(eventCallbacks.coachRosterId, coachRosterId),
            eq(eventCallbacks.dancerRosterId, dancerRosterId)
          )
        )
    );
  }
}
```

- [ ] **Step 2: Create controller**

Create `apps/backend/app/modules/orgs/scouting/callbacks/delete/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DeleteCallbackService } from "./service.ts";

export default class DeleteCallbackController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteCallbackService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const dancerRosterId = ctx.params.dancerRosterId as string;
    await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id, dancerRosterId);
    return ctx.response.noContent();
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/callbacks/delete/
git commit -m "feat: add delete callback service and controller"
```

---

## Task 4: List Coach Callbacks — Backend

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/list/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/list/controller.ts`

- [ ] **Step 1: Create service**

Create `apps/backend/app/modules/orgs/scouting/callbacks/list/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { dancerProfiles } from "#database/schema/dancers";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class ListCallbacksService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, coachRosterId: string) {
    return this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gradYear: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear})`,
          studio: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
          state: eventDancerProfiles.state,
          gpa: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa})`,
        })
        .from(eventCallbacks)
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, eventCallbacks.dancerRosterId)
        )
        .leftJoin(
          eventDancerProfiles,
          eq(eventDancerProfiles.rosterId, eventRosters.id)
        )
        .leftJoin(
          dancerProfiles,
          eq(dancerProfiles.userId, eventRosters.userId)
        )
        .where(
          and(
            eq(eventCallbacks.eventId, eventId),
            eq(eventCallbacks.coachRosterId, coachRosterId)
          )
        )
        .orderBy(eventCallbacks.createdAt)
    );
  }
}
```

- [ ] **Step 2: Create controller**

Create `apps/backend/app/modules/orgs/scouting/callbacks/list/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListCallbacksService } from "./service.ts";

export default class ListCallbacksController {
  @inject()
  async handle(ctx: HttpContext, service: ListCallbacksService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const rows = await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id);
    return ctx.response.ok(rows);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/callbacks/list/
git commit -m "feat: add list coach callbacks service and controller"
```

---

## Task 5: Admin Callback Board — Backend

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/admin-board/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/callbacks/admin-board/controller.ts`

- [ ] **Step 1: Create service**

Create `apps/backend/app/modules/orgs/scouting/callbacks/admin-board/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { asc, count, countDistinct, eq, sql } from "drizzle-orm";

@inject()
export class AdminCallbackBoardService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    const [bibs, stats] = await Promise.all([
      this.db.use((db) =>
        db
          .select({
            dancerRosterId: eventCallbacks.dancerRosterId,
            bibNumber: eventRosters.bibNumber,
            firstName: eventRosters.firstName,
            lastName: eventRosters.lastName,
            coachCount: count(eventCallbacks.id).as("coachCount"),
          })
          .from(eventCallbacks)
          .innerJoin(
            eventRosters,
            eq(eventRosters.id, eventCallbacks.dancerRosterId)
          )
          .where(eq(eventCallbacks.eventId, eventId))
          .groupBy(
            eventCallbacks.dancerRosterId,
            eventRosters.bibNumber,
            eventRosters.firstName,
            eventRosters.lastName
          )
          .orderBy(asc(eventRosters.bibNumber))
      ),
      this.db.use((db) =>
        db
          .select({
            totalSchools: countDistinct(
              sql`CASE WHEN ${eventRosters.type} = 'coach' THEN ${eventRosters.id} END`
            ).as("totalSchools"),
            totalDancers: countDistinct(
              sql`CASE WHEN ${eventRosters.type} = 'dancer' THEN ${eventRosters.id} END`
            ).as("totalDancers"),
          })
          .from(eventRosters)
          .where(eq(eventRosters.eventId, eventId))
      ),
    ]);

    return {
      bibs,
      totalSchools: Number(stats[0]?.totalSchools ?? 0),
      totalDancers: Number(stats[0]?.totalDancers ?? 0),
      uniqueCallbacks: bibs.length,
    };
  }
}
```

- [ ] **Step 2: Create controller**

Create `apps/backend/app/modules/orgs/scouting/callbacks/admin-board/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { AdminCallbackBoardService } from "./service.ts";

export default class AdminCallbackBoardController {
  @inject()
  async handle(ctx: HttpContext, service: AdminCallbackBoardService) {
    const data = await service.execute(ctx.orgEvent!.id);
    return ctx.response.ok(data);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/callbacks/admin-board/
git commit -m "feat: add admin callback board endpoint with deduped bibs and stats"
```

---

## Task 6: Add `isCalledBack` to Dancer List

**Files:**
- Modify: `apps/backend/app/modules/orgs/scouting/dancers/list/service.ts`

- [ ] **Step 1: Import `eventCallbacks`**

In `apps/backend/app/modules/orgs/scouting/dancers/list/service.ts`, update the import from `event-features`:

```typescript
// Before:
import { eventFavorites, eventRatings, eventNotes } from "#database/schema/event-features";

// After:
import { eventFavorites, eventRatings, eventNotes, eventCallbacks } from "#database/schema/event-features";
```

- [ ] **Step 2: Add `isCalledBack` subquery**

In the `execute` method, add this subquery block after the `hasNoteSubquery` definition (after the `sql<boolean>\`false\`` fallback for `hasNoteSubquery`):

```typescript
      const isCalledBackSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM ${eventCallbacks}
            WHERE ${eventCallbacks.dancerRosterId} = ${eventRosters.id}
              AND ${eventCallbacks.coachRosterId} = ${coachRosterId}
              AND ${eventCallbacks.eventId} = ${eventId}
          )`
        : sql<boolean>`false`;
```

- [ ] **Step 3: Add `isCalledBack` to the select object**

In the `.select({...})` call, add `isCalledBack` after the `hasNote` field:

```typescript
          hasNote: hasNoteSubquery,
          isCalledBack: isCalledBackSubquery,
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/dancers/list/service.ts
git commit -m "feat: add isCalledBack subquery to dancer list endpoint"
```

---

## Task 7: Register Callback Routes

**Files:**
- Modify: `apps/backend/app/modules/orgs/scouting/routes.ts`

- [ ] **Step 1: Add lazy imports for callback controllers**

In `apps/backend/app/modules/orgs/scouting/routes.ts`, add these imports after the existing lazy imports (after the `DeleteSelection` import):

```typescript
const ListCallbacks = () => import("./callbacks/list/controller.ts");
const CreateCallback = () => import("./callbacks/create/controller.ts");
const DeleteCallback = () => import("./callbacks/delete/controller.ts");
const AdminCallbackBoard = () => import("./callbacks/admin-board/controller.ts");
```

- [ ] **Step 2: Add coach callback routes**

Add a new route group at the end of the file, after the school selections group. This group uses `middleware.orgFeature("callbacks")` to gate the feature:

```typescript
router
  .group(() => {
    router.get(":slug/callbacks", [ListCallbacks]);
    router.post(":slug/callbacks", [CreateCallback]);
    router.delete(":slug/callbacks/:dancerRosterId", [DeleteCallback]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgCoach(),
    middleware.orgFeature("callbacks"),
  ])
  .openapi({ tags: ["Org Callbacks"] });
```

- [ ] **Step 3: Add admin callback board route**

Add another route group right after:

```typescript
router
  .group(() => {
    router.get(":slug/admin/callbacks", [AdminCallbackBoard]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgAdmin(),
    middleware.orgFeature("callbacks"),
  ])
  .openapi({ tags: ["Org Admin Callbacks"] });
```

- [ ] **Step 4: Verify backend compiles**

Run:
```bash
cd apps/backend && pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/routes.ts
git commit -m "feat: register callback CRUD and admin board routes"
```

---

## Task 8: Transmit Setup

**Files:**
- Create: `apps/backend/config/transmit.ts`
- Create: `apps/backend/start/transmit.ts`
- Modify: `apps/backend/adonisrc.ts`
- Modify: `apps/backend/app/modules/orgs/scouting/callbacks/create/controller.ts`
- Modify: `apps/backend/app/modules/orgs/scouting/callbacks/delete/controller.ts`

- [ ] **Step 1: Install transmit**

Run:
```bash
cd apps/backend && pnpm add @adonisjs/transmit
```

- [ ] **Step 2: Configure transmit**

Run:
```bash
cd apps/backend && node ace configure @adonisjs/transmit
```

This registers the provider in `adonisrc.ts` and creates `config/transmit.ts`. If it doesn't auto-create the config, create `apps/backend/config/transmit.ts`:

```typescript
import { defineConfig } from "@adonisjs/transmit";

export default defineConfig({});
```

And add to the `providers` array in `adonisrc.ts`:
```typescript
() => import("@adonisjs/transmit/transmit_provider"),
```

- [ ] **Step 3: Create channel authorization**

Create `apps/backend/start/transmit.ts`:

```typescript
import transmit from "@adonisjs/transmit/services/main";

transmit.authorize<{ slug: string }>(
  "orgs/:slug/callbacks",
  async (ctx, { slug }) => {
    if (!ctx.auth.user) return false;
    const org = ctx.org;
    if (!org || org.slug !== slug) return false;
    const membership = ctx.orgMembership;
    return membership?.role === "admin";
  }
);
```

- [ ] **Step 4: Add broadcast to create controller**

In `apps/backend/app/modules/orgs/scouting/callbacks/create/controller.ts`, add the broadcast after the service call. Update the file to:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import transmit from "@adonisjs/transmit/services/main";
import { CreateCallbackService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateCallbackController {
  @inject()
  async handle(ctx: HttpContext, service: CreateCallbackService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const payload = await ctx.request.validateUsing(schema);
    const row = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      payload.dancerRosterId
    );

    transmit.broadcast(`orgs/${ctx.org!.slug}/callbacks`, {});

    return ctx.response.created(row);
  }
}
```

- [ ] **Step 5: Add broadcast to delete controller**

In `apps/backend/app/modules/orgs/scouting/callbacks/delete/controller.ts`, add the broadcast. Update the file to:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import transmit from "@adonisjs/transmit/services/main";
import { DeleteCallbackService } from "./service.ts";

export default class DeleteCallbackController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteCallbackService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event as a coach to scout.",
      });
    }

    const dancerRosterId = ctx.params.dancerRosterId as string;
    await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id, dancerRosterId);

    transmit.broadcast(`orgs/${ctx.org!.slug}/callbacks`, {});

    return ctx.response.noContent();
  }
}
```

- [ ] **Step 6: Verify backend compiles**

Run:
```bash
cd apps/backend && pnpm build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/config/transmit.ts apps/backend/start/transmit.ts apps/backend/adonisrc.ts apps/backend/app/modules/orgs/scouting/callbacks/create/controller.ts apps/backend/app/modules/orgs/scouting/callbacks/delete/controller.ts
git commit -m "feat: set up @adonisjs/transmit and broadcast on callback mutations"
```

---

## Task 9: Regenerate Frontend Types + Add Queries

**Files:**
- Modify: `apps/frontend/src/features/org/api/scouting-queries.ts`

- [ ] **Step 1: Regenerate API types from OpenAPI spec**

Start the backend dev server if not running, then regenerate types:

```bash
cd apps/frontend && pnpm types
```

Expected: `apps/frontend/src/lib/api/types.d.ts` is updated with the new callback endpoints.

- [ ] **Step 2: Add callback queries**

In `apps/frontend/src/features/org/api/scouting-queries.ts`, add two new entries to the `scoutingQueries` object, after the `mySelections` entry:

```typescript
  callbacks: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/callbacks", {
      params: { path: { slug } },
    }),
  adminCallbacks: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/admin/callbacks", {
      params: { path: { slug } },
    }),
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/lib/api/types.d.ts apps/frontend/src/features/org/api/scouting-queries.ts
git commit -m "feat: regenerate API types and add callback queries"
```

---

## Task 10: Callback Button Component

**Files:**
- Create: `apps/frontend/src/features/org/components/callback-button.tsx`

- [ ] **Step 1: Create component**

Create `apps/frontend/src/features/org/components/callback-button.tsx`:

```tsx
import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { Megaphone } from "lucide-react";
import { useOrg } from "@/features/org/context/use-org";
import type { MouseEvent } from "react";

export function CallbackButton({
  dancerRosterId,
  isCalledBack,
  onToggle,
}: {
  dancerRosterId: string;
  isCalledBack: boolean;
  onToggle?: (rosterId: string, current: boolean) => void;
}) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const dancerKey = scoutingQueries.dancer(org.slug, dancerRosterId).queryKey;
  const callbacksKey = scoutingQueries.callbacks(org.slug).queryKey;
  const dancersPrefix = ["get", "/orgs/{slug}/dancers"] as const;

  function setCalledBackInList(value: boolean) {
    qc.setQueriesData({ queryKey: [...dancersPrefix] }, (old: any) =>
      Array.isArray(old)
        ? old.map((d: any) =>
            d.rosterId === dancerRosterId ? { ...d, isCalledBack: value } : d,
          )
        : old,
    );
  }

  const add = $api.useMutation("post", "/orgs/{slug}/callbacks", {
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: dancerKey });
      await qc.cancelQueries({ queryKey: [...dancersPrefix] });
      await qc.cancelQueries({ queryKey: callbacksKey });
      const previousDancer = qc.getQueryData(dancerKey);
      qc.setQueryData(dancerKey, (old: any) => {
        if (!old) return old;
        return { ...old, isCalledBack: true };
      });
      setCalledBackInList(true);
      return { previousDancer };
    },
    onError: (_err, _variables, context: any) => {
      if (context?.previousDancer) {
        qc.setQueryData(dancerKey, context.previousDancer);
      }
      setCalledBackInList(false);
    },
    meta: {
      invalidateQueries: [
        callbacksKey,
        scoutingQueries.dancers(org.slug).queryKey,
      ],
    },
  });

  const remove = $api.useMutation(
    "delete",
    "/orgs/{slug}/callbacks/{dancerRosterId}",
    {
      onMutate: async () => {
        await qc.cancelQueries({ queryKey: dancerKey });
        await qc.cancelQueries({ queryKey: [...dancersPrefix] });
        await qc.cancelQueries({ queryKey: callbacksKey });
        const previousDancer = qc.getQueryData(dancerKey);
        qc.setQueryData(dancerKey, (old: any) => {
          if (!old) return old;
          return { ...old, isCalledBack: false };
        });
        setCalledBackInList(false);
        return { previousDancer };
      },
      onError: (_err, _variables, context: any) => {
        if (context?.previousDancer) {
          qc.setQueryData(dancerKey, context.previousDancer);
        }
        setCalledBackInList(true);
      },
      meta: {
        invalidateQueries: [
          callbacksKey,
          scoutingQueries.dancers(org.slug).queryKey,
        ],
      },
    },
  );

  const toggle = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.vibrate?.(10);
    onToggle?.(dancerRosterId, isCalledBack);
    if (isCalledBack) {
      remove.mutate({
        params: { path: { slug: org.slug, dancerRosterId } },
      });
    } else {
      add.mutate({
        params: { path: { slug: org.slug } },
        body: { dancerRosterId },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex cursor-pointer items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
        isCalledBack
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:bg-muted border border-transparent hover:border-current"
      }`}
      aria-label={isCalledBack ? "Remove callback" : "Call back"}
      aria-pressed={isCalledBack}
    >
      <Megaphone className="mr-1 size-3.5" />
      {isCalledBack ? "Called Back" : "Call Back"}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/features/org/components/callback-button.tsx
git commit -m "feat: add CallbackButton component with optimistic updates"
```

---

## Task 11: Dancer Table Column + Filter Toolbar

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-table/columns.tsx`
- Modify: `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts`
- Modify: `apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx`

- [ ] **Step 1: Add `isCalledBack` to `SearchDancerRow`**

In `apps/frontend/src/features/org/components/dancer-table/columns.tsx`, add `isCalledBack` to the `SearchDancerRow` interface:

```typescript
// Before:
export interface SearchDancerRow extends DancerRow {
  interestedInMySchool: boolean;
  isFavorited: boolean;
  hasNote: boolean;
  rating: number | null;
}

// After:
export interface SearchDancerRow extends DancerRow {
  interestedInMySchool: boolean;
  isFavorited: boolean;
  isCalledBack: boolean;
  hasNote: boolean;
  rating: number | null;
}
```

- [ ] **Step 2: Add callback toggle column definition**

In the same file (`columns.tsx`), add the following column factory after the `favoriteToggleColumn` function and before `notesIndicatorColumn`:

```typescript
export function callbackToggleColumn(
  onToggle: (rosterId: string, current: boolean) => void,
): ColumnDef<SearchDancerRow> {
  return {
    id: "callback",
    header: () => (
      <span title="Callback">
        <Megaphone className="text-muted-foreground size-4" />
      </span>
    ),
    size: 100,
    enableSorting: false,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(row.original.rosterId, row.original.isCalledBack);
        }}
        className={`flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
          row.original.isCalledBack
            ? "bg-foreground text-background"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-label={row.original.isCalledBack ? "Remove callback" : "Call back"}
        aria-pressed={row.original.isCalledBack}
      >
        <Megaphone className="size-3" />
        {row.original.isCalledBack ? "Called" : "Call"}
      </button>
    ),
  };
}
```

Also add `Megaphone` to the lucide-react import at the top of the file:

```typescript
// Before:
import { Heart, PencilIcon, PlusIcon, StarIcon } from "lucide-react";

// After:
import { Heart, Megaphone, PencilIcon, PlusIcon, StarIcon } from "lucide-react";
```

- [ ] **Step 3: Wire callback column into `useSearchColumns`**

In `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts`, add the callback column. Update the imports:

```typescript
// Before:
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

// After:
import {
  bibColumn,
  nameColumn,
  gradYearColumn,
  studioColumn,
  gpaColumn,
  favoriteToggleColumn,
  callbackToggleColumn,
  notesQuickActionColumn,
  schoolInterestColumn,
  rankColumn,
  selectColumn,
  ratingQuickActionColumn,
  ratingDisplayColumn,
  type SearchDancerRow,
} from "./columns";
```

Update the function signature to accept `onCallbackToggle`. When `onCallbackToggle` is undefined (feature disabled), the column won't render:

```typescript
// Before:
export function useSearchColumns(
  onFavoriteToggle: (rosterId: string, current: boolean) => void,
  opts?: {
    enableSelection?: boolean;
    onRate?: (rosterId: string, rating: number) => void;
    onOpenNotes?: (rosterId: string) => void;
    showRank?: boolean;
  },
): ColumnDef<SearchDancerRow>[] {

// After:
export function useSearchColumns(
  onFavoriteToggle: (rosterId: string, current: boolean) => void,
  opts?: {
    enableSelection?: boolean;
    onRate?: (rosterId: string, rating: number) => void;
    onOpenNotes?: (rosterId: string) => void;
    onCallbackToggle?: (rosterId: string, current: boolean) => void;
    showRank?: boolean;
  },
): ColumnDef<SearchDancerRow>[] {
```

Add the callback column after the favorite column. Change:

```typescript
    cols.push(favoriteToggleColumn(onFavoriteToggle));

    if (opts?.onOpenNotes) {
```

To:

```typescript
    cols.push(favoriteToggleColumn(onFavoriteToggle));

    if (opts?.onCallbackToggle) {
      cols.push(callbackToggleColumn(opts.onCallbackToggle));
    }

    if (opts?.onOpenNotes) {
```

Update the `useMemo` dependencies array:

```typescript
// Before:
  }, [onFavoriteToggle, opts?.enableSelection, opts?.onRate, opts?.onOpenNotes, opts?.showRank]);

// After:
  }, [onFavoriteToggle, opts?.enableSelection, opts?.onRate, opts?.onOpenNotes, opts?.onCallbackToggle, opts?.showRank]);
```

- [ ] **Step 4: Add callback toggle to filter toolbar**

In `apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx`:

Add `Megaphone` to the lucide import:

```typescript
// Before:
import { Heart, PencilIcon, SchoolIcon, SearchIcon, StarIcon, XIcon } from "lucide-react";

// After:
import { Heart, Megaphone, PencilIcon, SchoolIcon, SearchIcon, StarIcon, XIcon } from "lucide-react";
```

Add callback props to `DancerFilterToolbarProps`:

```typescript
// Add after:
  hasNotes: boolean;
  onHasNotesChange: (value: boolean) => void;
// These two new props:
  calledBack: boolean;
  onCalledBackChange: (value: boolean) => void;
```

Add `calledBack` to the `hasActiveFilters` check:

```typescript
// Before:
    interested ||
    favorited ||
    rated ||
    hasNotes;

// After:
    interested ||
    favorited ||
    rated ||
    hasNotes ||
    calledBack;
```

Add `onCalledBackChange(false)` to the `clearAll` function:

```typescript
// Before:
    onHasNotesChange(false);

// After:
    onHasNotesChange(false);
    onCalledBackChange(false);
```

Add the callback `IconToggle` in the scouting toggles section, after the "Has notes" toggle. The callback props are optional — the toggle only renders when they're provided (feature gated at the parent):

```typescript
        <IconToggle
          pressed={hasNotes}
          onPressedChange={onHasNotesChange}
          label="Has notes"
        >
          <PencilIcon className="size-3.5" />
        </IconToggle>

        {onCalledBackChange && (
          <IconToggle
            pressed={calledBack ?? false}
            onPressedChange={onCalledBackChange}
            label="Called back"
          >
            <Megaphone className="size-3.5" />
          </IconToggle>
        )}
```

Add `calledBack` and `onCalledBackChange` as **optional** props to the interface and destructured function signature:

```typescript
  calledBack?: boolean;
  onCalledBackChange?: (value: boolean) => void;
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/columns.tsx apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts apps/frontend/src/features/org/components/dancer-filter-toolbar.tsx
git commit -m "feat: add callback column, toggle, and filter to dancer table"
```

---

## Task 12: Dancers Page Wiring

**Files:**
- Modify: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx`

- [ ] **Step 1: Add callback state and mutations**

In the `DancerSearch` component, add callback state after the `hasNotes` state:

```typescript
  const [hasNotes, setHasNotes] = useState(false);
  const [calledBack, setCalledBack] = useState(false);
```

Clear callback filter on row selection reset — add `calledBack` to the `useEffect` deps:

```typescript
// Before:
  useEffect(() => {
    setRowSelection({});
  }, [yearFilter, gpaFilter, stateFilter, interested, favorited, rated, hasNotes]);

// After:
  useEffect(() => {
    setRowSelection({});
  }, [yearFilter, gpaFilter, stateFilter, interested, favorited, rated, hasNotes, calledBack]);
```

Add callback mutations after the `upsertRating` mutation block. Follow the same optimistic update pattern as `addFav`/`removeFav`:

```typescript
  const addCallback = $api.useMutation("post", "/orgs/{slug}/callbacks", {
    onMutate: async ({ body }) => {
      await qc.cancelQueries({ queryKey: dancersKey });
      const previous = qc.getQueryData(dancersKey);
      qc.setQueryData(dancersKey, (old: any) =>
        Array.isArray(old)
          ? old.map((d: any) =>
              d.rosterId === body?.dancerRosterId ? { ...d, isCalledBack: true } : d,
            )
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      toastManager.add({ title: "Couldn't add callback", type: "error" });
    },
    meta: { invalidateQueries: [dancersKey] },
  });

  const removeCallback = $api.useMutation("delete", "/orgs/{slug}/callbacks/{dancerRosterId}", {
    onMutate: async ({ params }) => {
      await qc.cancelQueries({ queryKey: dancersKey });
      const previous = qc.getQueryData(dancersKey);
      qc.setQueryData(dancersKey, (old: any) =>
        Array.isArray(old)
          ? old.map((d: any) =>
              d.rosterId === params?.path?.dancerRosterId ? { ...d, isCalledBack: false } : d,
            )
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(dancersKey, ctx.previous);
      toastManager.add({ title: "Couldn't remove callback", type: "error" });
    },
    meta: { invalidateQueries: [dancersKey] },
  });
```

- [ ] **Step 2: Add callback toggle handler**

Add after the `handleOpenNotes` callback:

```typescript
  const handleCallbackToggle = useCallback(
    (rosterId: string, current: boolean) => {
      if (current) {
        removeCallback.mutate({
          params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
        });
      } else {
        addCallback.mutate({
          params: { path: { slug: orgSlug } },
          body: { dancerRosterId: rosterId },
        });
      }
    },
    [orgSlug, addCallback, removeCallback],
  );
```

- [ ] **Step 3: Wire callback toggle into columns**

Update the `useSearchColumns` call to pass `onCallbackToggle` only when the feature is enabled. First, get `hasFeature` from the org context (it's already available via `useOrg()`):

```typescript
  const { org, hasFeature } = useOrg();
  const callbacksEnabled = hasFeature("callbacks");
```

Then update the columns call:

```typescript
// Before:
  const columns = useSearchColumns(handleFavoriteToggle, {
    enableSelection: true,
    onRate: handleRate,
    onOpenNotes: handleOpenNotes,
    showRank: rated,
  });

// After:
  const columns = useSearchColumns(handleFavoriteToggle, {
    enableSelection: true,
    onRate: handleRate,
    onOpenNotes: handleOpenNotes,
    onCallbackToggle: callbacksEnabled ? handleCallbackToggle : undefined,
    showRank: rated,
  });
```

- [ ] **Step 4: Add `isCalledBack` to filtered data mapping and filtering**

In the `filteredData` `useMemo`, add `isCalledBack` to the row mapping:

```typescript
// Before:
    let result = (dancers ?? []).map((d) => ({
      ...d,
      isFavorited: d.isFavorited ?? false,
      hasNote: d.hasNote ?? false,
      rating: d.rating ?? null,
      interestedInMySchool: d.interestedInMySchool ?? false,
    }));

// After:
    let result = (dancers ?? []).map((d) => ({
      ...d,
      isFavorited: d.isFavorited ?? false,
      isCalledBack: d.isCalledBack ?? false,
      hasNote: d.hasNote ?? false,
      rating: d.rating ?? null,
      interestedInMySchool: d.interestedInMySchool ?? false,
    }));
```

Add the callback filter after the `hasNotes` filter:

```typescript
    if (hasNotes) {
      result = result.filter((d) => d.hasNote);
    }
    if (calledBack) {
      result = result.filter((d) => d.isCalledBack);
    }
```

Update the `useMemo` dependencies to include `calledBack`:

```typescript
// Before:
  }, [dancers, yearFilter, gpaFilter, stateFilter, favorited, rated, hasNotes]);

// After:
  }, [dancers, yearFilter, gpaFilter, stateFilter, favorited, rated, hasNotes, calledBack]);
```

- [ ] **Step 5: Add callback count to stats section**

In the stats `<section>` area, add a callback count stat. Compute it before the return:

```typescript
  const callbackCount = (dancers ?? []).filter((d) => d.isCalledBack).length;
```

Add a new `StatCell` in the stats section (only when feature is enabled):

```typescript
              <StatCell label="To Review" value={toReviewCount} accent="blue" />
              <StatCell label="Favorited" value={favCount} />
              {callbacksEnabled && (
                <StatCell label="Callbacks" value={callbackCount} accent="amber" />
              )}
              <StatCell label="Avg GPA" value={avgGpa} />
```

- [ ] **Step 6: Wire callback filter to toolbar**

Update the `<DancerFilterToolbar>` component to pass callback props only when the feature is enabled:

```typescript
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
                favorited={favorited}
                onFavoritedChange={setFavorited}
                rated={rated}
                onRatedChange={setRated}
                hasNotes={hasNotes}
                onHasNotesChange={setHasNotes}
                {...(callbacksEnabled
                  ? { calledBack, onCalledBackChange: setCalledBack }
                  : {})}
                schoolName={org.name}
                availableYears={availableYears}
                availableStates={availableStates}
                searchRef={searchRef}
              />
```

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx
git commit -m "feat: wire callback mutations, filter, and count into dancers page"
```

---

## Task 13: Dancer Sheet — Add Callback Button

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-sheet.tsx`

- [ ] **Step 1: Import CallbackButton and org context**

Add to the imports in `dancer-sheet.tsx`:

```typescript
import { CallbackButton } from "./callback-button";
```

Also ensure `useOrg` is imported (it's already in scope from the parent, but the `DancerSheetContent` component needs it directly):

```typescript
import { useOrg } from "@/features/org/context/use-org";
```

(Check if `useOrg` is already imported — it is. Just add the `CallbackButton` import.)

- [ ] **Step 2: Add callback button next to favorite button (feature-gated)**

In `DancerSheetContent`, get `hasFeature` from the org context:

```typescript
  const { org, hasFeature } = useOrg();
```

Then find the actions row with `RatingInput` and `FavoriteButton`. Add `CallbackButton` next to `FavoriteButton`, gated by the feature flag:

```typescript
// Before:
        <div className="flex items-center pt-2">
          <div className="flex-1">
            <RatingInput
              value={currentRating}
              onChange={(v) => setRating(v)}
            />
          </div>
          <FavoriteButton
            dancerRosterId={rosterId}
            isFavorited={dancer.isFavorited}
            onToggle={onFavoriteToggle}
          />
        </div>

// After:
        <div className="flex items-center gap-2 pt-2">
          <div className="flex-1">
            <RatingInput
              value={currentRating}
              onChange={(v) => setRating(v)}
            />
          </div>
          {hasFeature("callbacks") && (
            <CallbackButton
              dancerRosterId={rosterId}
              isCalledBack={dancer.isCalledBack ?? false}
            />
          )}
          <FavoriteButton
            dancerRosterId={rosterId}
            isFavorited={dancer.isFavorited}
            onToggle={onFavoriteToggle}
          />
        </div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-sheet.tsx
git commit -m "feat: add callback button to dancer detail sheet"
```

---

## Task 14: Admin Sidebar — Add Callbacks Nav

**Files:**
- Modify: `apps/frontend/src/features/org/components/admin-sidebar.tsx`

- [ ] **Step 1: Add Megaphone icon import**

Add `Megaphone` to the lucide-react import:

```typescript
// Find the existing lucide-react import and add Megaphone
import {
  CheckIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  EyeIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  Megaphone,
  MicIcon,
  MonitorIcon,
  MoonIcon,
  PlayCircleIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
```

- [ ] **Step 2: Add Callbacks to navSections (feature-gated)**

The `navSections` array is static. To feature-gate the "Live Event" section, convert it to a computed value inside the `AdminSidebar` component. Replace the static `navSections` const with a `useMemo` inside the component that uses `hasFeature` from `useOrg()`:

```typescript
  const { org, membership, hasFeature } = useOrg();

  const navSections = useMemo(() => {
    const sections = [
      {
        title: "Rosters",
        items: [
          {
            label: "Dancers",
            icon: UsersIcon,
            to: "/$orgSlug/admin/dancers" as const,
          },
          {
            label: "Coaches",
            icon: MicIcon,
            to: "/$orgSlug/admin/coaches" as const,
          },
        ],
      },
    ];

    if (hasFeature("callbacks")) {
      sections.push({
        title: "Live Event",
        items: [
          {
            label: "Callbacks",
            icon: Megaphone,
            to: "/$orgSlug/admin/callbacks" as const,
          },
        ],
      });
    }

    sections.push(
      {
        title: "Content",
        items: [
          {
            label: "Video Library",
            icon: PlayCircleIcon,
            to: "/$orgSlug/admin/video-library" as const,
          },
        ],
      },
      {
        title: "Settings",
        items: [
          {
            label: "Audit Log",
            icon: ClipboardListIcon,
            to: "/$orgSlug/admin/uploads" as const,
          },
          {
            label: "Settings",
            icon: SettingsIcon,
            to: "/$orgSlug/admin/settings" as const,
          },
        ],
      },
    );

    return sections;
  }, [hasFeature]);
```

Add `useMemo` to the React import at the top of the file. Remove the old static `navSections` const from outside the component.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/admin-sidebar.tsx
git commit -m "feat: add Callbacks nav item to admin sidebar"
```

---

## Task 15: Admin Callbacks Page

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`

- [ ] **Step 1: Create the page**

Create `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`:

```tsx
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { cn } from "@/components/utils/cn";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { LivePulse, StatCell } from "@/features/org/components/dashboard-shared";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/admin/callbacks",
)({
  component: AdminCallbacksPage,
});

function AdminCallbacksPage() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/admin/callbacks",
  });
  const { data } = useSuspenseQuery(scoutingQueries.adminCallbacks(orgSlug));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Callbacks</h1>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <LivePulse />
            Live — updating as coaches select
          </span>
        </div>
      </header>

      {/* Stat cards */}
      <section
        aria-label="Callback stats"
        className="border-border flex items-stretch border-y"
      >
        <StatCell label="Total Schools" value={data.totalSchools} />
        <StatCell label="Total Dancers" value={data.totalDancers} />
        <StatCell
          label="Callbacks Selected"
          value={data.uniqueCallbacks}
          accent="amber"
        />
      </section>

      {/* Bib grid */}
      <div className="flex-1 p-4">
        {data.bibs.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-24">
            <Megaphone className="size-8 opacity-40" />
            <p className="text-sm">No callbacks yet.</p>
            <p className="text-xs opacity-60">
              Bib numbers will appear here as coaches make selections.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.bibs.map(
              (bib: {
                dancerRosterId: string;
                bibNumber: number | null;
                firstName: string;
                lastName: string;
                coachCount: number;
              }) => (
                <div
                  key={bib.dancerRosterId}
                  className={cn(
                    "bg-foreground text-background flex min-w-[72px] flex-col items-center justify-center rounded-xl px-3 py-2.5",
                  )}
                >
                  <span className="text-xl font-bold tabular-nums leading-none">
                    {bib.bibNumber != null
                      ? String(bib.bibNumber).padStart(2, "0")
                      : "—"}
                  </span>
                  <span className="mt-1 max-w-[80px] truncate text-[10px] opacity-70">
                    {bib.firstName} {bib.lastName?.[0]}.
                  </span>
                  {Number(bib.coachCount) > 1 && (
                    <span className="mt-0.5 text-[10px] opacity-50">
                      {bib.coachCount} coaches
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {data.bibs.length > 0 && (
        <footer className="border-border text-muted-foreground flex items-center justify-between border-t px-4 py-3 text-xs">
          <span>
            {data.uniqueCallbacks} number{data.uniqueCallbacks === 1 ? "" : "s"}{" "}
            · no repeats
          </span>
          <span>
            Sharpen Up staff decides how to split these into groups based on
            total count.
          </span>
        </footer>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Regenerate route tree**

Run:
```bash
cd apps/frontend && pnpm dev
```

Wait a few seconds for TanStack Router to detect the new route file and regenerate `routeTree.gen.ts`, then stop the dev server.

Alternatively:
```bash
cd apps/frontend && pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx apps/frontend/src/routeTree.gen.ts
git commit -m "feat: add admin callbacks page with live bib grid and stats"
```

---

## Task 16: Transmit Client — Live Updates on Admin Page

**Files:**
- Create: `apps/frontend/src/features/org/hooks/use-transmit.ts`
- Modify: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`

- [ ] **Step 1: Install transmit client**

Run:
```bash
cd apps/frontend && pnpm add @adonisjs/transmit-client
```

- [ ] **Step 2: Create transmit hook**

Create `apps/frontend/src/features/org/hooks/use-transmit.ts`:

```typescript
import { Transmit } from "@adonisjs/transmit-client";
import { useEffect, useRef } from "react";

let transmit: Transmit | null = null;

function getTransmit() {
  if (!transmit) {
    transmit = new Transmit({
      baseUrl: window.location.origin,
    });
  }
  return transmit;
}

export function useTransmitSubscription(
  channel: string | null,
  onEvent: () => void,
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!channel) return;

    const t = getTransmit();
    const subscription = t.subscription(channel);
    let mounted = true;

    subscription
      .create()
      .then(() => {
        subscription.onMessage(() => {
          if (mounted) onEventRef.current();
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
      subscription.delete().catch(() => {});
    };
  }, [channel]);
}
```

- [ ] **Step 3: Wire transmit into admin callbacks page**

In `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`, add imports:

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { useTransmitSubscription } from "@/features/org/hooks/use-transmit";
```

Update the `useSuspenseQuery` import to keep it from the existing import line (it already imports from `@tanstack/react-query`; just add `useQueryClient` to the same import).

Inside `AdminCallbacksPage`, add the transmit subscription after the query:

```typescript
  const { data } = useSuspenseQuery(scoutingQueries.adminCallbacks(orgSlug));
  const qc = useQueryClient();

  useTransmitSubscription(`orgs/${orgSlug}/callbacks`, () => {
    qc.invalidateQueries({
      queryKey: scoutingQueries.adminCallbacks(orgSlug).queryKey,
    });
  });
```

- [ ] **Step 4: Verify frontend builds**

Run:
```bash
cd apps/frontend && pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/org/hooks/use-transmit.ts apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx apps/frontend/package.json apps/frontend/pnpm-lock.yaml
git commit -m "feat: add transmit client for live admin callback updates"
```

---

## Task 17: Verification

- [ ] **Step 1: Backend build check**

```bash
cd apps/backend && pnpm build
```

- [ ] **Step 2: Frontend build check**

```bash
cd apps/frontend && pnpm build
```

- [ ] **Step 3: Manual test — Coach callback flow**

1. Start both backend and frontend dev servers
2. Log in as a coach for an org with `features.callbacks` enabled
3. Navigate to the dancers page
4. Verify the "Called back" filter toggle appears in the toolbar (Megaphone icon)
5. Verify each dancer row has a "Call" button at the end
6. Click "Call" on a dancer — button should fill and change to "Called"
7. Click again — button reverts to "Call"
8. Open a dancer's detail sheet — verify CallbackButton appears next to FavoriteButton
9. Toggle callback from the sheet — verify it syncs with the table
10. Activate the "Called back" filter — only called-back dancers show
11. Verify the "Callbacks: N" stat cell appears in the stats bar

- [ ] **Step 4: Manual test — Admin live board**

1. Log in as admin for the same org
2. Navigate to admin sidebar → "Callbacks" under "Live Event"
3. Verify stat cards show Total Schools, Total Dancers, Callbacks Selected
4. Verify bib grid shows called-back bib numbers as black tiles
5. In another browser/tab, log in as a coach and add a callback
6. Verify the admin page updates automatically (transmit push) without manual refresh
7. Verify deduplication — two coaches calling back the same dancer shows one tile with "2 coaches"

- [ ] **Step 5: Final commit if any fixes needed**
