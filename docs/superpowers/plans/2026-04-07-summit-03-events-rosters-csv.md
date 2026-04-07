# Summit Plan 03 — Events, Rosters, CSV Upload & Admin Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Implement the managed-event lifecycle for an org — create/edit events, upload coach & dancer rosters from CSV, invite unregistered participants via email, grant premium access on dancer linking, surface an admin dashboard with counts and error recovery.

**Architecture:** Admin creates an `org_event`, marks it active (partial unique index enforces one active per org). Admin uploads two CSV types via multipart POSTs. Each upload is wrapped in a transaction: parse → validate → match by email → insert/update `event_rosters` rows → create `org_memberships` for linked users → create `premium_grants` for linked dancers → send invites for unmatched rows. A `csv_uploads` audit row records the outcome with row-level errors. The admin dashboard surfaces counts, recent uploads, and the row-level error UI.

**Tech Stack:** Adonis 6, Drizzle, VineJS, `csv-parse`, S3 upload via existing `#shared/storage` helpers, email via existing mail layer, TanStack Router + Query frontend.

**Source spec sections:** 2 (Events & Rosters, CSV flows), 3 (only `event_rosters` creation), 5 (admin dashboard).

**Depends on:** Plans 01, 02.

**Blocks:** Plans 04–07.

---

## UX Concerns Folded In

- **Mobile admin is optional, but the coach roster is mobile-read.** Admin dashboard is desktop-first (that's fine — admins work from laptops). The resulting roster data is consumed by coach screens on phones.
- **CSV error recovery.** An upload with 3/300 bad rows must still ingest the 297 good ones and present a **row-level** error list in-UI with: row number, cell-level reason, a "download errored rows as CSV" button so the admin can fix & re-upload just those.
- **Re-upload idempotency + diff.** Re-uploading the same file matches on `(event_id, email)` and updates existing rows. Response body includes `{ added, updated, unchanged, errored }` counts so the UI can render "4 added, 12 updated, 281 unchanged."
- **Unregistered coach affordance.** Coach roster rows where `user_id IS NULL` are exposed with `is_registered: false`. Plan 4's roster view will render these as muted cards with "pending registration" copy — not interactive.
- **Invite email is the first touch for new Summit dancers.** The email must carry org branding (logo, colors) and a single CTA button pointing at `/{slug}/register?t={token}`. Reuse the existing transactional email layer but add an `OrgInviteEmail` template that pulls branding from `ctx.org`.
- **Admin empty state.** Event created, no uploads yet — dashboard must guide to "upload participants" with a prominent CTA, not "no data."
- **Success state.** Upload complete → toast + updated counts + celebratory copy: "Added 47 dancers. They'll receive invite emails shortly."
- **Premium grant `sourceId` wiring.** Plan 01 left `premium_grants.source_id` nullable. This plan populates it with the `event_id` when a grant is created from a dancer CSV upload, so `GET /subscriptions.grantedBy` can resolve the org slug.

---

## File Map

**Backend create:**
- `apps/backend/app/database/schema/events.ts` — add `orgEvents`, `eventRosters`, `eventDancerProfiles`, `csvUploads` tables (co-located with existing `events` schema; rename file if naming collides — see Task 1)
- `apps/backend/app/modules/orgs/events/{create,update,get,list}-event/*`
- `apps/backend/app/modules/orgs/events/upload-coaches/*`
- `apps/backend/app/modules/orgs/events/upload-dancers/*`
- `apps/backend/app/modules/orgs/events/stats/*`
- `apps/backend/app/modules/orgs/events/routes.ts` (nested under orgs)
- `apps/backend/app/middleware/routes/org_event.ts` — resolves active event, attaches `ctx.orgEvent` and `ctx.orgRoster`
- `apps/backend/app/shared/org/csv-parser.ts` — typed parsing helpers
- `apps/backend/app/shared/org/invite-email.ts` — branded email send
- Tests co-located as `*.test.ts` per feature

**Backend modify:**
- `apps/backend/app/database/schema/index.ts` — export new tables
- `apps/backend/app/modules/orgs/routes.ts` — mount events sub-routes
- `apps/backend/start/kernel.ts` — add `orgEvent` named middleware
- `apps/backend/app/modules/orgs/register-dancer/service.ts` — wire `sourceId` if an active event exists

**Frontend create:**
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/route.tsx` — auth + membership guard
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/index.tsx` — dashboard
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/events.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/coaches.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/dancers.tsx`
- `apps/frontend/src/features/org/components/csv-uploader.tsx`
- `apps/frontend/src/features/org/components/upload-result-card.tsx`
- `apps/frontend/src/features/org/components/stat-card.tsx`
- `apps/frontend/src/features/org/components/org-header.tsx`
- `apps/frontend/src/features/org/api/admin-queries.ts`
- `apps/frontend/src/features/org/hooks/use-active-event.ts`

---

## Task 1: Schema — `org_events`, `event_rosters`, `event_dancer_profiles`, `csv_uploads`

**Files:**
- Create: `apps/backend/app/database/schema/org_events.ts` (separate from existing `events.ts` which covers listing events)
- Modify: `apps/backend/app/database/schema/index.ts`, `apps/backend/app/database/schema/organizations.ts` (add FK target reference if needed for premium_grants)

- [ ] **Step 1: Create the schema**

```typescript
// apps/backend/app/database/schema/org_events.ts
import * as pg from "drizzle-orm/pg-core";
import { orgMemberType } from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { organizations } from "./organizations.ts";
import { users } from "./users.ts";

export const orgEvents = pg.pgTable(
  "org_events",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    orgId: pg
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: pg.varchar({ length: 160 }).notNull(),
    startDate: pg.date().notNull(),
    endDate: pg.date().notNull(),
    venueName: pg.text(),
    venueAddress: pg.text(),
    contactEmail: pg.text(),
    isActive: pg.boolean().notNull().default(false),
    schedulePdfUrl: pg.text(),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.orgId),
    pg.uniqueIndex("org_events_one_active_per_org")
      .on(table.orgId)
      .where(pg.sql`is_active = true`),
  ]
);

