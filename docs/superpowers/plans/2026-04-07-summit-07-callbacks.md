# Summit Plan 07 — Callbacks (Feature-Gated)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Let coaches mark dancers for callback during an event, and give admins a real-time deduplicated list of bib numbers to announce. Entire feature is behind `features.callbacks`.

**Architecture:** One table (`event_callbacks`), structurally identical to `event_favorites` but semantically distinct (favorites = "I like this dancer," callbacks = "we are asking this dancer to come back for round 2"). Coach endpoints mirror the favorites pattern. Admin dashboard endpoint returns a deduplicated list of bib numbers with the count of coaches who selected each.

**Tech Stack:** Adonis 6, Drizzle, VineJS, React 19 with TanStack Query real-time polling.

**Source spec sections:** 3 (event_callbacks), 4 (feature-gated routes).

**Depends on:** Plans 01, 02, 03, 04 (coach routing pattern).

---

## UX Concerns Folded In

- **Callback button is next to the favorite button on the dancer profile.** Visually distinct (filled megaphone icon vs heart), different color (`--org-accent` vs a warmer callback color sourced from `org.settings.callback_color` with a sensible default).
- **Optimistic toggle with haptic.** Same pattern as favorites — tap, vibrate, mutate, revert on failure.
- **Admin live board.** Admin dashboard polls every 5s during the event to show an updating list of callback bibs. Real-time via polling is fine — we don't need websockets for an event-hour tool.
- **Deduplicated view with coach-count affordance.** Each bib shows `#42 · 3 coaches` so the admin knows how many coaches independently agreed.
- **Printable fallback.** Admin view has a "Print board" button that opens a print-friendly layout — dance event organizers sometimes want a paper handoff to the MC.
- **Feature gate is invisible.** If `features.callbacks === false` everywhere — coach nav hides the link, dancer profile doesn't render the button, admin dashboard card is absent, all backend routes 404.

---

## File Map

**Backend create:**
- `apps/backend/app/database/schema/event_callbacks.ts`
- `apps/backend/app/modules/orgs/callbacks/{create,delete,list}/*`
- `apps/backend/app/modules/orgs/callbacks/admin-board/*`
- `apps/backend/app/modules/orgs/callbacks/routes.ts`

**Backend modify:**
- `apps/backend/app/database/schema/index.ts`
- `apps/backend/app/modules/orgs/routes.ts`

**Frontend create:**
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/callbacks.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`
- `apps/frontend/src/features/org/components/callback-button.tsx`
- `apps/frontend/src/features/org/components/callback-board.tsx`
- `apps/frontend/src/features/org/api/callback-queries.ts`

**Frontend modify:**
- `apps/frontend/src/features/org/components/dancer-profile.tsx` — add callback button alongside favorite (Plan 04's profile component)
- nav components — add callback link behind `hasFeature("callbacks")`

---

## Task 1: Schema

- [ ] **Step 1: Create the schema file**

```typescript
// apps/backend/app/database/schema/event_callbacks.ts
import * as pg from "drizzle-orm/pg-core";
import { timestamps } from "./helpers/columns.ts";
import { orgEvents, eventRosters } from "./org_events.ts";

export const eventCallbacks = pg.pgTable(
  "event_callbacks",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg.uuid().notNull().references(() => orgEvents.id, { onDelete: "cascade" }),
    coachRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    dancerRosterId: pg.uuid().notNull().references(() => eventRosters.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.eventId, table.coachRosterId, table.dancerRosterId),
    pg.index().on(table.eventId, table.dancerRosterId),
    pg.index().on(table.coachRosterId),
  ]
);
```

- [ ] **Step 2: Barrel-export + migration + commit**

---

## Task 2: Coach callback endpoints (create, delete, list)

**Files:**
- Create: `apps/backend/app/modules/orgs/callbacks/{create,delete,list}/*`
- Test: `apps/backend/app/modules/orgs/callbacks/create/service.test.ts`

Same pattern as Plan 04's favorites. Key differences:
- All routes gated by `middleware.orgFeature("callbacks")`.
- `coach_roster_id` resolved from `ctx.orgRoster.id` — never accepted from client.
- Unique constraint makes `POST` idempotent.

- [ ] **Step 1: Failing test**

```typescript
// apps/backend/app/modules/orgs/callbacks/create/service.test.ts
test.group("POST /orgs/:slug/callbacks", (group) => {
  group.each.setup(async () => { await db.delete(eventCallbacks).execute(); });

  test("coach can add a callback", async ({ client, assert }) => {
    // Setup summit org with callbacks feature on, event, coach with roster, dancer with roster
    // POST { dancerRosterId } → 201
    // Row exists with correct coachRosterId from session
  });

  test("duplicate POST returns 200 (idempotent)", async ({ client }) => { /* ... */ });

  test("when org.features.callbacks is false the route 404s", async ({ client }) => {
    // Disable feature on a test org, expect 404 on the endpoint
  });

  test("non-coach member rejected 403", async ({ client }) => { /* ... */ });
});
```

- [ ] **Step 2: Implement validator, service, controller**

```typescript
// apps/backend/app/modules/orgs/callbacks/create/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(vine.object({
  dancerRosterId: vine.string().uuid(),
}));
export type Validator = Infer<typeof schema>;
```

```typescript
// apps/backend/app/modules/orgs/callbacks/create/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event_callbacks";
import { eventRosters } from "#database/schema/org_events";
import { and, eq } from "drizzle-orm";

