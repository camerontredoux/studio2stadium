# Summit Plan 01 — Foundation (Data Model Migration)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `platform_name` enum + `user_platforms` table with a proper `organizations` + `org_memberships` model, and add `premium_grants` for time-limited org-sourced premium access, without breaking anything currently running.

**Architecture:** Additive-then-subtractive migration. New tables land first, data is copied over, old tables are dropped last. The premium check gains an OR clause; nothing else moves.

**Tech Stack:** Adonis 6, Drizzle ORM, PostgreSQL, VineJS, Japa.

**Source spec sections:** 1 (Organizations & Membership), 2 (premium_grants), 6 (Existing System Changes).

**Depends on:** nothing. This is the first plan.

**Blocks:** All other Summit plans.

---

## UX Concerns Folded In

- The premium check update must **gracefully degrade**: after a grant expires, the `GET /subscriptions` response should surface `source: "org_event"` and `expiresAt` so the frontend can render a "your Summit access has ended" banner rather than a generic upgrade nag. Plan 2+ will consume this.
- `user_subscriptions` precedence: if a user has BOTH a paid Stripe sub and an active grant, return the Stripe sub in `source` so billing messaging stays correct.

---

## File Map

**Create:**
- `apps/backend/app/database/schema/organizations.ts` — `organizations`, `orgMemberships`, `premiumGrants` tables + new enums
- `apps/backend/app/database/migrations/backfill-organizations.ts` — one-shot data-migration Ace command
- `apps/backend/app/modules/subscriptions/get-status/service.test.ts` — tests for new premium source logic
- `apps/backend/app/middleware/routes/subscribed.test.ts` — middleware test covering grant path

**Modify:**
- `apps/backend/app/database/schema/enums.ts` — add `orgRole`, `orgMemberType`; remove `prodigy_admin` from `role`; keep `platformName` enum until final cleanup task
- `apps/backend/app/database/schema/index.ts` — export organizations schema
- `apps/backend/app/database/schema/users.ts` — drop `platforms` (user_platforms) table definition in final cleanup task
- `apps/backend/app/database/schema/profiles.ts` — `school_favorites.platformName` → `school_favorites.sourceOrgId`
- `apps/backend/app/middleware/routes/subscribed.ts` — add premium_grants check
- `apps/backend/app/modules/subscriptions/get-status/service.ts` — return `source` + `grantedBy`
- `apps/backend/app/modules/subscriptions/get-status/controller.ts` — shape response

**Remove (final cleanup task):**
- `user_platforms` table, `platform_name` enum, `prodigy_admin` role enum value

---

## Task 1: Add new enums

**Files:**
- Modify: `apps/backend/app/database/schema/enums.ts`

- [ ] **Step 1: Add the new enums at the bottom of the file**

```typescript
// apps/backend/app/database/schema/enums.ts (append)
export const orgRole = pgEnum("org_role", ["admin", "member"]);
export const orgMemberType = pgEnum("org_member_type", ["coach", "dancer"]);
export const premiumGrantSource = pgEnum("premium_grant_source", ["org_event"]);
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter backend typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/database/schema/enums.ts
git commit -m "feat(db): add org_role, org_member_type, premium_grant_source enums"
```

---

## Task 2: Create organizations schema file

**Files:**
- Create: `apps/backend/app/database/schema/organizations.ts`
- Modify: `apps/backend/app/database/schema/index.ts`

- [ ] **Step 1: Create the schema file**

```typescript
// apps/backend/app/database/schema/organizations.ts
import * as pg from "drizzle-orm/pg-core";
import {
  orgMemberType,
  orgRole,
  premiumGrantSource,
} from "./enums.ts";
import { timestamps } from "./helpers/columns.ts";
import { users } from "./users.ts";

export const organizations = pg.pgTable(
  "organizations",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    name: pg.varchar({ length: 128 }).notNull(),
    slug: pg.varchar({ length: 64 }).notNull().unique(),
    logoUrl: pg.text(),
    primaryColor: pg.varchar({ length: 16 }),
    accentColor: pg.varchar({ length: 16 }),
    features: pg.jsonb().notNull().default({}),
    settings: pg.jsonb().notNull().default({}),
    ...timestamps,
  },
  (table) => [pg.index().on(table.slug)]
);

export const orgMemberships = pg.pgTable(
  "org_memberships",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: pg
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: orgRole().notNull().default("member"),
    type: orgMemberType().notNull(),
    ...timestamps,
  },
  (table) => [
    pg.uniqueIndex().on(table.userId, table.orgId),
    pg.index().on(table.orgId),
    pg.index().on(table.userId),
  ]
);

export const premiumGrants = pg.pgTable(
  "premium_grants",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    userId: pg
      .uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceType: premiumGrantSource().notNull(),
    sourceId: pg.uuid(), // org_events.id once that table exists (Plan 3)
    grantedAt: pg.timestamp({ withTimezone: true }).notNull().defaultNow(),
    expiresAt: pg.timestamp({ withTimezone: true }).notNull(),
    revokedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.userId, table.expiresAt),
    pg.index().on(table.expiresAt),
  ]
);
```