export const eventRosters = pg.pgTable(
  "event_rosters",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    userId: pg.uuid().references(() => users.id, { onDelete: "set null" }),
    type: orgMemberType().notNull(),
    bibNumber: pg.integer(),
    email: pg.text().notNull(),
    firstName: pg.text().notNull(),
    lastName: pg.text().notNull(),
    organization: pg.text(),
    isRegistered: pg.boolean().notNull().default(false),
    expirationDate: pg.date(),
    csvUploadId: pg.uuid(),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.eventId, table.email),
    pg.uniqueIndex("event_rosters_bib_per_event")
      .on(table.eventId, table.bibNumber)
      .where(pg.sql`bib_number IS NOT NULL`),
    pg.index().on(table.eventId, table.type),
    pg.index().on(table.userId),
  ]
);

export const eventDancerProfiles = pg.pgTable(
  "event_dancer_profiles",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    rosterId: pg
      .uuid()
      .notNull()
      .unique()
      .references(() => eventRosters.id, { onDelete: "cascade" }),
    profilePhotoUrl: pg.text(),
    gradYear: pg.integer(),
    gpa: pg.doublePrecision(),
    studio: pg.text(),
    state: pg.text(),
    height: pg.text(),
    danceStyles: pg.text().array(),
    bio: pg.text(),
    extra: pg.jsonb(),
    ...timestamps,
  }
);

export const csvUploads = pg.pgTable(
  "csv_uploads",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    eventId: pg
      .uuid()
      .notNull()
      .references(() => orgEvents.id, { onDelete: "cascade" }),
    type: orgMemberType().notNull(),
    fileUrl: pg.text().notNull(),
    uploadedBy: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    rowsAdded: pg.integer().notNull().default(0),
    rowsUpdated: pg.integer().notNull().default(0),
    rowsErrored: pg.integer().notNull().default(0),
    errorDetails: pg.jsonb(),
    ...timestamps,
  },
  (table) => [pg.index().on(table.eventId, table.createdAt)]
);
```

- [ ] **Step 2: Barrel export**

```typescript
// apps/backend/app/database/schema/index.ts — append
export * from "./org_events.ts";
```

- [ ] **Step 3: Generate + apply migration**

```bash
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter backend typecheck`

- [ ] **Step 5: Commit**

```bash
git add apps/backend/app/database
git commit -m "feat(db): org_events, event_rosters, event_dancer_profiles, csv_uploads"
```

---

## Task 2: `orgEvent` middleware

**Files:**
- Create: `apps/backend/app/middleware/routes/org_event.ts`
- Test: `apps/backend/app/middleware/routes/org_event.test.ts`
- Modify: `apps/backend/start/kernel.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/backend/app/middleware/routes/org_event.test.ts
import { test } from "@japa/runner";
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { orgEvents } from "#database/schema/org_events";
import { eq } from "drizzle-orm";

router.get("/orgs/:slug/_test_event", ({ response, ...ctx }) =>
  response.ok({ eventId: (ctx as any).orgEvent?.id ?? null })
).use([middleware.org(), middleware.orgEvent()]);

