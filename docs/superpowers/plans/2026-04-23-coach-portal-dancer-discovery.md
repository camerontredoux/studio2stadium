# Coach Portal — Dancer Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the coach-facing dancer discovery portal — search table, side sheet, favorites, rankings, event info landing page, and full Top 3 school selection system with privacy enforcement.

**Architecture:** Extends the existing `features/org/` module. Backend uses AdonisJS + Drizzle ORM with the established controller/service/validator pattern. Frontend uses TanStack Router (file-based routes), TanStack Table, TanStack Query via `openapi-react-query`, BaseUI components, and React Hook Form. All types flow from auto-generated OpenAPI types — no `as` casts.

**Tech Stack:** AdonisJS 6, Drizzle ORM, PostgreSQL, React 19, TanStack Router/Table/Query, openapi-react-query, BaseUI, React Hook Form, Zod, Tailwind CSS

**Design Spec:** `docs/superpowers/specs/2026-04-23-coach-portal-dancer-discovery-design.md`

---

## File Map

### Backend — New Files

| File | Purpose |
|------|---------|
| `apps/backend/app/database/schema/event-features.ts` | MODIFY: add `eventSchoolSelections` table |
| `apps/backend/app/modules/orgs/scouting/dancers/list/service.ts` | MODIFY: add `interestedInMySchool` join + `interested` filter |
| `apps/backend/app/modules/orgs/scouting/dancers/list/validator.ts` | MODIFY: add `interested` query param |
| `apps/backend/app/modules/orgs/scouting/ratings/upsert/validator.ts` | MODIFY: constrain rating to 1-5 |
| `apps/backend/app/modules/orgs/scouting/routes.ts` | MODIFY: register new school selection routes |
| `apps/backend/app/modules/orgs/scouting/schools/list/controller.ts` | NEW: list coach programs |
| `apps/backend/app/modules/orgs/scouting/schools/list/service.ts` | NEW: query coach roster entries |
| `apps/backend/app/modules/orgs/scouting/selections/list/controller.ts` | NEW: get dancer's picks |
| `apps/backend/app/modules/orgs/scouting/selections/list/service.ts` | NEW: query dancer selections |
| `apps/backend/app/modules/orgs/scouting/selections/create/controller.ts` | NEW: add selection |
| `apps/backend/app/modules/orgs/scouting/selections/create/service.ts` | NEW: insert selection (max 3) |
| `apps/backend/app/modules/orgs/scouting/selections/create/validator.ts` | NEW: validate coachRosterId |
| `apps/backend/app/modules/orgs/scouting/selections/delete/controller.ts` | NEW: remove selection |
| `apps/backend/app/modules/orgs/scouting/selections/delete/service.ts` | NEW: delete selection |

### Frontend — New Files

| File | Purpose |
|------|---------|
| `apps/frontend/src/features/org/api/scouting-mutations.ts` | NEW: mutation hooks for all scouting actions |
| `apps/frontend/src/features/org/api/scouting-schemas.ts` | NEW: Zod schemas for forms |
| `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx` | NEW: shared Frame+Table with mobile cards |
| `apps/frontend/src/features/org/components/dancer-table/dancer-card.tsx` | NEW: mobile card renderer |
| `apps/frontend/src/features/org/components/dancer-table/columns.tsx` | NEW: all column definitions |
| `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts` | NEW: column composition hook |
| `apps/frontend/src/features/org/components/dancer-sheet.tsx` | NEW: side sheet for quick view |
| `apps/frontend/src/features/org/components/dancer-search-form.tsx` | NEW: RHF search + filter form |
| `apps/frontend/src/features/org/components/school-selection-picker.tsx` | NEW: dancer Top 3 UI |

### Frontend — Modified Files

| File | Purpose |
|------|---------|
| `apps/frontend/src/features/org/api/scouting-queries.ts` | MODIFY: add `interested` param, `schools`, `mySelections` queries |
| `apps/frontend/src/features/org/components/coach-sidebar.tsx` | MODIFY: 4 nav items + footer dropdown |
| `apps/frontend/src/features/org/components/rating-input.tsx` | MODIFY: switch to 1-5 star Rating component |
| `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/index.tsx` | MODIFY: redirect to event-info |
| `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx` | REWRITE: TanStack Table + search form |
| `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/favorites.tsx` | REWRITE: DancerTable with favorites data |
| `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/rankings.tsx` | REWRITE: DancerTable with rankings data |
| `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/event-info.tsx` | NEW: event info landing page |

---

## Task 1: Database Schema — eventSchoolSelections

**Files:**
- Modify: `apps/backend/app/database/schema/event-features.ts`

- [ ] **Step 1: Add eventSchoolSelections table to schema**

Add to the bottom of `apps/backend/app/database/schema/event-features.ts`:

```typescript
export const eventSchoolSelections = pg.pgTable(
  "event_school_selections",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    dancerRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    coachRosterId: pg
      .uuid()
      .notNull()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    createdAt: pg.timestamp().notNull().defaultNow(),
  },
  (table) => [
    pg
      .uniqueIndex()
      .on(table.eventId, table.dancerRosterId, table.coachRosterId),
    pg.index().on(table.eventId, table.dancerRosterId),
    pg.index().on(table.eventId, table.coachRosterId),
  ]
);
```

Note: The `orgEvents` and `eventRosters` imports already exist at the top of this file.

- [ ] **Step 2: Generate and run the migration**

```bash
cd apps/backend && pnpm db:generate && pnpm db:migrate
```

Expected: Migration file created in `drizzle/` folder, migration runs successfully.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/database/schema/event-features.ts apps/backend/drizzle/
git commit -m "feat(db): add eventSchoolSelections table for dancer Top 3 picks"
```

---

## Task 2: Backend — School Selection Endpoints (Dancer-Facing)

**Files:**
- Create: `apps/backend/app/modules/orgs/scouting/schools/list/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/schools/list/controller.ts`
- Create: `apps/backend/app/modules/orgs/scouting/selections/list/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/selections/list/controller.ts`
- Create: `apps/backend/app/modules/orgs/scouting/selections/create/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/selections/create/controller.ts`
- Create: `apps/backend/app/modules/orgs/scouting/selections/create/validator.ts`
- Create: `apps/backend/app/modules/orgs/scouting/selections/delete/service.ts`
- Create: `apps/backend/app/modules/orgs/scouting/selections/delete/controller.ts`
- Modify: `apps/backend/app/modules/orgs/scouting/routes.ts`

- [ ] **Step 1: Create ListSchoolsService**

Create `apps/backend/app/modules/orgs/scouting/schools/list/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters } from "#database/schema/org-events";
import { and, eq } from "drizzle-orm";

@inject()
export class ListSchoolsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string) {
    return this.db.use((db) =>
      db
        .select({
          rosterId: eventRosters.id,
          organization: eventRosters.organization,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
        })
        .from(eventRosters)
        .where(
          and(
            eq(eventRosters.eventId, eventId),
            eq(eventRosters.type, "coach")
          )
        )
        .orderBy(eventRosters.organization)
    );
  }
}
```

- [ ] **Step 2: Create ListSchoolsController**

Create `apps/backend/app/modules/orgs/scouting/schools/list/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListSchoolsService } from "./service.ts";

export default class ListSchoolsController {
  @inject()
  async handle(ctx: HttpContext, service: ListSchoolsService) {
    const rows = await service.execute(ctx.orgEvent!.id);
    return ctx.response.ok(rows);
  }
}
```

- [ ] **Step 3: Create ListSelectionsService**

Create `apps/backend/app/modules/orgs/scouting/selections/list/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { eventRosters } from "#database/schema/org-events";
import { and, eq } from "drizzle-orm";

@inject()
export class ListSelectionsService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, dancerRosterId: string) {
    return this.db.use((db) =>
      db
        .select({
          id: eventSchoolSelections.id,
          coachRosterId: eventSchoolSelections.coachRosterId,
          organization: eventRosters.organization,
          createdAt: eventSchoolSelections.createdAt,
        })
        .from(eventSchoolSelections)
        .innerJoin(
          eventRosters,
          eq(eventRosters.id, eventSchoolSelections.coachRosterId)
        )
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
        .orderBy(eventSchoolSelections.createdAt)
    );
  }
}
```

- [ ] **Step 4: Create ListSelectionsController**

Create `apps/backend/app/modules/orgs/scouting/selections/list/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListSelectionsService } from "./service.ts";