- [ ] **Step 2: Barrel-export the new file**

```typescript
// apps/backend/app/database/schema/index.ts (add one line in alphabetical position)
export * from "./organizations.ts";
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter backend typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/app/database/schema/organizations.ts apps/backend/app/database/schema/index.ts
git commit -m "feat(db): add organizations, org_memberships, premium_grants schema"
```

---

## Task 3: Generate and apply the additive migration

**Files:**
- Create: whatever Drizzle generates under `apps/backend/app/database/drizzle/` (do not hand-write)

- [ ] **Step 1: Generate the migration**

Run: `pnpm --filter backend db:generate`
Expected: a new `NNNN_*.sql` file is written under the Drizzle migrations dir that creates the three enums and three tables. Review it — it must NOT drop `user_platforms` or `platform_name` yet.

- [ ] **Step 2: Apply it to a clean dev DB**

Run: `pnpm --filter backend db:migrate`
Expected: migration runs without error. Tables exist (verify via `pnpm db:studio` or a `SELECT 1 FROM organizations LIMIT 0`).

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/database/drizzle
git commit -m "feat(db): migration for organizations + memberships + grants"
```

---

## Task 4: Seed baseline organizations (core + prodigy + summit)

**Files:**
- Create: `apps/backend/commands/backfill_organizations.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/backend/app/modules/organizations/seed.test.ts`:

```typescript
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { eq } from "drizzle-orm";