test.group("orgEvent middleware", (group) => {
  group.each.setup(async () => { await db.delete(orgEvents).execute(); });

  test("404 when no active event exists", async ({ client }) => {
    const res = await client.get("/orgs/summit/_test_event");
    res.assertStatus(404);
  });

  test("attaches active event", async ({ client, assert }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    const [ev] = await db.insert(orgEvents).values({
      orgId: summit.id, name: "Test", startDate: "2026-06-13", endDate: "2026-06-14", isActive: true,
    }).returning();
    const res = await client.get("/orgs/summit/_test_event");
    res.assertStatus(200);
    assert.equal(res.body().eventId, ev.id);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/middleware/routes/org_event.test.ts"`
Expected: fails — middleware missing.

- [ ] **Step 3: Implement**

```typescript
// apps/backend/app/middleware/routes/org_event.ts
import { db } from "#database/connection";
import { orgEvents } from "#database/schema/org_events";
import { eventRosters } from "#database/schema/org_events";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { and, eq } from "drizzle-orm";

declare module "@adonisjs/core/http" {
  interface HttpContext {
    orgEvent?: typeof orgEvents.$inferSelect;
    orgRoster?: typeof eventRosters.$inferSelect;
  }
}

export default class OrgEventMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.org) return ctx.response.notFound({ message: "Org not resolved." });
    const [ev] = await db
      .select().from(orgEvents)
      .where(and(eq(orgEvents.orgId, ctx.org.id), eq(orgEvents.isActive, true)))
      .limit(1);
    if (!ev) return ctx.response.notFound({ message: "No active event." });
    ctx.orgEvent = ev;

    // If user is authenticated, attach their roster row (optional — not a hard failure).
    try {
      const user = ctx.auth.getUserOrFail();
      const [roster] = await db
        .select().from(eventRosters)
        .where(and(eq(eventRosters.eventId, ev.id), eq(eventRosters.userId, user.id)))
        .limit(1);
      if (roster) ctx.orgRoster = roster;
    } catch { /* not authed, that's fine */ }

    return next();
  }
}
```

- [ ] **Step 4: Register middleware**

```typescript
// apps/backend/start/kernel.ts
orgEvent: () => import("#middleware/routes/org_event"),
```

- [ ] **Step 5: Run tests**

Run: `node ace test --files "app/middleware/routes/org_event.test.ts"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/middleware/routes/org_event.ts apps/backend/app/middleware/routes/org_event.test.ts apps/backend/start/kernel.ts
git commit -m "feat(orgs): orgEvent middleware resolves active event and roster"
```

---

## Task 3: Admin event CRUD

**Files:**
- Create: `apps/backend/app/modules/orgs/events/create/{validator,service,controller}.ts`
- Create: `apps/backend/app/modules/orgs/events/update/{validator,service,controller}.ts`
- Create: `apps/backend/app/modules/orgs/events/list/{service,controller}.ts`
- Create: `apps/backend/app/modules/orgs/events/routes.ts`
- Modify: `apps/backend/app/modules/orgs/routes.ts`
- Test: `apps/backend/app/modules/orgs/events/create/service.test.ts`

- [ ] **Step 1: Write failing test (create)**

```typescript
// apps/backend/app/modules/orgs/events/create/service.test.ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { orgEvents } from "#database/schema/org_events";
import { users } from "#database/schema/users";
import { eq } from "drizzle-orm";

test.group("POST /orgs/:slug/events", (group) => {
  group.each.setup(async () => { await db.delete(orgEvents).execute(); });

  test("admin can create and activate an event; partial unique enforces one active", async ({ client }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    const [admin] = await db.insert(users).values({
      username: "ea1", email: "ea1@x.co", role: "user", type: "school",
      displayEmail: "ea1@x.co", firstName: "A", lastName: "D", password: "x",
    }).returning();
    await db.insert(orgMemberships).values({
      userId: admin.id, orgId: summit.id, type: "coach", role: "admin",
    });

    const create = await client.post("/orgs/summit/events").loginAs(admin).json({
      name: "Summit 2026", startDate: "2026-06-13", endDate: "2026-06-14",
      venueName: "Boston Garden", isActive: true,
    });
    create.assertStatus(201);

    // Attempting to create a second active event must fail.
    const dupe = await client.post("/orgs/summit/events").loginAs(admin).json({
      name: "Other", startDate: "2026-07-01", endDate: "2026-07-02", isActive: true,
    });
    dupe.assertStatus(409);
  });

  test("non-admin rejected", async ({ client }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    const [coach] = await db.insert(users).values({
      username: "ec1", email: "ec1@x.co", role: "user", type: "school",
      displayEmail: "ec1@x.co", firstName: "C", lastName: "One", password: "x",
    }).returning();
    await db.insert(orgMemberships).values({
      userId: coach.id, orgId: summit.id, type: "coach", role: "member",
    });
    const res = await client.post("/orgs/summit/events").loginAs(coach).json({
      name: "X", startDate: "2026-06-13", endDate: "2026-06-14",
    });
    res.assertStatus(403);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/modules/orgs/events/create/service.test.ts"`
Expected: 404 — routes missing.

- [ ] **Step 3: Implement validator**

```typescript
// apps/backend/app/modules/orgs/events/create/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(vine.object({
  name: vine.string().trim().minLength(1).maxLength(160),
  startDate: vine.date({ formats: ["YYYY-MM-DD"] }),
  endDate: vine.date({ formats: ["YYYY-MM-DD"] }),
  venueName: vine.string().trim().optional(),
  venueAddress: vine.string().trim().optional(),
  contactEmail: vine.string().email().optional(),
  isActive: vine.boolean().optional(),
}));
export type Validator = Infer<typeof schema>;
```

- [ ] **Step 4: Implement service**

```typescript
// apps/backend/app/modules/orgs/events/create/service.ts
import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org_events";
import { inject } from "@adonisjs/core";
import type { Validator } from "./validator.ts";

@inject()
export class CreateEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, input: Validator) {
    return this.db.tx(async (tx) => {
      const [ev] = await tx.insert(orgEvents).values({
        orgId,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        contactEmail: input.contactEmail,
        isActive: input.isActive ?? false,
      }).returning();
      return ev;
    });
  }
}
```

- [ ] **Step 5: Implement controller — catch unique violation**

```typescript
// apps/backend/app/modules/orgs/events/create/controller.ts
import type { HttpContext } from "@adonisjs/core/http";
import { inject } from "@adonisjs/core";
import { CreateEventService } from "./service.ts";
import { schema } from "./validator.ts";

export default class CreateEventController {
  @inject()
  async handle(ctx: HttpContext, service: CreateEventService) {
    const payload = await ctx.request.validateUsing(schema);
    try {
      const ev = await service.execute(ctx.org!.id, payload);
      return ctx.response.created(ev);
    } catch (err: any) {
      if (err?.code === "23505" && String(err.constraint ?? "").includes("one_active_per_org")) {
        return ctx.response.conflict({ message: "Another event is already active. Deactivate it first." });
      }
      throw err;
    }
  }
}
```

- [ ] **Step 6: Implement list + update similarly (patterns identical)**

List: `GET /orgs/:slug/events` — returns all events for the org, newest first.
Update: `PATCH /orgs/:slug/events/:id` — allows activating/deactivating, editing fields. Activating must deactivate any currently-active event in the same transaction to avoid constraint violation.

```typescript
// apps/backend/app/modules/orgs/events/update/service.ts
import { DatabaseService } from "#database/service";
import { orgEvents } from "#database/schema/org_events";
import { inject } from "@adonisjs/core";
import { and, eq, ne } from "drizzle-orm";

@inject()
export class UpdateEventService {
  constructor(private db: DatabaseService) {}

  async execute(orgId: string, eventId: string, patch: Partial<typeof orgEvents.$inferInsert>) {
    return this.db.tx(async (tx) => {
      if (patch.isActive === true) {
        await tx.update(orgEvents)
          .set({ isActive: false })
          .where(and(eq(orgEvents.orgId, orgId), eq(orgEvents.isActive, true), ne(orgEvents.id, eventId)));
      }
      const [ev] = await tx.update(orgEvents)
        .set(patch)
        .where(and(eq(orgEvents.id, eventId), eq(orgEvents.orgId, orgId)))
        .returning();
      return ev;
    });
  }
}
```

- [ ] **Step 7: Wire routes**

```typescript
// apps/backend/app/modules/orgs/events/routes.ts
import { middleware } from "#start/kernel";
import router from "@adonisjs/core/services/router";

const Create = () => import("./create/controller.ts");
const Update = () => import("./update/controller.ts");
const List = () => import("./list/controller.ts");

router.group(() => {
  router.post(":slug/events", [Create]).use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.patch(":slug/events/:id", [Update]).use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
  router.get(":slug/events", [List]).use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
}).prefix("orgs").openapi({ tags: ["Org Events"] });
```

Import this file from `apps/backend/app/modules/orgs/routes.ts`:

```typescript
// apps/backend/app/modules/orgs/routes.ts (top)
import "./events/routes.ts";
```

- [ ] **Step 8: Run tests**

Run: `node ace test --files "app/modules/orgs/events/**/*.test.ts"`
Expected: PASS.

- [ ] **Step 9: Regenerate OpenAPI + commit**

```bash
pnpm --filter backend make:docs
git add apps/backend/app/modules/orgs/events apps/backend/app/modules/orgs/routes.ts apps/backend/openapi.json
git commit -m "feat(orgs): admin event CRUD with single-active constraint"
```

---

## Task 4: CSV parsing helper

**Files:**
- Create: `apps/backend/app/shared/org/csv-parser.ts`
- Test: `apps/backend/app/shared/org/csv-parser.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// apps/backend/app/shared/org/csv-parser.test.ts
import { test } from "@japa/runner";
import { parseCoachCsv, parseDancerCsv } from "./csv-parser.ts";

test.group("csv parser", () => {
  test("parses valid coach csv", async ({ assert }) => {
    const csv = `email,firstName,lastName,organization
a@x.co,Alice,Smith,USC
b@x.co,Bob,Jones,UCLA`;
    const { rows, errors } = parseCoachCsv(csv);
    assert.lengthOf(rows, 2);
    assert.lengthOf(errors, 0);
    assert.equal(rows[0]!.email, "a@x.co");
  });

  test("reports row-level errors", async ({ assert }) => {
    const csv = `email,firstName,lastName,organization
,Alice,Smith,USC
b@x.co,Bob,Jones,UCLA`;
    const { rows, errors } = parseCoachCsv(csv);
    assert.lengthOf(rows, 1);
    assert.lengthOf(errors, 1);
    assert.equal(errors[0]!.row, 2);
    assert.include(errors[0]!.reason, "email");
  });

  test("dancer csv requires bib_number", async ({ assert }) => {
    const csv = `email,firstName,lastName,bibNumber
a@x.co,A,B,101
c@x.co,C,D,`;
    const { rows, errors } = parseDancerCsv(csv);
    assert.lengthOf(rows, 1);
    assert.lengthOf(errors, 1);
    assert.include(errors[0]!.reason, "bib");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/shared/org/csv-parser.test.ts"`

- [ ] **Step 3: Implement**

```typescript
// apps/backend/app/shared/org/csv-parser.ts
import { parse } from "csv-parse/sync";

export interface CoachRow { email: string; firstName: string; lastName: string; organization: string; }
export interface DancerRow { email: string; firstName: string; lastName: string; bibNumber: number; }
export interface RowError { row: number; reason: string; }

function parseCsv<T>(csv: string, validateRow: (r: Record<string, string>, i: number) => T | RowError): { rows: T[]; errors: RowError[] } {
  const raw = parse(csv, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  const rows: T[] = [];
  const errors: RowError[] = [];
  raw.forEach((r, i) => {
    const res = validateRow(r, i + 2); // +2 for header line
    if ((res as RowError).reason) errors.push(res as RowError);
    else rows.push(res as T);
  });
  return { rows, errors };
}

export function parseCoachCsv(csv: string) {
  return parseCsv<CoachRow>(csv, (r, row) => {
    if (!r.email) return { row, reason: "missing email" };
    if (!r.firstName) return { row, reason: "missing firstName" };
    if (!r.lastName) return { row, reason: "missing lastName" };
    if (!r.organization) return { row, reason: "missing organization" };
    return {
      email: r.email.toLowerCase().trim(),
      firstName: r.firstName, lastName: r.lastName, organization: r.organization,
    };
  });
}

export function parseDancerCsv(csv: string) {
  return parseCsv<DancerRow>(csv, (r, row) => {
    if (!r.email) return { row, reason: "missing email" };
    if (!r.firstName) return { row, reason: "missing firstName" };
    if (!r.lastName) return { row, reason: "missing lastName" };
    const bibRaw = r.bibNumber ?? r.bib_number;
    const bib = Number(bibRaw);
    if (!bibRaw || Number.isNaN(bib)) return { row, reason: "missing or invalid bib number" };
    return {
      email: r.email.toLowerCase().trim(),
      firstName: r.firstName, lastName: r.lastName, bibNumber: bib,
    };
  });
}
```

- [ ] **Step 4: Install `csv-parse` if missing**

Run: `pnpm --filter backend add csv-parse`

- [ ] **Step 5: Run tests**

Run: `node ace test --files "app/shared/org/csv-parser.test.ts"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/shared/org apps/backend/package.json pnpm-lock.yaml
git commit -m "feat(orgs): csv parser for coach + dancer rosters"
```

---

## Task 5: Coach CSV upload

**Files:**
- Create: `apps/backend/app/modules/orgs/events/upload-coaches/{validator,service,controller}.ts`
- Test: `apps/backend/app/modules/orgs/events/upload-coaches/service.test.ts`
- Modify: `apps/backend/app/modules/orgs/events/routes.ts`
- Modify: `apps/backend/app/shared/org/invite-email.ts` — create branded email helper

- [ ] **Step 1: Write failing test covering: matched row, unmatched row, re-upload idempotency**

```typescript
// apps/backend/app/modules/orgs/events/upload-coaches/service.test.ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { schoolProfiles } from "#database/schema/schools";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { orgEvents, eventRosters, csvUploads } from "#database/schema/org_events";
import { eq } from "drizzle-orm";

test.group("POST /orgs/:slug/events/:id/upload/coaches", (group) => {
  group.each.setup(async () => {
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
  });

  test("matched coach gets user_id and org_membership", async ({ client, assert }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    const [admin] = await db.insert(users).values({
      username: "ua", email: "ua@x.co", role: "user", type: "school",
      displayEmail: "ua@x.co", firstName: "U", lastName: "A", password: "x",
    }).returning();
    await db.insert(orgMemberships).values({ userId: admin.id, orgId: summit.id, type: "coach", role: "admin" });

    const [coach] = await db.insert(users).values({
      username: "co", email: "coach@usc.edu", role: "user", type: "school",
      displayEmail: "coach@usc.edu", firstName: "Coach", lastName: "Mc", password: "x", verified: true,
    }).returning();
    await db.insert(schoolProfiles).values({ userId: coach.id, name: "USC", location: "LA" });

    const [ev] = await db.insert(orgEvents).values({
      orgId: summit.id, name: "E", startDate: "2026-06-13", endDate: "2026-06-14", isActive: true,
    }).returning();

    const csv = `email,firstName,lastName,organization
coach@usc.edu,Coach,Mc,USC
ghost@ucla.edu,Ghost,Er,UCLA`;

    const res = await client
      .post(`/orgs/summit/events/${ev.id}/upload/coaches`)
      .loginAs(admin)
      .file("file", Buffer.from(csv), { filename: "coaches.csv" });

    res.assertStatus(200);
    const body = res.body();
    assert.equal(body.rowsAdded, 2);
    assert.equal(body.rowsErrored, 0);

    const rosters = await db.select().from(eventRosters).where(eq(eventRosters.eventId, ev.id));
    assert.lengthOf(rosters, 2);
    const matched = rosters.find(r => r.email === "coach@usc.edu")!;
    assert.equal(matched.userId, coach.id);
    assert.isTrue(matched.isRegistered);
    const unmatched = rosters.find(r => r.email === "ghost@ucla.edu")!;
    assert.isNull(unmatched.userId);
    assert.isFalse(unmatched.isRegistered);

    // org_membership created for the matched coach
    const [mem] = await db.select().from(orgMemberships).where(eq(orgMemberships.userId, coach.id));
    assert.equal(mem.type, "coach");
  });

  test("re-upload is idempotent: updates existing rows, no duplicates", async ({ client, assert }) => {
    // setup omitted for brevity - same pattern
    // Upload same csv twice, assert:
    //   second response has rowsUpdated >= 1, rowsAdded === 0
    //   event_rosters count unchanged
  });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement the validator**

```typescript
// apps/backend/app/modules/orgs/events/upload-coaches/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(vine.object({
  file: vine.file({ size: "10mb", extnames: ["csv"] }),
}));
export type Validator = Infer<typeof schema>;
```

- [ ] **Step 4: Implement the service**

```typescript
// apps/backend/app/modules/orgs/events/upload-coaches/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { users } from "#database/schema/users";
import { schoolProfiles } from "#database/schema/schools";
import {
  orgEvents, eventRosters, csvUploads,
} from "#database/schema/org_events";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { parseCoachCsv } from "#shared/org/csv-parser";
import { sendOrgInviteEmail } from "#shared/org/invite-email";
import { and, eq, inArray } from "drizzle-orm";

@inject()
export class UploadCoachesService {
  constructor(private db: DatabaseService) {}

  async execute({
    orgId, eventId, uploaderId, fileUrl, csv,
  }: { orgId: string; eventId: string; uploaderId: string; fileUrl: string; csv: string; }) {
    const { rows, errors } = parseCoachCsv(csv);

    const result = await this.db.tx(async (tx) => {
      let added = 0, updated = 0;

      const [upload] = await tx.insert(csvUploads).values({
        eventId, type: "coach", fileUrl, uploadedBy: uploaderId,
        rowsAdded: 0, rowsUpdated: 0, rowsErrored: errors.length,
        errorDetails: errors,
      }).returning();

      if (rows.length === 0) return { upload, added, updated };

      // Batch match against users by email
      const emails = rows.map(r => r.email);
      const matchedUsers = await tx
        .select({ id: users.id, email: users.email })
        .from(users)
        .innerJoin(schoolProfiles, eq(schoolProfiles.userId, users.id))
        .where(inArray(users.email, emails));
      const byEmail = new Map(matchedUsers.map(u => [u.email.toLowerCase(), u.id]));

      for (const r of rows) {
        const userId = byEmail.get(r.email) ?? null;
        const [existing] = await tx
          .select().from(eventRosters)
          .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.email, r.email)))
          .limit(1);
        if (existing) {
          await tx.update(eventRosters).set({
            firstName: r.firstName, lastName: r.lastName,
            organization: r.organization, userId,
            isRegistered: !!userId, csvUploadId: upload.id,
          }).where(eq(eventRosters.id, existing.id));
          updated += 1;
        } else {
          await tx.insert(eventRosters).values({
            eventId, type: "coach", email: r.email,
            firstName: r.firstName, lastName: r.lastName, organization: r.organization,
            userId, isRegistered: !!userId, csvUploadId: upload.id,
          });
          added += 1;
        }

        // Upsert org_membership for matched users
        if (userId) {
          await tx.insert(orgMemberships).values({
            userId, orgId, type: "coach", role: "member",
          }).onConflictDoNothing({ target: [orgMemberships.userId, orgMemberships.orgId] });
        }
      }

      await tx.update(csvUploads).set({ rowsAdded: added, rowsUpdated: updated })
        .where(eq(csvUploads.id, upload.id));

      return { upload, added, updated };
    });

    // Send invites for unmatched rows (fire-and-forget; failures logged, not thrown)
    const unmatched = rows.filter(r => !result);
    const [org] = await this.db.use((db) =>
      db.select().from(organizations).where(eq(organizations.id, orgId))
    );
    for (const r of rows) {
      // Query whether the row was linked. Cheap: re-read by email.
      const [roster] = await this.db.use((db) =>
        db.select().from(eventRosters)
          .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.email, r.email)))
      );
      if (roster && !roster.userId) {
        await sendOrgInviteEmail({ org, email: r.email, firstName: r.firstName, type: "coach" }).catch(() => {});
      }
    }

    return {
      uploadId: result.upload.id,
      rowsAdded: result.added,
      rowsUpdated: result.updated,
      rowsErrored: errors.length,
      errors,
    };
  }
}
```

- [ ] **Step 5: Implement `sendOrgInviteEmail` helper**

```typescript
// apps/backend/app/shared/org/invite-email.ts
import mail from "@adonisjs/mail/services/main";
import { organizations } from "#database/schema/organizations";