@inject()
export class CreateCallbackService {
  constructor(private db: DatabaseService) {}

  async execute({ eventId, coachRosterId, dancerRosterId }: {
    eventId: string; coachRosterId: string; dancerRosterId: string;
  }) {
    return this.db.tx(async (tx) => {
      // Verify dancer belongs to same event
      const [dancer] = await tx.select({ id: eventRosters.id, type: eventRosters.type, eventId: eventRosters.eventId })
        .from(eventRosters).where(eq(eventRosters.id, dancerRosterId)).limit(1);
      if (!dancer || dancer.eventId !== eventId || dancer.type !== "dancer") {
        throw new Error("Invalid dancer");
      }
      await tx.insert(eventCallbacks).values({ eventId, coachRosterId, dancerRosterId })
        .onConflictDoNothing({
          target: [eventCallbacks.eventId, eventCallbacks.coachRosterId, eventCallbacks.dancerRosterId],
        });
      const [row] = await tx.select().from(eventCallbacks)
        .where(and(
          eq(eventCallbacks.eventId, eventId),
          eq(eventCallbacks.coachRosterId, coachRosterId),
          eq(eventCallbacks.dancerRosterId, dancerRosterId),
        ));
      return row;
    });
  }
}
```

```typescript
// apps/backend/app/modules/orgs/callbacks/create/controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { CreateCallbackService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateCallbackController {
  @inject()
  async handle(ctx: HttpContext, service: CreateCallbackService) {
    const payload = await ctx.request.validateUsing(schema);
    try {
      const row = await service.execute({
        eventId: ctx.orgEvent!.id,
        coachRosterId: ctx.orgRoster!.id,
        dancerRosterId: payload.dancerRosterId,
      });
      return ctx.response.ok(row);
    } catch (err) {
      return ctx.response.badRequest({ message: (err as Error).message });
    }
  }
}
```

- [ ] **Step 3: Delete + list services**

`DELETE /orgs/:slug/callbacks/:dancerRosterId` — removes by `(coachRosterId, dancerRosterId)`.

`GET /orgs/:slug/callbacks` — returns the coach's own callbacks, joined with dancer roster/profile info.

- [ ] **Step 4: Routes**

```typescript
// apps/backend/app/modules/orgs/callbacks/routes.ts
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";

const Create = () => import("./create/controller.ts");
const Delete = () => import("./delete/controller.ts");
const List = () => import("./list/controller.ts");
const AdminBoard = () => import("./admin-board/controller.ts");

const coachStack = [
  middleware.auth(), middleware.org(), middleware.orgEvent(),
  middleware.orgMember(), middleware.orgCoach(),
  middleware.orgFeature("callbacks"),
];
const adminStack = [
  middleware.auth(), middleware.org(), middleware.orgEvent(),
  middleware.orgMember(), middleware.orgAdmin(),
  middleware.orgFeature("callbacks"),
];

router.group(() => {
  router.post(":slug/callbacks", [Create]).use(coachStack);
  router.delete(":slug/callbacks/:dancerRosterId", [Delete]).use(coachStack);
  router.get(":slug/callbacks", [List]).use(coachStack);
  router.get(":slug/admin/callbacks", [AdminBoard]).use(adminStack);
}).prefix("orgs").openapi({ tags: ["Org Callbacks"] });
```

Import from `apps/backend/app/modules/orgs/routes.ts`.

- [ ] **Step 5: Run tests + commit**

---

## Task 3: Admin callback board endpoint

**Files:**
- Create: `apps/backend/app/modules/orgs/callbacks/admin-board/{service,controller}.ts`

Returns: list of dancers grouped by bib, each entry `{ dancerRosterId, bibNumber, firstName, lastName, coachCount }`, sorted by bib ascending. Deduplicated — a dancer selected by 3 coaches appears once with `coachCount: 3`.

- [ ] **Step 1: Failing test**

```typescript
// apps/backend/app/modules/orgs/callbacks/admin-board/service.test.ts
// Case: 2 coaches callback dancer A, 1 coach callbacks dancer B
// Expected response:
// [ { bibNumber: <A.bib>, coachCount: 2, ... }, { bibNumber: <B.bib>, coachCount: 1, ... } ]
// Sorted by bib ascending.
```

- [ ] **Step 2: Service**

```typescript
// apps/backend/app/modules/orgs/callbacks/admin-board/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventCallbacks } from "#database/schema/event_callbacks";
import { eventRosters } from "#database/schema/org_events";
import { asc, count, eq, sql } from "drizzle-orm";