test.group("organization seed", () => {
  test("creates core, prodigy, and summit orgs idempotently", async ({ assert }) => {
    const { default: Backfill } = await import("#commands/backfill_organizations");
    await new Backfill().run();
    await new Backfill().run(); // idempotent second run

    const [core] = await db.select().from(organizations).where(eq(organizations.slug, "core"));
    const [prodigy] = await db.select().from(organizations).where(eq(organizations.slug, "prodigy"));
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));

    assert.exists(core);
    assert.exists(prodigy);
    assert.exists(summit);
    assert.equal(summit.name, "Sharpen Up - The Summit");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node ace test --files "app/modules/organizations/seed.test.ts"`
Expected: FAIL — `#commands/backfill_organizations` does not exist.

- [ ] **Step 3: Implement the Ace command**

```typescript
// apps/backend/commands/backfill_organizations.ts
import { BaseCommand } from "@adonisjs/core/ace";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { sql } from "drizzle-orm";

export default class BackfillOrganizations extends BaseCommand {
  static commandName = "backfill:organizations";
  static description = "Seed core/prodigy/summit organizations";

  async run() {
    const rows = [
      {
        slug: "core",
        name: "Studio 2 Stadium",
        features: {},
        settings: {},
      },
      {
        slug: "prodigy",
        name: "Prodigy",
        features: {},
        settings: {},
      },
      {
        slug: "summit",
        name: "Sharpen Up - The Summit",
        primaryColor: "#1a1a2e",
        accentColor: "#e94560",
        features: {
          callbacks: true,
          qna: true,
          school_selections: true,
          video_library: true,
          video_coach_assignment: false,
          video_dancer_assignment: false,
          schedule_pdf: true,
        },
        settings: {
          premium_period_days: 90,
          max_school_selections: 3,
          rating_scale_max: 10,
          registration_url_path: "SharpenUpSummit",
        },
      },
    ];

    await db
      .insert(organizations)
      .values(rows)
      .onConflictDoNothing({ target: organizations.slug });

    this.logger.success(`Ensured ${rows.length} organizations.`);
  }
}
```

- [ ] **Step 4: Register the command in ace**

Add `() => import("./commands/backfill_organizations.js")` to the command list (check `adonisrc.ts` for the existing pattern).

- [ ] **Step 5: Run the test to verify it passes**

Run: `node ace test --files "app/modules/organizations/seed.test.ts"`
Expected: PASS.

- [ ] **Step 6: Run the command against dev DB**

Run: `node ace backfill:organizations`
Expected: "Ensured 3 organizations." Re-running produces the same output with no new rows.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/commands/backfill_organizations.ts apps/backend/adonisrc.ts apps/backend/app/modules/organizations/seed.test.ts
git commit -m "feat(orgs): seed core, prodigy, summit organizations"
```

---

## Task 5: Migrate `user_platforms` → `org_memberships`

**Files:**
- Create: `apps/backend/commands/backfill_org_memberships.ts`
- Test: `apps/backend/commands/backfill_org_memberships.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/commands/backfill_org_memberships.test.ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { platforms } from "#database/schema/users";
import { orgMemberships } from "#database/schema/organizations";
import { organizations } from "#database/schema/organizations";
import { eq, and } from "drizzle-orm";

test.group("backfill org memberships", (group) => {
  group.each.setup(async () => {
    await db.delete(orgMemberships).execute();
    await db.delete(platforms).execute();
  });

  test("creates org_memberships rows for every user_platforms row", async ({ assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "t1", email: "t1@x.co", role: "user", type: "dancer",
        displayEmail: "t1@x.co", firstName: "T", lastName: "One", password: "x",
      })
      .returning();
    await db.insert(platforms).values({ userId: u.id, platformName: "prodigy" });

    const { default: Cmd } = await import("#commands/backfill_org_memberships");
    await new Cmd().run();

    const [prodigy] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "prodigy"));
    const rows = await db
      .select()
      .from(orgMemberships)
      .where(and(eq(orgMemberships.userId, u.id), eq(orgMemberships.orgId, prodigy.id)));
    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.type, "dancer");
    assert.equal(rows[0]!.role, "member");
  });

  test("promotes prodigy_admin role users to admin on prodigy org", async ({ assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "admin1", email: "admin1@x.co", role: "prodigy_admin", type: "dancer",
        displayEmail: "admin1@x.co", firstName: "A", lastName: "One", password: "x",
      })
      .returning();
    await db.insert(platforms).values({ userId: u.id, platformName: "prodigy" });

    const { default: Cmd } = await import("#commands/backfill_org_memberships");
    await new Cmd().run();

    const [prodigy] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "prodigy"));
    const [row] = await db
      .select()
      .from(orgMemberships)
      .where(and(eq(orgMemberships.userId, u.id), eq(orgMemberships.orgId, prodigy.id)));
    assert.equal(row!.role, "admin");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node ace test --files "commands/backfill_org_memberships.test.ts"`
Expected: FAIL — command does not exist.

- [ ] **Step 3: Implement the command**

```typescript
// apps/backend/commands/backfill_org_memberships.ts
import { BaseCommand } from "@adonisjs/core/ace";
import { db } from "#database/connection";
import { platforms, users } from "#database/schema/users";
import {
  organizations,
  orgMemberships,
} from "#database/schema/organizations";
import { eq } from "drizzle-orm";

export default class BackfillOrgMemberships extends BaseCommand {
  static commandName = "backfill:org-memberships";
  static description = "Migrate user_platforms rows to org_memberships";

  async run() {
    const orgs = await db.select().from(organizations);
    const slugToId = new Map(orgs.map((o) => [o.slug, o.id]));

    const rows = await db
      .select({
        userId: platforms.userId,
        platformName: platforms.platformName,
        role: users.role,
        type: users.type,
      })
      .from(platforms)
      .innerJoin(users, eq(users.id, platforms.userId));

    let inserted = 0;
    for (const row of rows) {
      const orgId = slugToId.get(row.platformName);
      if (!orgId) continue;

      const memberType = row.type === "school" ? "coach" : "dancer";
      const role =
        row.platformName === "prodigy" && row.role === "prodigy_admin"
          ? "admin"
          : "member";

      await db
        .insert(orgMemberships)
        .values({ userId: row.userId, orgId, type: memberType, role })
        .onConflictDoNothing({
          target: [orgMemberships.userId, orgMemberships.orgId],
        });
      inserted += 1;
    }

    this.logger.success(`Backfilled ${inserted} memberships.`);
  }
}
```

- [ ] **Step 4: Register the command**

Add to `adonisrc.ts` commands list.

- [ ] **Step 5: Run the test to verify it passes**

Run: `node ace test --files "commands/backfill_org_memberships.test.ts"`
Expected: PASS (both cases).

- [ ] **Step 6: Run against dev DB**

Run: `node ace backfill:org-memberships`

- [ ] **Step 7: Commit**

```bash
git add apps/backend/commands/backfill_org_memberships.ts apps/backend/commands/backfill_org_memberships.test.ts apps/backend/adonisrc.ts
git commit -m "feat(orgs): backfill user_platforms into org_memberships"
```

---

## Task 6: Add `source_org_id` to `school_favorites` (additive)

**Files:**
- Modify: `apps/backend/app/database/schema/profiles.ts`

- [ ] **Step 1: Add the new column alongside the existing `platformName`**

```typescript
// apps/backend/app/database/schema/profiles.ts (inside favorites table definition)
import { organizations } from "./organizations.ts";
// ...
sourceOrgId: pg
  .uuid()
  .references(() => organizations.id, { onDelete: "set null" }),