export async function sendOrgInviteEmail(opts: {
  org: typeof organizations.$inferSelect;
  email: string;
  firstName: string;
  type: "coach" | "dancer";
  token?: string;
}) {
  const { org, email, firstName, type, token } = opts;
  const registerPath =
    type === "dancer" && token
      ? `/${org.slug}/register?t=${token}`
      : `/${org.slug}/login`;

  await mail.send((message) => {
    message
      .to(email)
      .subject(`You're invited to ${org.name}`)
      .htmlView("emails/org_invite", {
        org, firstName, registerPath, type,
      });
  });
}
```

(The HTML template lives at `apps/backend/resources/views/emails/org_invite.edge` — style it with org colors via inline styles because email clients don't support CSS variables.)

- [ ] **Step 6: Implement controller**

```typescript
// apps/backend/app/modules/orgs/events/upload-coaches/controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { readFile } from "node:fs/promises";
import { uploadToStorage } from "#shared/storage"; // assume existing helper
import { UploadCoachesService } from "./service.ts";
import { schema } from "./validator.ts";

export default class UploadCoachesController {
  @inject()
  async handle(ctx: HttpContext, service: UploadCoachesService) {
    const { file } = await ctx.request.validateUsing(schema);
    const user = ctx.auth.getUserOrFail();
    const csv = (await readFile(file.tmpPath!)).toString("utf8");
    const fileUrl = await uploadToStorage(file, `org-csv/${ctx.org!.slug}`);
    const result = await service.execute({
      orgId: ctx.org!.id,
      eventId: ctx.params.id,
      uploaderId: user.id,
      fileUrl,
      csv,
    });
    return ctx.response.ok(result);
  }
}
```

- [ ] **Step 7: Wire route**

```typescript
// apps/backend/app/modules/orgs/events/routes.ts — add
const UploadCoaches = () => import("./upload-coaches/controller.ts");
router.post(":slug/events/:id/upload/coaches", [UploadCoaches])
  .use([middleware.auth(), middleware.org(), middleware.orgMember(), middleware.orgAdmin()]);