export default class ListSelectionsController {
  @inject()
  async handle(ctx: HttpContext, service: ListSelectionsService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event.",
      });
    }
    const rows = await service.execute(ctx.orgEvent!.id, ctx.orgRoster.id);
    return ctx.response.ok(rows);
  }
}
```

- [ ] **Step 5: Create CreateSelectionService**

Create `apps/backend/app/modules/orgs/scouting/selections/create/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { and, eq, sql } from "drizzle-orm";

@inject()
export class CreateSelectionService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(
    eventId: string,
    dancerRosterId: string,
    coachRosterId: string
  ) {
    const [countRow] = await this.db.use((db) =>
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
    );

    if (countRow.count >= 3) {
      return { error: "max_selections" as const };
    }

    const [row] = await this.db.use((db) =>
      db
        .insert(eventSchoolSelections)
        .values({ eventId, dancerRosterId, coachRosterId })
        .onConflictDoNothing()
        .returning()
    );

    if (row) return { data: row };

    const [existing] = await this.db.use((db) =>
      db
        .select()
        .from(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId),
            eq(eventSchoolSelections.coachRosterId, coachRosterId)
          )
        )
        .limit(1)
    );
    return { data: existing };
  }
}
```

- [ ] **Step 6: Create CreateSelectionValidator**

Create `apps/backend/app/modules/orgs/scouting/selections/create/validator.ts`:

```typescript
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    coachRosterId: vine.string().uuid(),
  })
);

export type Validator = Infer<typeof schema>;
```

- [ ] **Step 7: Create CreateSelectionController**

Create `apps/backend/app/modules/orgs/scouting/selections/create/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { CreateSelectionService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateSelectionController {
  @inject()
  async handle(ctx: HttpContext, service: CreateSelectionService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event.",
      });
    }

    const payload = await ctx.request.validateUsing(schema);
    const result = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      payload.coachRosterId
    );

    if ("error" in result) {
      return ctx.response.unprocessableEntity({
        message: "You can only select up to 3 schools. Remove one to add another.",
      });
    }

    return ctx.response.created(result.data);
  }
}
```

- [ ] **Step 8: Create DeleteSelectionService**

Create `apps/backend/app/modules/orgs/scouting/selections/delete/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventSchoolSelections } from "#database/schema/event-features";
import { and, eq } from "drizzle-orm";

@inject()
export class DeleteSelectionService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, dancerRosterId: string, selectionId: string) {
    const [row] = await this.db.use((db) =>
      db
        .delete(eventSchoolSelections)
        .where(
          and(
            eq(eventSchoolSelections.id, selectionId),
            eq(eventSchoolSelections.eventId, eventId),
            eq(eventSchoolSelections.dancerRosterId, dancerRosterId)
          )
        )
        .returning()
    );
    return row ?? null;
  }
}
```

- [ ] **Step 9: Create DeleteSelectionController**

Create `apps/backend/app/modules/orgs/scouting/selections/delete/controller.ts`:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { DeleteSelectionService } from "./service.ts";

export default class DeleteSelectionController {
  @inject()
  async handle(ctx: HttpContext, service: DeleteSelectionService) {
    if (!ctx.orgRoster) {
      return ctx.response.conflict({
        message: "You must be registered in this event.",
      });
    }

    const selectionId = ctx.params.id;
    const row = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster.id,
      selectionId
    );

    if (!row) {
      return ctx.response.notFound({ message: "Selection not found." });
    }

    return ctx.response.ok(row);
  }
}
```

- [ ] **Step 10: Register routes**

In `apps/backend/app/modules/orgs/scouting/routes.ts`, add lazy imports at the top:

```typescript
const ListSchools = () => import("./schools/list/controller.ts");
const ListSelections = () => import("./selections/list/controller.ts");
const CreateSelection = () => import("./selections/create/controller.ts");
const DeleteSelection = () => import("./selections/delete/controller.ts");
```

Add a **new route group** after the existing coach group (uses `orgDancer` middleware instead of `orgCoach`):

```typescript
router
  .group(() => {
    router.get(":slug/schools", [ListSchools]);
    router.get(":slug/my-selections", [ListSelections]);
    router.post(":slug/my-selections", [CreateSelection]);
    router.delete(":slug/my-selections/:id", [DeleteSelection]);
  })
  .prefix("orgs")
  .use([
    middleware.auth(),
    middleware.org(),
    middleware.orgEvent(),
    middleware.orgMember(),
    middleware.orgDancer(),
  ])
  .openapi({ tags: ["Org School Selections"] });
```

Note: The `ListSchools` endpoint could also be available to coaches. If needed later, create a second route registration under the coach middleware group. For now, dancers need it for the picker.

- [ ] **Step 11: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/schools/ apps/backend/app/modules/orgs/scouting/selections/ apps/backend/app/modules/orgs/scouting/routes.ts
git commit -m "feat(backend): add school selection endpoints for dancer Top 3 picks"
```

---

## Task 3: Backend — Modify Dancer List for School Interest

**Files:**
- Modify: `apps/backend/app/modules/orgs/scouting/dancers/list/service.ts`
- Modify: `apps/backend/app/modules/orgs/scouting/dancers/list/validator.ts`
- Modify: `apps/backend/app/modules/orgs/scouting/ratings/upsert/validator.ts`

- [ ] **Step 1: Add `interested` to validator**

In `apps/backend/app/modules/orgs/scouting/dancers/list/validator.ts`, add `interested` to the schema object:

```typescript
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    search: vine.string().trim().minLength(1).optional(),
    bib: vine.number().positive().optional(),
    interested: vine.boolean().optional(),
    limit: vine.number().min(1).max(200).optional(),
    offset: vine.number().min(0).optional(),
  })
);
export type Validator = Infer<typeof schema>;
```

- [ ] **Step 2: Modify ListDancersService to join school selections**

Replace the full contents of `apps/backend/app/modules/orgs/scouting/dancers/list/service.ts`:

```typescript
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, eventDancerProfiles } from "#database/schema/org-events";
import { eventSchoolSelections } from "#database/schema/event-features";
import { dancerProfiles } from "#database/schema/dancers";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import type { Validator } from "./validator.ts";

@inject()
export class ListDancersService {
  constructor(private db: DatabaseService = new DatabaseService()) {}