```

Keep `platformName` in place until Task 9.

- [ ] **Step 2: Generate migration**

Run: `pnpm --filter backend db:generate`
Expected: new SQL adding `source_org_id uuid null` + FK.

- [ ] **Step 3: Apply**

Run: `pnpm --filter backend db:migrate`

- [ ] **Step 4: Backfill existing rows (write a one-line command)**

```typescript
// apps/backend/commands/backfill_school_favorites_org.ts
import { BaseCommand } from "@adonisjs/core/ace";
import { db } from "#database/connection";
import { favorites } from "#database/schema/profiles";
import { organizations } from "#database/schema/organizations";
import { eq, sql } from "drizzle-orm";

export default class BackfillSchoolFavoritesOrg extends BaseCommand {
  static commandName = "backfill:school-favorites-org";
  static description = "Fill school_favorites.source_org_id from platform_name";

  async run() {
    const orgs = await db.select().from(organizations);
    for (const org of orgs) {
      await db
        .update(favorites)
        .set({ sourceOrgId: org.id })
        .where(eq(favorites.platformName, org.slug as "core" | "prodigy"));
    }
    this.logger.success("school_favorites.source_org_id populated.");
  }
}
```

- [ ] **Step 5: Register + run**

Run: `node ace backfill:school-favorites-org`

- [ ] **Step 6: Commit**

```bash
git add -A apps/backend/app/database/schema/profiles.ts apps/backend/app/database/drizzle apps/backend/commands/backfill_school_favorites_org.ts apps/backend/adonisrc.ts
git commit -m "feat(db): add school_favorites.source_org_id and backfill"
```

---

## Task 7: Update `SubscribedMiddleware` to honour `premium_grants`

**Files:**
- Modify: `apps/backend/app/middleware/routes/subscribed.ts`
- Create: `apps/backend/app/middleware/routes/subscribed.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/middleware/routes/subscribed.test.ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { premiumGrants } from "#database/schema/organizations";

test.group("subscribed middleware", (group) => {
  group.each.setup(async () => {
    await db.delete(premiumGrants).execute();
  });

  test("allows user with an active premium grant", async ({ client, assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "g1", email: "g1@x.co", role: "user", type: "dancer",
        displayEmail: "g1@x.co", firstName: "G", lastName: "One", password: "x",
      })
      .returning();
    await db.insert(premiumGrants).values({
      userId: u.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    });

    const response = await client
      .post("/subscriptions/manage") // route guarded by middleware.subscribed()
      .loginAs(u);
    assert.notEqual(response.status(), 403);
  });

  test("rejects user with no subscription and no grant", async ({ client }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "g2", email: "g2@x.co", role: "user", type: "dancer",
        displayEmail: "g2@x.co", firstName: "G", lastName: "Two", password: "x",
      })
      .returning();
    const response = await client.post("/subscriptions/manage").loginAs(u);
    response.assertStatus(403);
  });

  test("rejects user with an expired grant", async ({ client }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "g3", email: "g3@x.co", role: "user", type: "dancer",
        displayEmail: "g3@x.co", firstName: "G", lastName: "Three", password: "x",
      })
      .returning();
    await db.insert(premiumGrants).values({
      userId: u.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() - 1000),
    });
    const response = await client.post("/subscriptions/manage").loginAs(u);
    response.assertStatus(403);
  });
});
```

- [ ] **Step 2: Run tests to confirm the grant case fails**

Run: `node ace test --files "app/middleware/routes/subscribed.test.ts"`
Expected: the "allows user with an active premium grant" case fails (403 instead of passing through).

- [ ] **Step 3: Update the middleware**

```typescript
// apps/backend/app/middleware/routes/subscribed.ts
import { db } from "#database/connection";
import { subscriptions } from "#database/schema/subscriptions";
import { premiumGrants } from "#database/schema/organizations";
import { type HttpContext } from "@adonisjs/core/http";
import { type NextFn } from "@adonisjs/core/types/http";
import { and, eq, gt, isNull } from "drizzle-orm";