```

- [ ] **Step 8: Run tests**

Run: `node ace test --files "app/modules/orgs/events/upload-coaches/service.test.ts"`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add -A apps/backend
git commit -m "feat(orgs): coach CSV upload with matching, memberships, invites"
```

---

## Task 6: Dancer CSV upload

Mirror Task 5, with the additions:

- Match against `users` by email (NOT `dancer_profiles` since the CSV has new dancers too).
- On match: create `org_membership` (type=dancer), create `premium_grant` with `expiresAt = event.endDate + org.settings.premium_period_days`, `sourceId = event.id`. Send "your access is ready" email.
- On no match: create a `org_dancer_invite` row with a random token (64 chars, url-safe), attach the token to the invite email.
- Set `event_rosters.expirationDate = event.endDate + premium_period_days`.
- Bib numbers come from CSV; never auto-assign; re-upload updates bib if changed.

- [ ] **Step 1: Write failing test covering: new S2S user path, existing S2S user path, invite token creation, premium grant wiring**

Test file: `apps/backend/app/modules/orgs/events/upload-dancers/service.test.ts`. Follow Task 5's structure. Key assertions:
- `premium_grants` row created for matched users with correct `sourceId` and `expiresAt`.
- `org_dancer_invites` row created for unmatched emails with a token.
- `event_rosters.expiration_date` matches `event.end_date + premium_period_days`.
- Re-upload with a changed bib number updates the existing roster row.