@inject()
export class AdminCallbackBoardService {
  constructor(private db: DatabaseService) {}

  async execute(eventId: string) {
    return this.db.use((db) =>
      db
        .select({
          dancerRosterId: eventCallbacks.dancerRosterId,
          bibNumber: eventRosters.bibNumber,
          firstName: eventRosters.firstName,
          lastName: eventRosters.lastName,
          coachCount: count(eventCallbacks.id),
        })
        .from(eventCallbacks)
        .innerJoin(eventRosters, eq(eventRosters.id, eventCallbacks.dancerRosterId))
        .where(eq(eventCallbacks.eventId, eventId))
        .groupBy(
          eventCallbacks.dancerRosterId,
          eventRosters.bibNumber,
          eventRosters.firstName,
          eventRosters.lastName
        )
        .orderBy(asc(eventRosters.bibNumber))
    );
  }
}
```

- [ ] **Step 3: Controller + run tests + commit**

---

## Task 4: Frontend queries + callback button

**Files:**
- Create: `apps/frontend/src/features/org/api/callback-queries.ts`
- Create: `apps/frontend/src/features/org/components/callback-button.tsx`

```typescript
// apps/frontend/src/features/org/api/callback-queries.ts
import { $api } from "@/lib/api/client";

export const callbackQueries = {
  mine: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/callbacks", { params: { path: { slug } } }),
  board: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/admin/callbacks", {
      params: { path: { slug } },
    }),
};
```

```tsx
// apps/frontend/src/features/org/components/callback-button.tsx
import { Megaphone } from "lucide-react";
import { $api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/features/org/context/use-org";
import { callbackQueries } from "@/features/org/api/callback-queries";
import { scoutingQueries } from "@/features/org/api/scouting-queries";

export function CallbackButton({
  dancerRosterId, isCallback,
}: { dancerRosterId: string; isCallback: boolean }) {
  const { org, hasFeature } = useOrg();
  const qc = useQueryClient();
  if (!hasFeature("callbacks")) return null;

  const create = $api.useMutation("post", "/orgs/{slug}/callbacks");
  const remove = $api.useMutation("delete", "/orgs/{slug}/callbacks/{dancerRosterId}");

  async function toggle() {
    navigator.vibrate?.(15);
    const next = !isCallback;
    qc.setQueryData(scoutingQueries.dancer(org.slug, dancerRosterId).queryKey,
      (old: any) => (old ? { ...old, isCallback: next } : old));
    try {
      if (isCallback) {
        await remove.mutateAsync({
          params: { path: { slug: org.slug, dancerRosterId } },
        });
      } else {
        await create.mutateAsync({
          params: { path: { slug: org.slug } },
          body: { dancerRosterId },
        });
      }
      qc.invalidateQueries({ queryKey: callbackQueries.mine(org.slug).queryKey });
    } catch {
      qc.setQueryData(scoutingQueries.dancer(org.slug, dancerRosterId).queryKey,
        (old: any) => (old ? { ...old, isCallback } : old));
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
      style={{
        background: isCallback ? "#f59e0b" : "rgba(255,255,255,0.1)",
        color: isCallback ? "#000" : "inherit",
      }}
      aria-pressed={isCallback}
    >
      <Megaphone className="size-4" />
      {isCallback ? "Called back" : "Callback"}
    </button>
  );
}
```

- [ ] **Build + commit**

---

## Task 5: Frontend — add callback button to dancer profile

**Files:**
- Modify: `apps/frontend/src/features/org/components/dancer-profile.tsx` (from Plan 04)

Add a row with `FavoriteButton` and `CallbackButton` side by side on the profile. Pass `isCallback` from the dancer-by-id endpoint (extend Plan 04's Task 3 service to include it).

- [ ] **Commit**

---

## Task 6: Frontend — coach callbacks list page

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/callbacks.tsx`

Uses `callbackQueries.mine(slug)` to show the coach's own callbacks. Same list layout as favorites. Hide the page entirely via route-level gating if `hasFeature("callbacks")` is false.

```tsx
// apps/frontend/src/routes/_org/$orgSlug/_authenticated/coach/callbacks.tsx
import { createFileRoute, redirect, useParams } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { callbackQueries } from "@/features/org/api/callback-queries";
import { DancerCard } from "@/features/org/components/dancer-card";
import { orgQueries } from "@/features/org/api/queries";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/coach/callbacks")({
  beforeLoad: async ({ context, params }) => {
    const org = await context.queryClient.ensureQueryData(orgQueries.org(params.orgSlug));
    const features = (org.features ?? {}) as Record<string, boolean>;
    if (!features.callbacks) {
      throw redirect({ to: "/$orgSlug/coach", params: { orgSlug: params.orgSlug } });
    }
  },
  component: CallbacksPage,
});

function CallbacksPage() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/_authenticated/coach/callbacks" });
  const { data } = useSuspenseQuery(callbackQueries.mine(orgSlug));
  return (
    <main className="mx-auto max-w-xl space-y-4 p-5 text-white">
      <h1 className="text-2xl font-bold">My callbacks</h1>
      {data.length === 0 ? (
        <p className="py-12 text-center opacity-60">You haven't called back any dancers yet.</p>
      ) : (
        data.map((d: any) => <DancerCard key={d.rosterId} dancer={d} slug={orgSlug} />)
      )}
    </main>
  );
}
```

- [ ] **Commit**

---

## Task 7: Frontend — admin callback board with live polling

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx`
- Create: `apps/frontend/src/features/org/components/callback-board.tsx`

```tsx
// apps/frontend/src/features/org/components/callback-board.tsx
import { useQuery } from "@tanstack/react-query";
import { callbackQueries } from "@/features/org/api/callback-queries";

export function CallbackBoard({ slug }: { slug: string }) {
  const { data } = useQuery({
    ...callbackQueries.board(slug),
    refetchInterval: 5000,
  });
  if (!data) return null;
  return (
    <div className="space-y-2">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Callback board</h1>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-white/10 px-4 py-2 text-sm print:hidden"
        >
          Print
        </button>
      </header>
      <p className="text-sm opacity-60 print:hidden">Updates every 5 seconds.</p>
      <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/5">
        {data.length === 0 && <li className="p-5 opacity-60">No callbacks yet.</li>}
        {data.map((row: any) => (
          <li key={row.dancerRosterId} className="flex items-center justify-between p-4">
            <span className="text-xl font-bold tabular-nums">#{row.bibNumber}</span>
            <span className="flex-1 px-4 truncate">{row.firstName} {row.lastName}</span>
            <span className="text-sm opacity-70">{row.coachCount} coach{row.coachCount === 1 ? "" : "es"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/callbacks.tsx
import { createFileRoute, redirect, useParams } from "@tanstack/react-router";
import { orgQueries } from "@/features/org/api/queries";
import { CallbackBoard } from "@/features/org/components/callback-board";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/admin/callbacks")({
  beforeLoad: async ({ context, params }) => {
    const org = await context.queryClient.ensureQueryData(orgQueries.org(params.orgSlug));
    const features = (org.features ?? {}) as Record<string, boolean>;
    if (!features.callbacks) {
      throw redirect({ to: "/$orgSlug/admin", params: { orgSlug: params.orgSlug } });
    }
  },
  component: Page,
});

function Page() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/_authenticated/admin/callbacks" });
  return (
    <main className="mx-auto max-w-3xl p-5 text-white">
      <CallbackBoard slug={orgSlug} />
    </main>
  );
}
```

Add print-friendly CSS: white background + black text inside `@media print`. Plan 06's global stylesheet is a good home for this.

- [ ] **Commit**

---

## Task 8: Nav gating

Add the callback link to the coach and admin nav only when `hasFeature("callbacks")`. The link is absent, not disabled, when the feature is off.

- [ ] **Commit**

---

## Task 9: Verification

- [ ] Full backend tests pass.
- [ ] Frontend build clean.
- [ ] Manual: log in as two Summit coaches. Each callback the same dancer plus one unique dancer each. Log in as admin, open `/summit/admin/callbacks`. Expect 3 entries, with the shared dancer showing `coachCount: 2`. Refresh after a 5s interval — list updates without manual refresh.
- [ ] Manual: print the board — verify the printed layout is readable and hides the "Print" button.
- [ ] Manual: disable `features.callbacks` on a test org. Confirm:
  - Coach nav does not show the link.
  - Admin callback route redirects.
  - `POST /orgs/:slug/callbacks` returns 404.
  - Dancer profile does not render the callback button.

---

## Definition of Done

- `event_callbacks` table exists with coach-scoped isolation.
- Coach can toggle callbacks with optimistic UI + haptic.
- Admin sees a live deduplicated board with coach counts and a printable layout.
- Entire feature is invisible when `features.callbacks === false`.
- Backend tests + frontend build clean.