export default class SubscribedMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const session = ctx.auth.getUserOrFail();

    if (session.role === "admin") return next();

    const [sub] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, session.id),
          eq(subscriptions.status, "active"),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .limit(1);
    if (sub) return next();

    const [grant] = await db
      .select({ id: premiumGrants.id })
      .from(premiumGrants)
      .where(
        and(
          eq(premiumGrants.userId, session.id),
          gt(premiumGrants.expiresAt, new Date()),
          isNull(premiumGrants.revokedAt)
        )
      )
      .limit(1);
    if (grant) return next();

    return ctx.response.forbidden({
      message: "This feature is only available to premium users.",
    });
  }
}
```

- [ ] **Step 4: Run the tests again**

Run: `node ace test --files "app/middleware/routes/subscribed.test.ts"`
Expected: all three cases PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/app/middleware/routes/subscribed.ts apps/backend/app/middleware/routes/subscribed.test.ts
git commit -m "feat(subs): honour premium_grants in SubscribedMiddleware"
```

---

## Task 8: Update `GET /subscriptions` to expose grant source

**Files:**
- Modify: `apps/backend/app/modules/subscriptions/get-status/service.ts`
- Modify: `apps/backend/app/modules/subscriptions/get-status/controller.ts`
- Create: `apps/backend/app/modules/subscriptions/get-status/service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/modules/subscriptions/get-status/service.test.ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, premiumGrants } from "#database/schema/organizations";
import { GetSubscriptionService } from "./service.ts";
import { DatabaseService } from "#database/service";

test.group("GetSubscriptionService", (group) => {
  group.each.setup(async () => {
    await db.delete(premiumGrants).execute();
  });

  test("returns source='org_event' and grantedBy slug when only a grant exists", async ({ assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "s1", email: "s1@x.co", role: "user", type: "dancer",
        displayEmail: "s1@x.co", firstName: "S", lastName: "One", password: "x",
      })
      .returning();
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    // A grant sourced from an org event — sourceId is nullable for now until Plan 3 lands org_events
    await db.insert(premiumGrants).values({
      userId: u.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(u.id);

    assert.isTrue(result.subscribed);
    assert.equal(result.source, "org_event");
    assert.exists(result.currentPeriodEnd);
  });

  test("returns source='none' for user with nothing", async ({ assert }) => {
    const [u] = await db
      .insert(users)
      .values({
        username: "s2", email: "s2@x.co", role: "user", type: "dancer",
        displayEmail: "s2@x.co", firstName: "S", lastName: "Two", password: "x",
      })
      .returning();
    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(u.id);
    assert.isFalse(result.subscribed);
    assert.equal(result.source, "none");
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/modules/subscriptions/get-status/service.test.ts"`
Expected: FAIL — service doesn't return `source` yet.

- [ ] **Step 3: Update the service**

```typescript
// apps/backend/app/modules/subscriptions/get-status/service.ts
import { DatabaseService } from "#database/service";
import { premiumGrants } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

@inject()
export class GetSubscriptionService {
  constructor(private db: DatabaseService) {}

  async execute(userId: string) {
    const subscription = await this.db.use((db) =>
      db.query.subscriptions.findFirst({
        where: { userId, status: "active" },
      })
    );

    if (subscription) {
      return {
        subscribed: true,
        source: "stripe" as const,
        currentPeriodEnd: subscription.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        grantedBy: null,
      };
    }

    const grant = await this.db.use((db) =>
      db
        .select()
        .from(premiumGrants)
        .where(
          and(
            eq(premiumGrants.userId, userId),
            gt(premiumGrants.expiresAt, new Date()),
            isNull(premiumGrants.revokedAt)
          )
        )
        .orderBy(desc(premiumGrants.expiresAt))
        .limit(1)
        .then((rows) => rows[0])
    );

    if (grant) {
      return {
        subscribed: true,
        source: "org_event" as const,
        currentPeriodEnd: grant.expiresAt,
        cancelAtPeriodEnd: false,
        grantedBy: null, // Plan 3 will resolve org slug from sourceId
      };
    }

    return {
      subscribed: false,
      source: "none" as const,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      grantedBy: null,
    };
  }
}
```