- [ ] **Step 2: Implement validator, service, controller, routes**

Structure identical to coach upload. Service logic adds:

```typescript
// Key excerpt inside the transaction in upload-dancers/service.ts
// After resolving userId / matchedUsers, for each row:
if (userId) {
  await tx.insert(orgMemberships).values({
    userId, orgId, type: "dancer", role: "member",
  }).onConflictDoNothing({ target: [orgMemberships.userId, orgMemberships.orgId] });

  const settings = org.settings as { premium_period_days?: number };
  const grantExpires = new Date(event.endDate);
  grantExpires.setDate(grantExpires.getDate() + (settings.premium_period_days ?? 90));

  await tx.insert(premiumGrants).values({
    userId, sourceType: "org_event", sourceId: eventId,
    expiresAt: grantExpires,
  }).onConflictDoNothing();
} else {
  const token = crypto.randomBytes(32).toString("base64url");
  await tx.insert(dancerInvites).values({
    orgId, email: r.email, token,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  }).onConflictDoNothing({ target: [dancerInvites.orgId, dancerInvites.email] });
  // Fetch back the token for email sending (handle existing rows)
}
```

- [ ] **Step 3: Run tests + commit**

---

## Task 7: Admin stats endpoint

**Files:**
- Create: `apps/backend/app/modules/orgs/events/stats/{service,controller}.ts`