  async execute(eventId: string, coachRosterId: string | null, q: Validator) {
    return this.db.use((db) => {
      const filters = [
        eq(eventRosters.eventId, eventId),
        eq(eventRosters.type, "dancer"),
      ];

      if (q.bib !== undefined) {
        filters.push(eq(eventRosters.bibNumber, q.bib));
      } else if (q.search) {
        const pattern = `%${q.search}%`;
        filters.push(
          or(
            ilike(eventRosters.firstName, pattern),
            ilike(eventRosters.lastName, pattern),
            ilike(eventRosters.organization, pattern)
          )!
        );
      }

      const interestedSubquery = coachRosterId
        ? sql<boolean>`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${coachRosterId}
              AND ess.event_id = ${eventId}
          )`
        : sql<boolean>`false`;

      if (q.interested && coachRosterId) {
        filters.push(
          sql`EXISTS (
            SELECT 1 FROM event_school_selections ess
            WHERE ess.dancer_roster_id = ${eventRosters.id}
              AND ess.coach_roster_id = ${coachRosterId}
              AND ess.event_id = ${eventId}
          )`
        );
      }

      return db
        .select({
          rosterId: eventRosters.id,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          organization: eventRosters.organization,
          isRegistered: sql<boolean>`${eventRosters.userId} IS NOT NULL`,
          profilePhotoUrl: eventDancerProfiles.profilePhotoUrl,
          gpa: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gpa}, ${dancerProfiles.gpa})`,
          gradYear: sql<
            number | null
          >`COALESCE(${eventDancerProfiles.gradYear}, ${dancerProfiles.gradYear})`,
          studio: sql<
            string | null
          >`COALESCE(${eventDancerProfiles.studio}, ${dancerProfiles.studio})`,
          state: eventDancerProfiles.state,
          interestedInMySchool: interestedSubquery,
        })
        .from(eventRosters)
        .leftJoin(
          eventDancerProfiles,
          eq(eventDancerProfiles.rosterId, eventRosters.id)
        )
        .leftJoin(
          dancerProfiles,
          eq(dancerProfiles.userId, eventRosters.userId)
        )
        .where(and(...filters))
        .orderBy(eventRosters.bibNumber)
        .limit(q.limit ?? 100)
        .offset(q.offset ?? 0);
    });
  }
}
```

**Key change:** The service now takes `coachRosterId` as a second parameter. The controller must pass it.

- [ ] **Step 3: Update ListDancersController to pass coachRosterId**

In `apps/backend/app/modules/orgs/scouting/dancers/list/controller.ts`, update the service call:

```typescript
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { ListDancersService } from "./service.ts";
import { schema } from "./validator.ts";

export default class ListDancersController {
  @inject()
  async handle(ctx: HttpContext, service: ListDancersService) {
    const payload = await ctx.request.validateUsing(schema);
    const rows = await service.execute(
      ctx.orgEvent!.id,
      ctx.orgRoster?.id ?? null,
      payload
    );
    return ctx.response.ok(rows);
  }
}
```

- [ ] **Step 4: Constrain rating to 1-5**

In `apps/backend/app/modules/orgs/scouting/ratings/upsert/validator.ts`:

```typescript
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    rating: vine.number().withoutDecimals().min(1).max(5),
  })
);

export type Validator = Infer<typeof schema>;
```

- [ ] **Step 5: Regenerate OpenAPI types**

```bash
cd apps/backend && pnpm make:docs
cd ../frontend && pnpm types
```

Expected: `apps/frontend/src/lib/api/types.d.ts` is regenerated with `interestedInMySchool` in dancer response and `interested` in dancer query params. New school/selection endpoints appear.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/modules/orgs/scouting/dancers/ apps/backend/app/modules/orgs/scouting/ratings/upsert/validator.ts apps/frontend/src/lib/api/types.d.ts
git commit -m "feat(backend): add interestedInMySchool to dancer list, constrain rating 1-5"
```

---

## Task 4: Frontend — Scouting API Layer (Queries, Mutations, Schemas)

**Files:**
- Modify: `apps/frontend/src/features/org/api/scouting-queries.ts`
- Create: `apps/frontend/src/features/org/api/scouting-mutations.ts`
- Create: `apps/frontend/src/features/org/api/scouting-schemas.ts`

- [ ] **Step 1: Update scouting-queries.ts**

Replace the full contents of `apps/frontend/src/features/org/api/scouting-queries.ts`:

```typescript
import { $api } from "@/lib/api/client";

export const scoutingQueries = {
  dancers: (
    slug: string,
    params: {
      search?: string;
      bib?: number;
      interested?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers", {
      params: {
        path: { slug },
        query: params,
      },
    }),
  dancer: (slug: string, rosterId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/dancers/{rosterId}", {
      params: { path: { slug, rosterId } },
    }),
  favorites: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/favorites", {
      params: { path: { slug } },
    }),
  rankings: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/rankings", {
      params: { path: { slug } },
    }),
  schools: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/schools", {
      params: { path: { slug } },
    }),
  mySelections: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/my-selections", {
      params: { path: { slug } },
    }),
};
```

- [ ] **Step 2: Create scouting-mutations.ts**

Create `apps/frontend/src/features/org/api/scouting-mutations.ts`:

```typescript
import { $api } from "@/lib/api/client";
import { scoutingQueries } from "./scouting-queries";

export function useAddFavorite(slug: string) {
  return $api.useMutation("post", "/orgs/{slug}/favorites", {
    meta: {
      invalidateQueries: [
        scoutingQueries.favorites(slug).queryKey,
        scoutingQueries.dancers(slug).queryKey,
        scoutingQueries.rankings(slug).queryKey,
      ],
    },
  });
}

export function useRemoveFavorite(slug: string) {
  return $api.useMutation(
    "delete",
    "/orgs/{slug}/favorites/{dancerRosterId}",
    {
      meta: {
        invalidateQueries: [
          scoutingQueries.favorites(slug).queryKey,
          scoutingQueries.dancers(slug).queryKey,
          scoutingQueries.rankings(slug).queryKey,
        ],
      },
    }
  );
}

export function useUpsertRating(slug: string) {
  return $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating",
    {
      meta: {
        invalidateQueries: [
          scoutingQueries.rankings(slug).queryKey,
        ],
      },
    }
  );
}

export function useUpsertNote(slug: string) {
  return $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
    {
      meta: {
        invalidateQueries: [
          scoutingQueries.rankings(slug).queryKey,
        ],
      },
    }
  );
}

export function useDeleteNote(slug: string) {
  return $api.useMutation(
    "delete",
    "/orgs/{slug}/dancers/{dancerRosterId}/notes",
    {
      meta: {
        invalidateQueries: [
          scoutingQueries.rankings(slug).queryKey,
        ],
      },
    }
  );
}

export function useAddSchoolSelection(slug: string) {
  return $api.useMutation("post", "/orgs/{slug}/my-selections", {
    meta: {
      invalidateQueries: [
        scoutingQueries.mySelections(slug).queryKey,
      ],
    },
  });
}

export function useRemoveSchoolSelection(slug: string) {
  return $api.useMutation("delete", "/orgs/{slug}/my-selections/{id}", {
    meta: {
      invalidateQueries: [
        scoutingQueries.mySelections(slug).queryKey,
      ],
    },
  });
}
```

- [ ] **Step 3: Create scouting-schemas.ts**

Create `apps/frontend/src/features/org/api/scouting-schemas.ts`:

```typescript
import { z } from "zod";

export const dancerSearchSchema = z.object({
  search: z.string().default(""),
  interested: z.boolean().default(false),
});

export type DancerSearchForm = z.infer<typeof dancerSearchSchema>;

export const noteSchema = z.object({
  content: z.string().max(2000),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const schoolSelectionSchema = z.object({
  coachRosterId: z.string().uuid(),
});
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/org/api/
git commit -m "feat(frontend): add scouting queries, mutations, and schemas"
```

---

## Task 5: Frontend — Shared DancerTable Component

**Files:**
- Create: `apps/frontend/src/features/org/components/dancer-table/columns.tsx`
- Create: `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts`
- Create: `apps/frontend/src/features/org/components/dancer-table/dancer-card.tsx`
- Create: `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx`

This is the largest single component. It renders a Frame-wrapped TanStack Table on desktop and a card list on mobile. Reference `apps/frontend/src/features/favorites/components/favorites-table.tsx` for the exact Frame+Table+pagination pattern — it uses the same approach we need (desktop table in Frame, mobile card list, pagination footer).

- [ ] **Step 1: Create column definitions**

Create `apps/frontend/src/features/org/components/dancer-table/columns.tsx`:

```typescript
import type { ColumnDef } from "@tanstack/react-table";
import { Heart } from "lucide-react";
import { Rating, RatingItem } from "@/components/ui/rating";

export interface DancerRow {
  rosterId: string;
  bibNumber: number | null;
  firstName: string;
  lastName: string;
  gradYear: number | null;
  studio: string | null;
  gpa: number | null;
  profilePhotoUrl: string | null;
  state: string | null;
}

export interface SearchDancerRow extends DancerRow {
  interestedInMySchool: boolean;
  isFavorited: boolean;
  hasNotes: boolean;
}

export interface FavoriteDancerRow extends DancerRow {
  rating: number | null;
  hasNotes: boolean;
}

export interface RankedDancerRow extends DancerRow {
  rating: number | null;
  note: string | null;
  isFavorited: boolean;
}

export const bibColumn: ColumnDef<DancerRow> = {
  accessorKey: "bibNumber",
  header: "Bib",
  size: 60,
  cell: ({ getValue }) => {
    const bib = getValue<number | null>();
    return (
      <span className="font-mono text-sm">
        {bib != null ? String(bib).padStart(2, "0") : "—"}
      </span>
    );
  },
};

export const nameColumn: ColumnDef<DancerRow> = {
  id: "name",
  accessorFn: (row) => `${row.lastName}, ${row.firstName}`,
  header: "Name",
  cell: ({ row }) => (
    <span className="truncate font-medium">
      {row.original.lastName}, {row.original.firstName}
    </span>
  ),
};

export const gradYearColumn: ColumnDef<DancerRow> = {
  accessorKey: "gradYear",
  header: "Year",
  size: 70,
  cell: ({ getValue }) => getValue<number | null>() ?? "—",
};

export const studioColumn: ColumnDef<DancerRow> = {
  accessorKey: "studio",
  header: "Studio",
  enableSorting: false,
  cell: ({ getValue }) => (
    <span className="truncate">{getValue<string | null>() ?? "—"}</span>
  ),
};

export const gpaColumn: ColumnDef<DancerRow> = {
  accessorKey: "gpa",
  header: "GPA",
  size: 60,
  cell: ({ getValue }) => {
    const gpa = getValue<number | null>();
    return gpa != null ? gpa.toFixed(1) : "—";
  },
};

export function favoriteToggleColumn(
  onToggle: (rosterId: string, current: boolean) => void
): ColumnDef<SearchDancerRow> {
  return {
    id: "favorite",
    header: () => <Heart className="text-muted-foreground size-4" />,
    size: 40,
    enableSorting: false,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(row.original.rosterId, row.original.isFavorited);
        }}
        className="flex items-center justify-center"
        aria-label={
          row.original.isFavorited ? "Unfavorite" : "Favorite"
        }
      >
        <Heart
          className={`size-4 ${
            row.original.isFavorited
              ? "fill-current text-red-500"
              : "text-muted-foreground"
          }`}
        />
      </button>
    ),
  };
}