- [ ] **Step 4: Run tests**

Run: `node ace test --files "app/modules/subscriptions/get-status/service.test.ts"`
Expected: both cases PASS.

- [ ] **Step 5: Regenerate OpenAPI + frontend types**

Run: `pnpm --filter backend make:docs`
Expected: `openapi.json` updated with new fields. Inspect diff.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/modules/subscriptions/get-status apps/backend/openapi.json
git commit -m "feat(subs): return source and grantedBy in GET /subscriptions"
```

---

## Task 9: Final cleanup — drop `user_platforms`, `platform_name`, `prodigy_admin`

**Only run this task after Tasks 5 and 6 have completed in all environments.** This is the destructive step.

**Files:**
- Modify: `apps/backend/app/database/schema/users.ts` (remove `platforms` export)
- Modify: `apps/backend/app/database/schema/profiles.ts` (remove `platformName` column)
- Modify: `apps/backend/app/database/schema/enums.ts` (remove `platformName` and `prodigy_admin`)
- Modify: `apps/backend/app/utils` anywhere that checks `prodigy_admin`

- [ ] **Step 1: Grep for remaining usages**

Run: `grep -rn "prodigy_admin\|platformName\|user_platforms\|platform_name" apps/backend/app`
Expected: only the files listed above and test fixtures — no live callsites. Resolve any surprises before proceeding.

- [ ] **Step 2: Remove `platforms` table export from `users.ts`**

Delete the `platforms = pg.pgTable("user_platforms", ...)` block.

- [ ] **Step 3: Remove `platformName` column from `favorites` in `profiles.ts`**

```typescript
// apps/backend/app/database/schema/profiles.ts — delete this line:
// platformName: platformName().notNull(),
```

Remove the `platformName` import at the top.

- [ ] **Step 4: Remove the enums**

In `enums.ts`, delete:

```typescript
export const platformName = pgEnum("platform_name", ["core", "prodigy"]);
```

And update `role` enum:

```typescript
export const role = pgEnum("role", ["admin", "user"]);
```

- [ ] **Step 5: Fix any callsites the grep surfaced**

For each file, remove `prodigy_admin` comparisons. In `isAdmin()` utilities, only `"admin"` remains.

- [ ] **Step 6: Generate destructive migration**

Run: `pnpm --filter backend db:generate`
Expected: SQL that drops `user_platforms`, drops `platform_name` enum, and alters the `role` enum to remove `prodigy_admin`. Drizzle will generate an enum recreation — inspect it carefully.

- [ ] **Step 7: Apply**

Run: `pnpm --filter backend db:migrate`

- [ ] **Step 8: Run the full backend test suite**

Run: `pnpm --filter backend test`
Expected: all tests pass.

- [ ] **Step 9: Commit**

```bash
git add -A apps/backend
git commit -m "refactor(db): drop user_platforms, platform_name, prodigy_admin"
```

---

## Task 10: Verification

- [ ] **Step 1: Fresh DB round-trip**

Run:
```bash
pnpm --filter backend db:reset
pnpm --filter backend db:migrate
node ace backfill:organizations
```
Expected: clean boot, seed, no errors.

- [ ] **Step 2: Full test suite**

Run: `pnpm --filter backend test`
Expected: green.

- [ ] **Step 3: Typecheck + lint**

Run: `pnpm --filter backend typecheck && pnpm --filter backend lint`
Expected: clean.

- [ ] **Step 4: Manual smoke — hit `GET /subscriptions`**

Log in as a user, hit the endpoint. Expected response shape:
```json
{
  "subscribed": false,
  "source": "none",
  "currentPeriodEnd": null,
  "cancelAtPeriodEnd": false,
  "grantedBy": null
}
```

- [ ] **Step 5: Final commit if anything drifted**

```bash
git status
# only add if dirty
```

---

## Definition of Done

- `organizations`, `org_memberships`, `premium_grants` tables exist and are populated for core/prodigy/summit.
- `user_platforms`, `platform_name` enum, `prodigy_admin` role are removed.
- `SubscribedMiddleware` honors grants; `GET /subscriptions` exposes `source` and `grantedBy`.
- All backend tests pass. `typecheck` + `lint` clean.
- Dev DB can be reset and migrated cleanly from scratch.