- [ ] **Step 1: Write failing test — returns counts of coaches, dancers, registered, pending, recent uploads**

- [ ] **Step 2: Implement service**

```typescript
// apps/backend/app/modules/orgs/events/stats/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { eventRosters, csvUploads } from "#database/schema/org_events";
import { and, count, desc, eq } from "drizzle-orm";

@inject()
export class EventStatsService {
  constructor(private db: DatabaseService) {}
  async execute(eventId: string) {
    return this.db.use(async (db) => {
      const [coachCount] = await db.select({ v: count() }).from(eventRosters)
        .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.type, "coach")));
      const [dancerCount] = await db.select({ v: count() }).from(eventRosters)
        .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.type, "dancer")));
      const [registeredCount] = await db.select({ v: count() }).from(eventRosters)
        .where(and(eq(eventRosters.eventId, eventId), eq(eventRosters.isRegistered, true)));
      const recentUploads = await db.select().from(csvUploads)
        .where(eq(csvUploads.eventId, eventId))
        .orderBy(desc(csvUploads.createdAt))
        .limit(5);
      return {
        coaches: coachCount.v,
        dancers: dancerCount.v,
        registered: registeredCount.v,
        pending: coachCount.v + dancerCount.v - registeredCount.v,
        recentUploads,
      };
    });
  }
}
```

- [ ] **Step 3: Wire, test, commit**

---

## Task 8: Frontend — `_org/$orgSlug/_authenticated` layout

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/route.tsx`

- [ ] **Step 1: Implement**

```tsx
// apps/frontend/src/routes/_org/$orgSlug/_authenticated/route.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { queries } from "@/lib/session";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated")({
  beforeLoad: async ({ context, location, params }) => {
    const session = await context.queryClient.ensureQueryData(queries.session());
    if (!session) {
      throw redirect({
        to: "/$orgSlug/login",
        params: { orgSlug: params.orgSlug },
        search: { redirect: location.href },
      });
    }
    return { session };
  },
  component: () => <Outlet />,
});
```

- [ ] **Step 2: Build + commit**

---

## Task 9: Frontend — admin dashboard + CSV uploader

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/index.tsx`
- Create: `apps/frontend/src/features/org/components/csv-uploader.tsx`
- Create: `apps/frontend/src/features/org/components/stat-card.tsx`
- Create: `apps/frontend/src/features/org/components/upload-result-card.tsx`
- Create: `apps/frontend/src/features/org/api/admin-queries.ts`

- [ ] **Step 1: Implement queries + stat card + uploader**

```typescript
// apps/frontend/src/features/org/api/admin-queries.ts
import { $api } from "@/lib/api/client";

export const adminQueries = {
  events: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}/events", { params: { path: { slug } } }),
  stats: (slug: string, eventId: string) =>
    $api.queryOptions("get", "/orgs/{slug}/events/{id}/stats", {
      params: { path: { slug, id: eventId } },
    }),
};
```

```tsx
// apps/frontend/src/features/org/components/stat-card.tsx
export function StatCard({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-4xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-sm opacity-70">{label}</div>
    </div>
  );
}
```