export const notesIndicatorColumn: ColumnDef<{ hasNotes?: boolean; note?: string | null }> = {
  id: "notes",
  header: () => <span className="text-muted-foreground text-xs">✎</span>,
  size: 40,
  enableSorting: false,
  cell: ({ row }) => {
    const has = (row.original as any).hasNotes ?? (row.original as any).note != null;
    return has ? (
      <span className="bg-primary inline-block size-2 rounded-full" />
    ) : null;
  },
};

export const schoolInterestColumn: ColumnDef<SearchDancerRow> = {
  id: "schoolInterest",
  header: () => <span className="text-muted-foreground text-xs">⭐</span>,
  size: 40,
  enableSorting: false,
  cell: ({ row }) =>
    row.original.interestedInMySchool ? (
      <span className="text-amber-500">★</span>
    ) : null,
};

export function ratingDisplayColumn(): ColumnDef<{ rating: number | null }> {
  return {
    accessorKey: "rating",
    header: "Rating",
    size: 120,
    cell: ({ getValue }) => {
      const rating = getValue<number | null>();
      if (rating == null) return <span className="text-muted-foreground text-sm">—</span>;
      return (
        <Rating disabled size="sm" value={rating}>
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem key={i} index={i} />
          ))}
        </Rating>
      );
    },
  };
}

export const rankColumn: ColumnDef<RankedDancerRow> = {
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

export const notePreviewColumn: ColumnDef<RankedDancerRow> = {
  id: "notePreview",
  header: "Note",
  enableSorting: false,
  cell: ({ row }) =>
    row.original.note ? (
      <span className="text-muted-foreground line-clamp-1 text-sm">
        {row.original.note}
      </span>
    ) : null,
};
```

- [ ] **Step 2: Create column composition hook**

Create `apps/frontend/src/features/org/components/dancer-table/use-dancer-columns.ts`:

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
  type SearchDancerRow,
  type FavoriteDancerRow,
  type RankedDancerRow,
} from "./columns";

export function useSearchColumns(
  onFavoriteToggle: (rosterId: string, current: boolean) => void
): ColumnDef<SearchDancerRow>[] {
  return useMemo(
    () => [
      bibColumn as ColumnDef<SearchDancerRow>,
      nameColumn as ColumnDef<SearchDancerRow>,
      gradYearColumn as ColumnDef<SearchDancerRow>,
      studioColumn as ColumnDef<SearchDancerRow>,
      gpaColumn as ColumnDef<SearchDancerRow>,
      favoriteToggleColumn(onFavoriteToggle),
      notesIndicatorColumn as ColumnDef<SearchDancerRow>,
      schoolInterestColumn,
    ],
    [onFavoriteToggle]
  );
}

export function useFavoritesColumns(): ColumnDef<FavoriteDancerRow>[] {
  return useMemo(
    () => [
      bibColumn as ColumnDef<FavoriteDancerRow>,
      nameColumn as ColumnDef<FavoriteDancerRow>,
      gradYearColumn as ColumnDef<FavoriteDancerRow>,
      studioColumn as ColumnDef<FavoriteDancerRow>,
      gpaColumn as ColumnDef<FavoriteDancerRow>,
      ratingDisplayColumn() as ColumnDef<FavoriteDancerRow>,
      notesIndicatorColumn as ColumnDef<FavoriteDancerRow>,
    ],
    []
  );
}

export function useRankingsColumns(): ColumnDef<RankedDancerRow>[] {
  return useMemo(
    () => [
      rankColumn,
      bibColumn as ColumnDef<RankedDancerRow>,
      nameColumn as ColumnDef<RankedDancerRow>,
      gradYearColumn as ColumnDef<RankedDancerRow>,
      gpaColumn as ColumnDef<RankedDancerRow>,
      ratingDisplayColumn() as ColumnDef<RankedDancerRow>,
      notePreviewColumn,
    ],
    []
  );
}
```

- [ ] **Step 3: Create mobile DancerCard**

Create `apps/frontend/src/features/org/components/dancer-table/dancer-card.tsx`:

```typescript
import { Heart } from "lucide-react";
import { Rating, RatingItem } from "@/components/ui/rating";
import type { DancerRow } from "./columns";

interface DancerCardProps {
  dancer: DancerRow & {
    isFavorited?: boolean;
    interestedInMySchool?: boolean;
    rating?: number | null;
    note?: string | null;
    hasNotes?: boolean;
  };
  onClick: () => void;
}

export function DancerCard({ dancer, onClick }: DancerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-card hover:bg-accent/50 flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">
          #{dancer.bibNumber != null ? String(dancer.bibNumber).padStart(2, "0") : "—"}
        </span>
        <div className="flex items-center gap-1.5">
          {dancer.isFavorited && (
            <Heart className="size-3.5 fill-current text-red-500" />
          )}
          {dancer.interestedInMySchool && (
            <span className="text-sm text-amber-500">★</span>
          )}
        </div>
      </div>
      <span className="truncate font-medium">
        {dancer.firstName} {dancer.lastName}
      </span>
      <span className="text-muted-foreground text-sm">
        {dancer.gradYear ?? "—"} · {dancer.studio ?? "—"} · {dancer.gpa != null ? dancer.gpa.toFixed(1) : "—"}
      </span>
      {dancer.note && (
        <span className="text-muted-foreground line-clamp-1 text-xs">
          ✎ {dancer.note}
        </span>
      )}
      {dancer.rating != null && (
        <Rating disabled size="sm" value={dancer.rating}>
          {Array.from({ length: 5 }, (_, i) => (
            <RatingItem key={i} index={i} />
          ))}
        </Rating>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Create DancerTable component**

Create `apps/frontend/src/features/org/components/dancer-table/dancer-table.tsx`:

This follows the exact pattern from `apps/frontend/src/features/favorites/components/favorites-table.tsx` — Frame+Table on desktop, card list on mobile, pagination footer with BaseUI Select.

```typescript
import type { ReactNode } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDownIcon, ChevronUpIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Frame, FrameFooter } from "@/components/ui/frame";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}

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
}: DancerTableProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? []);

  const table = useReactTable({
    columns,
    data,
    enableSortingRemoval: false,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    state: {
      pagination,
      sorting,
      globalFilter,
    },
  });

  const paginatedRows = table.getRowModel().rows;

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-2 sm:hidden">
        {isLoading ? (
          <div className="flex h-24 items-center justify-center gap-2">
            <Loader2Icon className="size-4 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : paginatedRows.length ? (
          paginatedRows.map((row) => (
            <div key={row.original.rosterId}>
              {renderCard(row.original)}
            </div>
          ))
        ) : (
          emptyState
        )}
      </div>

      {/* Desktop Table View */}
      <Frame className="hidden w-full sm:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const columnSize = header.column.getSize();
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        columnSize !== 150
                          ? { width: `${columnSize}px` }
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              header.column.getToggleSortingHandler()?.(e);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: <ChevronUpIcon className="size-4 shrink-0 opacity-80" />,
                            desc: <ChevronDownIcon className="size-4 shrink-0 opacity-80" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  <div className="flex h-full items-center justify-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedRows.length ? (
              paginatedRows.map((row) => (
                <TableRow
                  className="cursor-pointer"
                  key={row.id}
                  onClick={() => onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <FrameFooter className="p-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <p className="text-muted-foreground text-sm">Viewing</p>
              <Select
                items={Array.from({ length: table.getPageCount() }, (_, i) => {
                  const start = i * table.getState().pagination.pageSize + 1;
                  const end = Math.min(
                    (i + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  );
                  const pageNum = i + 1;
                  return { label: `${start}-${end}`, value: pageNum };
                })}
                onValueChange={(value) => {
                  table.setPageIndex((value as number) - 1);
                }}
                value={table.getState().pagination.pageIndex + 1}
              >
                <SelectTrigger className="min-w-none w-fit" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {Array.from({ length: table.getPageCount() }, (_, i) => {
                    const start = i * table.getState().pagination.pageSize + 1;
                    const end = Math.min(
                      (i + 1) * table.getState().pagination.pageSize,
                      table.getFilteredRowModel().rows.length
                    );
                    const pageNum = i + 1;
                    return (
                      <SelectItem key={pageNum} value={pageNum}>
                        {`${start}-${end}`}
                      </SelectItem>
                    );
                  })}
                </SelectPopup>
              </Select>
              <p className="text-muted-foreground text-sm">
                of{" "}
                <strong className="text-foreground font-medium">
                  {table.getFilteredRowModel().rows.length}
                </strong>{" "}
                results
              </p>
            </div>
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    render={
                      <Button
                        disabled={!table.getCanPreviousPage()}
                        onClick={() => table.previousPage()}
                        size="sm"
                        variant="outline"
                      />
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    render={
                      <Button
                        disabled={!table.getCanNextPage()}
                        onClick={() => table.nextPage()}
                        size="sm"
                        variant="outline"
                      />
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </FrameFooter>
      </Frame>
    </>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-table/
git commit -m "feat(frontend): add shared DancerTable with columns, cards, and pagination"
```

---

## Task 6: Frontend — DancerSheet (Side Sheet Quick View)

**Files:**
- Create: `apps/frontend/src/features/org/components/dancer-sheet.tsx`
- Modify: `apps/frontend/src/features/org/components/rating-input.tsx`

- [ ] **Step 1: Update RatingInput to use 1-5 star Rating component**

Replace the contents of `apps/frontend/src/features/org/components/rating-input.tsx`:

```typescript
import { Rating, RatingItem } from "@/components/ui/rating";
import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { useOptimistic, useTransition } from "react";

export function RatingInput({
  value,
  dancerRosterId,
}: {
  value: number | null;
  dancerRosterId: string;
}) {
  const { org } = useOrg();
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useOptimistic<number | null, number>(
    value,
    (_, next) => next
  );
  const [, startTransition] = useTransition();
  const mutate = $api.useMutation(
    "put",
    "/orgs/{slug}/dancers/{dancerRosterId}/rating"
  );

  const onSet = (n: number) => {
    navigator.vibrate?.(10);
    startTransition(async () => {
      setOptimistic(n);
      try {
        await mutate.mutateAsync({
          params: { path: { slug: org.slug, dancerRosterId } },
          body: { rating: n },
        });
        qc.invalidateQueries({
          queryKey: scoutingQueries.rankings(org.slug).queryKey,
        });
      } catch {
        // reverts on next render via refetch
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <Rating value={optimistic ?? 0} onValueChange={onSet}>
        {Array.from({ length: 5 }, (_, i) => (
          <RatingItem key={i} index={i} />
        ))}
      </Rating>
      {optimistic != null && (
        <span className="text-muted-foreground ml-2 text-sm">
          {optimistic}/5
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create DancerSheet**

Create `apps/frontend/src/features/org/components/dancer-sheet.tsx`:

```typescript
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon, Heart } from "lucide-react";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { FavoriteButton } from "./favorite-button";
import { RatingInput } from "./rating-input";
import { NotesEditor } from "./notes-editor";

interface DancerSheetProps {
  rosterId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DancerSheet({ rosterId, open, onOpenChange }: DancerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" variant="inset">
        {rosterId && open && (
          <DancerSheetContent rosterId={rosterId} />
        )}
      </SheetPopup>
    </Sheet>
  );
}

function DancerSheetContent({ rosterId }: { rosterId: string }) {
  const { org } = useOrg();
  const { data: dancer } = useSuspenseQuery(
    scoutingQueries.dancer(org.slug, rosterId)
  );

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-16 rounded-lg">
            <AvatarImage src={dancer.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="rounded-lg text-lg">
              {dancer.firstName?.[0]}
              {dancer.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <SheetTitle>
              {dancer.bibNumber != null && (
                <span className="text-muted-foreground mr-1.5 font-mono text-sm">
                  #{String(dancer.bibNumber).padStart(2, "0")}
                </span>
              )}
              {dancer.firstName} {dancer.lastName}
            </SheetTitle>
            <p className="text-muted-foreground text-sm">
              {[
                dancer.gradYear ? `Class of ${dancer.gradYear}` : null,
                dancer.studio,
                dancer.state,
                dancer.gpa != null ? `GPA ${dancer.gpa.toFixed(1)}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      </SheetHeader>

      <SheetContent className="px-4 py-3">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <FavoriteButton
              dancerRosterId={rosterId}
              isFavorited={dancer.isFavorited ?? false}
            />
            {dancer.interestedInMySchool && (
              <span className="text-muted-foreground flex items-center gap-1 text-sm">
                <span className="text-amber-500">★</span> Interested in your school
              </span>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Rating</label>
            <RatingInput
              value={dancer.rating ?? null}
              dancerRosterId={rosterId}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <NotesEditor
              dancerRosterId={rosterId}
              initial={dancer.note ?? null}
            />
          </div>

          {dancer.bio && (
            <div>
              <label className="text-sm font-medium">Bio</label>
              <p className="text-muted-foreground mt-1 text-sm">
                {dancer.bio}
              </p>
            </div>
          )}

          <Link
            to="/$username"
            params={{ username: dancer.username ?? "" }}
            className="text-primary flex items-center gap-1 text-sm hover:underline"
          >
            View Full Profile <ExternalLinkIcon className="size-3" />
          </Link>
        </div>
      </SheetContent>
    </>
  );
}
```

**Note:** The `dancer` object returned by `scoutingQueries.dancer()` includes `rating`, `note`, `isFavorited`, `bio`, and `username` fields from the existing `GetDancerByIdService`. The `interestedInMySchool` field will need to be added to that endpoint's response as well — follow the same EXISTS subquery pattern used in `ListDancersService`. If `username` is not yet on the response, the "View Full Profile" link can be conditionally rendered.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/dancer-sheet.tsx apps/frontend/src/features/org/components/rating-input.tsx
git commit -m "feat(frontend): add DancerSheet side panel with rating, notes, favorites"
```

---

## Task 7: Frontend — Update Coach Sidebar & Index Redirect

**Files:**
- Modify: `apps/frontend/src/features/org/components/coach-sidebar.tsx`
- Modify: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/index.tsx`

- [ ] **Step 1: Update sidebar to 4 nav items**

In `apps/frontend/src/features/org/components/coach-sidebar.tsx`, update the `navItems` array and add the CalendarIcon import:

Replace the imports line that has icons:
```typescript
import { CalendarIcon, HeartIcon, SearchIcon, TrophyIcon } from "lucide-react";
```

Replace the `navItems` array:
```typescript
const navItems = [
  { label: "Event Info", icon: CalendarIcon, to: "/$orgSlug/coach/event-info" },
  { label: "Search Dancers", icon: SearchIcon, to: "/$orgSlug/coach/dancers" },
  { label: "Favorites", icon: HeartIcon, to: "/$orgSlug/coach/favorites" },
  { label: "Rankings", icon: TrophyIcon, to: "/$orgSlug/coach/rankings" },
];
```

- [ ] **Step 2: Update index redirect to event-info**

Replace the contents of `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/index.tsx`:

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/coach/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/$orgSlug/coach/event-info",
      params: { orgSlug: params.orgSlug },
    });
  },
  component: () => null,
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/features/org/components/coach-sidebar.tsx apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/index.tsx
git commit -m "feat(frontend): update coach sidebar to 4 nav items, redirect to event-info"
```

---

## Task 8: Frontend — Dancer Search Page (Rewrite)

**Files:**
- Rewrite: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx`
- Create: `apps/frontend/src/features/org/components/dancer-search-form.tsx`

- [ ] **Step 1: Create DancerSearchForm**

Create `apps/frontend/src/features/org/components/dancer-search-form.tsx`:

```typescript
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  dancerSearchSchema,
  type DancerSearchForm as FormValues,
} from "@/features/org/api/scouting-schemas";
import { SearchIcon } from "lucide-react";

interface DancerSearchFormProps {
  schoolName: string | null;
  onSearchChange: (value: string) => void;
  onInterestedChange: (value: boolean) => void;
}

export function DancerSearchForm({
  schoolName,
  onSearchChange,
  onInterestedChange,
}: DancerSearchFormProps) {
  const { register, watch } = useForm<FormValues>({
    resolver: zodResolver(dancerSearchSchema),
    defaultValues: { search: "", interested: false },
  });

  const search = watch("search");
  const interested = watch("interested");

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          {...register("search", {
            onChange: (e) => onSearchChange(e.target.value),
          })}
          autoFocus
          placeholder="Search by name or bib #..."
          className="h-10 pl-9"
          inputMode="search"
        />
      </div>
      {schoolName && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={interested}
            onCheckedChange={(checked) => {
              onInterestedChange(checked === true);
            }}
          />
          Show only dancers interested in {schoolName}
        </label>
      )}
    </div>
  );
}
```

**Note:** The Checkbox component may use BaseUI patterns. Check `apps/frontend/src/components/ui/checkbox.tsx` for the exact API — if it uses a different prop than `onCheckedChange`, adjust accordingly.

- [ ] **Step 2: Rewrite dancers/index.tsx**

Replace the contents of `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx`:

```typescript
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useCallback, useState } from "react";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { DancerSearchForm } from "@/features/org/components/dancer-search-form";
import { useSearchColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { SearchDancerRow } from "@/features/org/components/dancer-table/columns";
import { $api } from "@/lib/api/client";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/dancers/"
)({
  component: DancerSearch,
});

function DancerSearch() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/dancers/",
  });
  const { org } = useOrg();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [interested, setInterested] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const { data: dancers, isPending } = useSuspenseQuery(
    scoutingQueries.dancers(orgSlug, { interested: interested || undefined })
  );
  const { data: favorites } = useSuspenseQuery(
    scoutingQueries.favorites(orgSlug)
  );

  const favoritedIds = new Set(
    Array.isArray(favorites) ? favorites.map((f) => f.rosterId) : []
  );

  const addFav = $api.useMutation("post", "/orgs/{slug}/favorites");
  const removeFav = $api.useMutation(
    "delete",
    "/orgs/{slug}/favorites/{dancerRosterId}"
  );

  const handleFavoriteToggle = useCallback(
    async (rosterId: string, current: boolean) => {
      if (current) {
        await removeFav.mutateAsync({
          params: { path: { slug: orgSlug, dancerRosterId: rosterId } },
        });
      } else {
        await addFav.mutateAsync({
          params: { path: { slug: orgSlug } },
          body: { dancerRosterId: rosterId },
        });
      }
      qc.invalidateQueries({
        queryKey: scoutingQueries.favorites(orgSlug).queryKey,
      });
      qc.invalidateQueries({
        queryKey: scoutingQueries.dancers(orgSlug).queryKey,
      });
    },
    [orgSlug, addFav, removeFav, qc]
  );

  const columns = useSearchColumns(handleFavoriteToggle);

  const tableData: SearchDancerRow[] = (dancers ?? []).map((d) => ({
    ...d,
    isFavorited: favoritedIds.has(d.rosterId),
    hasNotes: false,
    interestedInMySchool: d.interestedInMySchool ?? false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  const coachSchoolName = org.name;

  return (
    <div className="flex flex-col gap-4">
      <DancerSearchForm
        schoolName={coachSchoolName}
        onSearchChange={setSearch}
        onInterestedChange={setInterested}
      />

      <DancerTable<SearchDancerRow>
        data={tableData}
        columns={columns}
        isLoading={isPending}
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
        sorting={[{ id: "bibNumber", desc: false }]}
      />

      <DancerSheet
        rosterId={sheetRosterId}
        open={sheetRosterId !== null}
        onOpenChange={(open) => {
          if (!open) setSheetRosterId(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/index.tsx apps/frontend/src/features/org/components/dancer-search-form.tsx
git commit -m "feat(frontend): rewrite dancer search with TanStack Table, search form, side sheet"
```

---

## Task 9: Frontend — Favorites & Rankings Pages (Rewrite)

**Files:**
- Rewrite: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/favorites.tsx`
- Rewrite: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/rankings.tsx`

- [ ] **Step 1: Rewrite favorites.tsx**

Replace the contents of `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/favorites.tsx`:

```typescript
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { useFavoritesColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { FavoriteDancerRow } from "@/features/org/components/dancer-table/columns";
import { HeartIcon } from "lucide-react";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/favorites"
)({
  component: Favorites,
});

function Favorites() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/favorites",
  });
  const { data, isPending } = useSuspenseQuery(
    scoutingQueries.favorites(orgSlug)
  );

  const columns = useFavoritesColumns();

  const tableData: FavoriteDancerRow[] = (data ?? []).map((d) => ({
    ...d,
    rating: d.rating ?? null,
    hasNotes: false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">My Favorites</h1>
        <span className="text-muted-foreground text-sm">
          {data?.length ?? 0} {(data?.length ?? 0) === 1 ? "dancer" : "dancers"}
        </span>
      </div>

      <DancerTable<FavoriteDancerRow>
        data={tableData}
        columns={columns}
        isLoading={isPending}
        sorting={[{ id: "rating", desc: true }]}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-8">
            <HeartIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No favorites yet. Tap the heart on any dancer to add them here.
            </p>
            <Link
              to="/$orgSlug/coach/dancers"
              params={{ orgSlug }}
              className="text-primary text-sm hover:underline"
            >
              Search Dancers
            </Link>
          </div>
        }
        onRowClick={(row) => setSheetRosterId(row.rosterId)}
        renderCard={(row) => (
          <DancerCard
            dancer={{ ...row, isFavorited: true }}
            onClick={() => setSheetRosterId(row.rosterId)}
          />
        )}
      />

      <DancerSheet
        rosterId={sheetRosterId}
        open={sheetRosterId !== null}
        onOpenChange={(open) => {
          if (!open) setSheetRosterId(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Rewrite rankings.tsx**

Replace the contents of `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/rankings.tsx`:

```typescript
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast-manager";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { DancerTable } from "@/features/org/components/dancer-table/dancer-table";
import { DancerCard } from "@/features/org/components/dancer-table/dancer-card";
import { DancerSheet } from "@/features/org/components/dancer-sheet";
import { useRankingsColumns } from "@/features/org/components/dancer-table/use-dancer-columns";
import type { RankedDancerRow } from "@/features/org/components/dancer-table/columns";
import { ClipboardCopyIcon, TrophyIcon } from "lucide-react";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/rankings"
)({
  component: Rankings,
});

function Rankings() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/rankings",
  });
  const { data, isPending } = useSuspenseQuery(
    scoutingQueries.rankings(orgSlug)
  );

  const columns = useRankingsColumns();

  const tableData: RankedDancerRow[] = (data ?? []).map((d) => ({
    ...d,
    rating: d.rating ?? null,
    note: d.note ?? null,
    isFavorited: d.isFavorited ?? false,
  }));

  const [sheetRosterId, setSheetRosterId] = useState<string | null>(null);

  const copyNotes = async () => {
    const text = (data ?? [])
      .filter((d) => d.note)
      .map(
        (d) =>
          `#${d.bibNumber ?? "—"} ${d.firstName} ${d.lastName}${d.rating != null ? ` (${d.rating}/5)` : ""}\n${d.note}`
      )
      .join("\n\n");
    if (!text) {
      toastManager.add({ title: "No notes to copy yet.", type: "info" });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toastManager.add({ title: "Notes copied to clipboard", type: "success" });
    } catch {
      toastManager.add({ title: "Could not copy to clipboard", type: "error" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Rankings</h1>
          <p className="text-muted-foreground text-sm">
            {data?.length ?? 0} {(data?.length ?? 0) === 1 ? "dancer" : "dancers"} scouted
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={copyNotes}>
          <ClipboardCopyIcon className="mr-1.5 size-3.5" />
          Copy Notes
        </Button>
      </div>

      <DancerTable<RankedDancerRow>
        data={tableData}
        columns={columns}
        isLoading={isPending}
        sorting={[{ id: "rating", desc: true }]}
        emptyState={
          <div className="flex flex-col items-center gap-2 py-8">
            <TrophyIcon className="text-muted-foreground size-8" />
            <p className="text-muted-foreground text-sm">
              No ratings yet. Rate dancers from the search list to build your rankings.
            </p>
          </div>
        }
        onRowClick={(row) => setSheetRosterId(row.rosterId)}
        renderCard={(row) => (
          <DancerCard
            dancer={row}
            onClick={() => setSheetRosterId(row.rosterId)}
          />
        )}
      />

      <DancerSheet
        rosterId={sheetRosterId}
        open={sheetRosterId !== null}
        onOpenChange={(open) => {
          if (!open) setSheetRosterId(null);
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/favorites.tsx apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/rankings.tsx
git commit -m "feat(frontend): rewrite favorites and rankings pages with DancerTable"
```

---

## Task 10: Frontend — Event Info Landing Page

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/event-info.tsx`

This page uses the admin dashboard as inspiration for layout density. Reference:
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/index.tsx` for stat cells, event header, and sidebar layout
- `apps/frontend/src/features/org/hooks/use-event-phase.ts` for `useEventPhase()` hook (already exists)

- [ ] **Step 1: Create event-info.tsx**

Create `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/event-info.tsx`:

```typescript
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  CalendarIcon,
  ExternalLinkIcon,
  HeartIcon,
  MailIcon,
  MapPinIcon,
  SearchIcon,
  TrophyIcon,
  FileTextIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Frame, FramePanel } from "@/components/ui/frame";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import { useOrg } from "@/features/org/context/use-org";
import { useEventPhase } from "@/features/org/hooks/use-event-phase";
import { orgQueries } from "@/features/org/api/queries";

export const Route = createFileRoute(
  "/_org/$orgSlug/_authenticated/coach/event-info"
)({
  component: EventInfo,
});

function EventInfo() {
  const { orgSlug } = useParams({
    from: "/_org/$orgSlug/_authenticated/coach/event-info",
  });
  const { org } = useOrg();
  const { data: orgData } = useSuspenseQuery(orgQueries.org(orgSlug));
  const event = (orgData as any).event;

  const { data: dancers } = useSuspenseQuery(
    scoutingQueries.dancers(orgSlug)
  );
  const { data: favorites } = useSuspenseQuery(
    scoutingQueries.favorites(orgSlug)
  );

  const phase = event
    ? useEventPhase(event.startDate, event.endDate)
    : null;

  const dancerCount = dancers?.length ?? 0;
  const favCount = favorites?.length ?? 0;

  if (!event) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No active event.
      </div>
    );
  }

  const phaseBadge = {
    upcoming: "bg-blue-100 text-blue-700",
    imminent: "bg-amber-100 text-amber-700",
    live: "bg-emerald-100 text-emerald-700",
    wrapped: "bg-zinc-100 text-zinc-600",
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto xl:flex-row xl:overflow-hidden">
      {/* Main content */}
      <div className="flex min-w-0 flex-col gap-4 xl:flex-1 xl:overflow-y-auto">
        {/* Event header */}
        <div>
          <h1 className="text-2xl font-semibold">{event.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            {phase && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${phaseBadge[phase.phase]}`}
              >
                {phase.phase === "live" ? "● Live" : phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)}
              </span>
            )}
            <span className="text-muted-foreground text-sm">
              {event.startDate} – {event.endDate}
            </span>
          </div>
        </div>

        {/* Stat cells */}
        <div className="border-border grid grid-cols-3 divide-x border-y">
          <StatCell label="Dancers" value={dancerCount} />
          <StatCell label="Schools" value="—" />
          <StatCell label="Your Favorites" value={favCount} />
        </div>

        {/* Schedule */}
        <Frame>
          <FramePanel>
            <h2 className="mb-3 text-sm font-semibold">Event Schedule</h2>
            {event.schedulePdfUrl ? (
              <iframe
                src={event.schedulePdfUrl}
                className="h-[500px] w-full rounded-lg border"
                title="Event Schedule"
              />
            ) : (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Schedule coming soon.
              </p>
            )}
          </FramePanel>
        </Frame>

        {/* Quick links */}
        <Frame>
          <FramePanel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuickLink
                to="/$orgSlug/coach/dancers"
                params={{ orgSlug }}
                icon={SearchIcon}
                label="Search Dancers"
              />
              <QuickLink
                to="/$orgSlug/coach/favorites"
                params={{ orgSlug }}
                icon={HeartIcon}
                label="My Favorites"
              />
              <QuickLink
                to="/$orgSlug/coach/rankings"
                params={{ orgSlug }}
                icon={TrophyIcon}
                label="My Rankings"
              />
              <Button variant="outline" className="h-10 gap-2" asChild>
                <a href="https://studio2stadium.com/settings" target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="size-4" />
                  Edit Profile
                </a>
              </Button>
            </div>
          </FramePanel>
        </Frame>
      </div>

      {/* Right sidebar */}
      <aside className="w-full border-t p-4 xl:w-80 xl:shrink-0 xl:overflow-y-auto xl:border-t-0 xl:border-l">
        <div className="flex flex-col gap-6">
          {/* Countdown */}
          {phase && (
            <div>
              <p className="text-2xl font-bold tabular-nums">{phase.label}</p>
              {phase.phase === "live" && phase.totalDays > 1 && (
                <div className="mt-2">
                  <div className="bg-muted h-1.5 rounded-full">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all"
                      style={{
                        width: `${((phase.liveDay ?? 1) / phase.totalDays) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {Math.round(((phase.liveDay ?? 1) / phase.totalDays) * 100)}% complete
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Details</h3>
            <div className="text-muted-foreground flex items-start gap-2 text-sm">
              <CalendarIcon className="mt-0.5 size-4 shrink-0" />
              <span>{event.startDate} – {event.endDate}</span>
            </div>
            {event.venueName && (
              <div className="text-muted-foreground flex items-start gap-2 text-sm">
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p>{event.venueName}</p>
                  {event.venueAddress && (
                    <p className="text-xs">{event.venueAddress}</p>
                  )}
                </div>
              </div>
            )}
            {event.contactEmail && (
              <div className="text-muted-foreground flex items-start gap-2 text-sm">
                <MailIcon className="mt-0.5 size-4 shrink-0" />
                <a href={`mailto:${event.contactEmail}`} className="hover:underline">
                  {event.contactEmail}
                </a>
              </div>
            )}
            {event.schedulePdfUrl && (
              <div className="text-muted-foreground flex items-start gap-2 text-sm">
                <FileTextIcon className="mt-0.5 size-4 shrink-0" />
                <a
                  href={event.schedulePdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Download schedule PDF
                </a>
              </div>
            )}
          </div>

          {/* Coach program card */}
          <div className="rounded-lg border p-3">
            <h3 className="text-sm font-semibold">Your Program</h3>
            <div className="mt-2 flex items-center gap-2">
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="size-8 rounded object-contain"
                />
              ) : (
                <div className="bg-primary flex size-8 items-center justify-center rounded text-sm font-semibold text-white">
                  {org.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">{org.name}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-3">
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function QuickLink({
  to,
  params,
  icon: Icon,
  label,
}: {
  to: string;
  params: Record<string, string>;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Button variant="outline" className="h-10 gap-2" asChild>
      <Link to={to} params={params as any}>
        <Icon className="size-4" />
        {label}
      </Link>
    </Button>
  );
}
```

**Important note:** The `event` object access pattern (`orgData.event`) depends on what `orgQueries.org()` returns. Check the actual response shape — the active event data may come from a different query. If `orgQueries.org()` doesn't include the event, you'll need to add a new `adminQueries.activeEvent(orgSlug)` or similar query. The event data needed is: `name`, `startDate`, `endDate`, `venueName`, `venueAddress`, `contactEmail`, `schedulePdfUrl`.

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/event-info.tsx
git commit -m "feat(frontend): add event info landing page with stats, schedule, sidebar"
```

---

## Task 11: Frontend — School Selection Picker (Dancer Portal)

**Files:**
- Create: `apps/frontend/src/features/org/components/school-selection-picker.tsx`

This component is used in the dancer portal (not coach portal). It will be placed in a dancer route — the exact route path depends on the dancer portal structure. For now, build the component; it can be wired into the dancer route separately.

- [ ] **Step 1: Create SchoolSelectionPicker**

Create `apps/frontend/src/features/org/components/school-selection-picker.tsx`:

```typescript
import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Frame, FramePanel, FrameHeader, FrameTitle } from "@/components/ui/frame";
import { toastManager } from "@/components/ui/toast-manager";
import { scoutingQueries } from "@/features/org/api/scouting-queries";
import {
  useAddSchoolSelection,
  useRemoveSchoolSelection,
} from "@/features/org/api/scouting-mutations";
import { useOrg } from "@/features/org/context/use-org";
import { CheckIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";

export function SchoolSelectionPicker() {
  const { org } = useOrg();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: schools } = useSuspenseQuery(
    scoutingQueries.schools(org.slug)
  );
  const { data: selections } = useSuspenseQuery(
    scoutingQueries.mySelections(org.slug)
  );

  const addSelection = useAddSchoolSelection(org.slug);
  const removeSelection = useRemoveSchoolSelection(org.slug);

  const selectedIds = new Set(
    (selections ?? []).map((s) => s.coachRosterId)
  );

  const filteredSchools = (schools ?? []).filter((s) =>
    (s.organization ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (coachRosterId: string) => {
    if ((selections ?? []).length >= 3) {
      toastManager.add({
        title: "Remove one to add another.",
        description: "You can only select up to 3 schools.",
        type: "error",
      });
      return;
    }
    await addSelection.mutateAsync({
      params: { path: { slug: org.slug } },
      body: { coachRosterId },
    });
  };

  const handleRemove = async (selectionId: string) => {
    await removeSelection.mutateAsync({
      params: { path: { slug: org.slug, id: selectionId } },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">My Top 3 Schools</h1>
        <p className="text-muted-foreground text-sm">
          Select up to 3 programs you're interested in. Your selections are completely private.
        </p>
      </div>

      {/* Selected schools */}
      <Frame>
        <FrameHeader>
          <FrameTitle>
            Selected ({(selections ?? []).length} of 3)
          </FrameTitle>
        </FrameHeader>
        <FramePanel>
          <div className="flex flex-wrap gap-2">
            {(selections ?? []).map((s) => (
              <div
                key={s.id}
                className="bg-muted flex items-center gap-1.5 rounded-full py-1 pr-1 pl-3 text-sm font-medium"
              >
                {s.organization}
                <button
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove ${s.organization}`}
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
            {(selections ?? []).length < 3 && (
              <span className="text-muted-foreground flex items-center text-sm">
                + {3 - (selections ?? []).length} slot{(selections ?? []).length < 2 ? "s" : ""} remaining
              </span>
            )}
          </div>
        </FramePanel>
      </Frame>

      {/* Search + list */}
      <Frame>
        <FrameHeader>
          <FrameTitle>All Programs</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <SearchIcon className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programs..."
                className="h-10 pl-9"
              />
            </div>
            <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {filteredSchools.map((school) => {
                const isSelected = selectedIds.has(school.rosterId);
                const selection = (selections ?? []).find(
                  (s) => s.coachRosterId === school.rosterId
                );
                return (
                  <div
                    key={school.rosterId}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent/50"
                  >
                    <span className="text-sm">{school.organization ?? "Unknown"}</span>
                    {isSelected ? (
                      <span className="text-muted-foreground flex items-center gap-1 text-sm">
                        <CheckIcon className="size-4" />
                        Added
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => handleAdd(school.rosterId)}
                        disabled={(selections ?? []).length >= 3}
                      >
                        <PlusIcon className="mr-1 size-3.5" />
                        Add
                      </Button>
                    )}
                  </div>
                );
              })}
              {filteredSchools.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No programs found.
                </p>
              )}
            </div>
          </div>
        </FramePanel>
      </Frame>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/features/org/components/school-selection-picker.tsx
git commit -m "feat(frontend): add school selection picker for dancer Top 3"
```

---

## Task 12: Type Regeneration & Integration Testing

- [ ] **Step 1: Ensure backend runs and generates docs**

```bash
cd apps/backend && pnpm make:docs
```

Expected: OpenAPI spec regenerated with all new endpoints.

- [ ] **Step 2: Regenerate frontend types**

```bash
cd apps/frontend && pnpm types
```

Expected: `apps/frontend/src/lib/api/types.d.ts` updated with new response/request types.

- [ ] **Step 3: Type check frontend**

```bash
cd apps/frontend && pnpm build
```

Expected: Build succeeds with no TypeScript errors. If there are type mismatches (e.g., a field name doesn't match between the generated types and the component code), fix them now.

- [ ] **Step 4: Type check backend**

```bash
cd apps/backend && pnpm typecheck
```

Expected: No TypeScript errors.

- [ ] **Step 5: Run backend tests**

```bash
cd apps/backend && pnpm test
```

Expected: All existing tests pass. The dancer list service test may need updating if it validates the response shape (now includes `interestedInMySchool`).

- [ ] **Step 6: Commit any type fixes**

```bash
git add -A
git commit -m "fix: resolve type mismatches after OpenAPI regeneration"
```

---

## Task 13: Clean Up — Remove Unused Files

After all pages are rewritten, clean up files that are no longer used.

- [ ] **Step 1: Remove old dancer detail route**

The old `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/$rosterId.tsx` is no longer needed (we use the DancerSheet side panel instead). Delete it:

```bash
rm apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/dancers/\$rosterId.tsx
```

- [ ] **Step 2: Check for unused DancerCard component**

The old `apps/frontend/src/features/org/components/dancer-card.tsx` was used by the previous card-grid layout. If it's only imported by the old route files (now rewritten), delete it. Check first:

```bash
grep -r "dancer-card" apps/frontend/src/ --include="*.tsx" --include="*.ts" -l
```

If no remaining imports, delete it.

- [ ] **Step 3: Check for unused bib quick jump hook**

```bash
grep -r "use-bib-quick-jump" apps/frontend/src/ --include="*.tsx" --include="*.ts" -l
```

If no remaining imports, delete it.

- [ ] **Step 4: Commit cleanup**

```bash
git add -A
git commit -m "chore: remove unused coach portal files after rewrite"
```

---

## Task 14: Manual QA Checklist

This is not code — it's a verification checklist to run in the browser after starting the dev server (`pnpm dev` from the monorepo root).

- [ ] **Step 1: Login as a coach and verify landing page**
  - Navigate to `/<orgSlug>/login`, log in as a coach
  - Verify redirect to `/<orgSlug>/coach/event-info`
  - Verify stat cards show correct dancer/favorites counts
  - Verify event details in sidebar (name, date, venue)
  - Verify schedule PDF embedded (or "coming soon" fallback)
  - Verify quick links navigate correctly

- [ ] **Step 2: Test dancer search**
  - Click "Search Dancers" → verify table loads in Frame
  - Type a name → verify debounced filtering works
  - Type a bib number → verify exact match
  - Toggle "Interested in [School]" filter
  - Click a row → verify side sheet opens
  - On mobile viewport → verify card list renders instead of table

- [ ] **Step 3: Test scouting actions in sheet**
  - Click star rating → verify saves immediately
  - Type notes → verify autosave after 2s
  - Click favorite heart → verify toggles
  - Click "View Full Profile" → verify navigates to `/$username`
  - Close sheet → verify scroll position preserved

- [ ] **Step 4: Test favorites page**
  - Navigate to Favorites → verify favorited dancers appear
  - Verify rating stars display inline
  - Click row → verify sheet opens
  - Unfavorite from sheet → verify dancer removed from list

- [ ] **Step 5: Test rankings page**
  - Navigate to Rankings → verify ranked dancers sorted by rating
  - Verify rank numbers (#1, #2, etc.)
  - Click "Copy Notes" → verify clipboard content
  - Click row → verify sheet opens

- [ ] **Step 6: Test responsive behavior**
  - Resize to mobile → verify all pages switch to card view
  - Verify buttons/inputs maintain consistent height
  - Verify sidebar collapses to hamburger

---

## Dependency Graph

```
Task 1  (DB schema)
  ↓
Task 2  (Selection endpoints)
  ↓
Task 3  (Modify dancer list + rating validator + type regen)
  ↓
Task 4  (Frontend API layer)
  ↓
Task 5  (DancerTable component)  ←── can start after Task 4
  ↓
Task 6  (DancerSheet)            ←── can start after Task 4
  ↓
Task 7  (Sidebar + redirect)     ←── independent, can start after Task 4
  ↓
Task 8  (Search page)            ←── needs Tasks 5, 6
  ↓
Task 9  (Favorites + Rankings)   ←── needs Tasks 5, 6
  ↓
Task 10 (Event Info page)        ←── needs Task 7
  ↓
Task 11 (School picker)          ←── needs Task 4
  ↓
Task 12 (Type regen + integration) ←── needs all above
  ↓
Task 13 (Cleanup)
  ↓
Task 14 (Manual QA)
```

Tasks 5, 6, 7, 10, 11 can be parallelized after Task 4 completes.