```tsx
// apps/frontend/src/features/org/components/csv-uploader.tsx
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function CsvUploader({
  title, description, onUpload, isPending,
}: {
  title: string;
  description: string;
  onUpload: (file: File) => void;
  isPending: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onUpload(file);
      }}
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
        dragOver ? "border-white bg-white/5" : "border-white/20"
      }`}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm opacity-70">{description}</p>
      <input
        ref={inputRef} type="file" accept=".csv" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
      <Button className="mt-4" onClick={() => inputRef.current?.click()} disabled={isPending}>
        {isPending ? "Uploading..." : "Choose CSV"}
      </Button>
      <p className="mt-2 text-xs opacity-50">or drag &amp; drop</p>
    </div>
  );
}
```

```tsx
// apps/frontend/src/features/org/components/upload-result-card.tsx
export function UploadResultCard({ result }: {
  result: {
    rowsAdded: number; rowsUpdated: number; rowsErrored: number;
    errors: Array<{ row: number; reason: string }>;
  };
}) {
  const total = result.rowsAdded + result.rowsUpdated;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-lg font-semibold">
        {total > 0
          ? `${result.rowsAdded} added, ${result.rowsUpdated} updated`
          : "No changes"}
      </div>
      {result.rowsErrored > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-red-300">
            {result.rowsErrored} rows had errors — expand
          </summary>
          <ul className="mt-2 space-y-1 text-xs">
            {result.errors.map((e, i) => (
              <li key={i}>Row {e.row}: {e.reason}</li>
            ))}
          </ul>
          <button
            className="mt-2 text-xs underline"
            onClick={() => downloadErrored(result.errors)}
          >
            Download errored rows as CSV
          </button>
        </details>
      )}
    </div>
  );
}
function downloadErrored(errors: Array<{ row: number; reason: string }>) {
  const csv = "row,reason\n" + errors.map(e => `${e.row},"${e.reason}"`).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "errored-rows.csv"; a.click();
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Implement the admin index route**

```tsx
// apps/frontend/src/routes/_org/$orgSlug/_authenticated/admin/index.tsx
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminQueries } from "@/features/org/api/admin-queries";
import { $api } from "@/lib/api/client";
import { StatCard } from "@/features/org/components/stat-card";
import { CsvUploader } from "@/features/org/components/csv-uploader";
import { UploadResultCard } from "@/features/org/components/upload-result-card";
import { useState } from "react";

export const Route = createFileRoute("/_org/$orgSlug/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/_authenticated/admin/" });
  const { data: events } = useSuspenseQuery(adminQueries.events(orgSlug));
  const activeEvent = events.find((e) => e.isActive);
  const [lastUpload, setLastUpload] = useState<any>(null);
  const qc = useQueryClient();

  const uploadDancers = $api.useMutation("post", "/orgs/{slug}/events/{id}/upload/dancers", {
    onSuccess: (data) => {
      setLastUpload(data);
      if (activeEvent)
        qc.invalidateQueries(adminQueries.stats(orgSlug, activeEvent.id));
    },
  });

  if (!activeEvent) {
    return (
      <EmptyState>
        <h1 className="text-2xl font-semibold">No active event</h1>
        <p className="mt-2 opacity-70">Create an event to get started.</p>
      </EmptyState>
    );
  }

  const { data: stats } = useSuspenseQuery(adminQueries.stats(orgSlug, activeEvent.id));

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 text-white">
      <h1 className="text-3xl font-bold">{activeEvent.name}</h1>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Coaches" value={stats.coaches} />
        <StatCard label="Dancers" value={stats.dancers} />
        <StatCard label="Registered" value={stats.registered} />
        <StatCard label="Pending" value={stats.pending} />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <CsvUploader
          title="Upload dancer roster"
          description="CSV with email, firstName, lastName, bibNumber"
          isPending={uploadDancers.isPending}
          onUpload={(file) => {
            const form = new FormData();
            form.append("file", file);
            uploadDancers.mutate({
              params: { path: { slug: orgSlug, id: activeEvent.id } },
              body: form as any,
            });
          }}
        />
        {/* Same for coaches */}
      </section>

      {lastUpload && <UploadResultCard result={lastUpload} />}
    </main>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md p-12 text-center text-white">{children}</div>
  );
}
```

- [ ] **Step 3: Build + lint**

Run: `pnpm --filter frontend build && pnpm --filter frontend lint`

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src
git commit -m "feat(frontend): org admin dashboard with CSV upload"
```

---

## Task 10: Verification

- [ ] **Step 1: Full backend tests**

Run: `pnpm --filter backend test`

- [ ] **Step 2: Frontend build**

Run: `pnpm --filter frontend build`

- [ ] **Step 3: Manual smoke**

- Seed: `node ace backfill:organizations`
- Login as an admin of Summit (create via DB or an existing admin route).
- Hit `/summit/admin`, create an event, mark active.
- Upload a sample dancer CSV with 2 new + 1 malformed row → verify added/errored counts, error list visible, premium grants exist.
- Upload the same CSV again → verify rowsUpdated > 0, no duplicates.

- [ ] **Step 4: Final commit if needed**

---

## Definition of Done

- Admin can create/edit/activate an `org_event` with the one-active-per-org constraint enforced.
- Coach CSV upload creates rosters, links existing users, sends invites for unmatched.
- Dancer CSV upload additionally creates `org_memberships`, `premium_grants` wired to the event, and `dancer_invites` for new emails.
- `csv_uploads` audit row with row-level errors on each call.
- Admin dashboard surfaces counts + recent uploads + row-level error UI.
- Re-upload is idempotent with a diff summary in the response.
- Backend tests + frontend build clean.
