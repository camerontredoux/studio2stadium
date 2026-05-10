# Summit Plan 02 — Org Shell (Routing, Middleware, Branded Login)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Make `/orgs/:slug` real end-to-end: public org info endpoint, full org middleware stack on the backend, `_org` layout + `OrgProvider` on the frontend with CSS-variable theming and a branded login page.

**Architecture:** A single public `GET /orgs/:slug` returns org info + features. Frontend `_org/route.tsx` loads it before any auth and sets `--org-primary` / `--org-accent` CSS variables. Backend gains a composable middleware stack (`org`, `orgEvent`, `orgMember`, `orgAdmin`, `orgCoach`, `orgDancer`, `orgFeature`). Dancer registration via invite token lives here because it's the first authenticated surface a new Summit user ever touches.

**Tech Stack:** Adonis 6 middleware, Drizzle ORM, VineJS, TanStack Router, TanStack Query, shadcn/ui.

**Source spec sections:** 4 (Auth & Routing), 5 (Frontend Architecture).

**Depends on:** Plan 01 (Foundation).

**Blocks:** Plans 03–07.

---

## UX Concerns Folded In

- **Branded login is the P1 first impression.** `GET /orgs/:slug` must be public (no auth) so the login page can render the Summit logo and colors *before* the user signs in. A generic login page would kill the white-label promise.
- **Mobile-first.** Registration is the first touch for new Summit dancers — they'll open the invite email on a phone in their kitchen. Form is single-column, large tap targets (≥44px), autofocus first field, no multi-step wizard.
- **Feature gating is invisible, not disabled.** `orgFeature('x')` middleware returns **404**, not 403. Frontend never renders gated UI — it reads `useOrg().hasFeature("x")` and short-circuits. No "upgrade to unlock" copy.
- **Role hat switching.** Header shows `"Summit · Coach"` or `"Summit · Dancer"` so users who belong to multiple orgs always know where they are and what role they're in.
- **`OrgProvider` must not flash unthemed.** The CSS variables are set synchronously before the first paint of authenticated UI — pending state shows a minimal themed skeleton, not the default shadcn greyscale.

---

## File Map

**Backend create:**
- `apps/backend/app/modules/orgs/routes.ts`
- `apps/backend/app/modules/orgs/get-org/{controller,service,validator}.ts`
- `apps/backend/app/modules/orgs/register-dancer/{controller,service,validator}.ts`
- `apps/backend/app/middleware/routes/org.ts`
- `apps/backend/app/middleware/routes/org_event.ts`
- `apps/backend/app/middleware/routes/org_member.ts`
- `apps/backend/app/middleware/routes/org_admin.ts`
- `apps/backend/app/middleware/routes/org_coach.ts`
- `apps/backend/app/middleware/routes/org_dancer.ts`
- `apps/backend/app/middleware/routes/org_feature.ts`
- `apps/backend/app/shared/org/features-schema.ts` — VineJS validator for features JSONB
- Tests: `app/modules/orgs/get-org/service.test.ts`, `app/middleware/routes/org.test.ts`, `app/middleware/routes/org_feature.test.ts`

**Backend modify:**
- `apps/backend/start/kernel.ts` — register named middlewares
- `apps/backend/start/routes.ts` — import `#modules/orgs/routes`

**Frontend create:**
- `apps/frontend/src/routes/_org/route.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/login.tsx`
- `apps/frontend/src/routes/_org/$orgSlug/register.tsx`
- `apps/frontend/src/features/org/context/org-provider.tsx`
- `apps/frontend/src/features/org/context/use-org.ts`
- `apps/frontend/src/features/org/api/queries.ts`
- `apps/frontend/src/features/org/components/org-header.tsx`
- `apps/frontend/src/features/org/components/org-login-form.tsx`
- `apps/frontend/src/features/org/components/org-register-form.tsx`
- `apps/frontend/src/features/org/components/themed-pending.tsx`

---

## Task 1: Extend seed to support dancer invite tokens

**Files:**
- Modify: `apps/backend/app/database/schema/organizations.ts` — add a small `dancerInvites` table now (used by register flow); it's tiny enough to belong in this plan.
- Test: `apps/backend/app/modules/orgs/register-dancer/service.test.ts`

- [ ] **Step 1: Add the `dancerInvites` table**

```typescript
// apps/backend/app/database/schema/organizations.ts (append)
export const dancerInvites = pg.pgTable(
  "org_dancer_invites",
  {
    id: pg.uuid().primaryKey().defaultRandom(),
    orgId: pg
      .uuid()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: pg.text().notNull(),
    token: pg.varchar({ length: 64 }).notNull().unique(),
    expiresAt: pg.timestamp({ withTimezone: true }).notNull(),
    consumedAt: pg.timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    pg.index().on(table.orgId, table.email),
    pg.index().on(table.token),
  ]
);
```

- [ ] **Step 2: Generate migration + apply**

Run: `pnpm --filter backend db:generate && pnpm --filter backend db:migrate`

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter backend typecheck`

- [ ] **Step 4: Commit**

```bash
git add apps/backend/app/database/schema/organizations.ts apps/backend/app/database/drizzle
git commit -m "feat(db): add org_dancer_invites table"
```

---

## Task 2: `GET /orgs/:slug` public endpoint

**Files:**
- Create: `apps/backend/app/modules/orgs/get-org/{validator,service,controller}.ts`
- Create: `apps/backend/app/modules/orgs/routes.ts`
- Test: `apps/backend/app/modules/orgs/get-org/service.test.ts`
- Modify: `apps/backend/start/routes.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/modules/orgs/get-org/service.test.ts
import { test } from "@japa/runner";

test.group("GET /orgs/:slug", () => {
  test("returns org metadata for summit", async ({ client, assert }) => {
    const response = await client.get("/orgs/summit");
    response.assertStatus(200);
    const body = response.body();
    assert.equal(body.slug, "summit");
    assert.equal(body.name, "Sharpen Up - The Summit");
    assert.isObject(body.features);
    assert.equal(body.primaryColor, "#1a1a2e");
  });

  test("returns 404 for unknown slug", async ({ client }) => {
    const response = await client.get("/orgs/does-not-exist");
    response.assertStatus(404);
  });

  test("is public (no auth header)", async ({ client }) => {
    const response = await client.get("/orgs/summit");
    response.assertStatus(200);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node ace test --files "app/modules/orgs/get-org/service.test.ts"`
Expected: 404 on all because routes do not exist.

- [ ] **Step 3: Implement validator, service, controller**

```typescript
// apps/backend/app/modules/orgs/get-org/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.create(vine.object({ slug: vine.string() }));
export type Validator = Infer<typeof schema>;
```

```typescript
// apps/backend/app/modules/orgs/get-org/service.ts
import { DatabaseService } from "#database/service";
import { organizations } from "#database/schema/organizations";
import { inject } from "@adonisjs/core";
import { eq } from "drizzle-orm";

@inject()
export class GetOrgService {
  constructor(private db: DatabaseService) {}

  async execute(slug: string) {
    return this.db.use((db) =>
      db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    );
  }
}
```

```typescript
// apps/backend/app/modules/orgs/get-org/controller.ts
import { GetOrgService } from "./service.ts";
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";

export default class GetOrgController {
  @inject()
  async handle({ params, response }: HttpContext, service: GetOrgService) {
    const org = await service.execute(params.slug);
    if (!org) return response.notFound({ message: "Organization not found." });
    return response.ok({
      id: org.id,
      slug: org.slug,
      name: org.name,
      logoUrl: org.logoUrl,
      primaryColor: org.primaryColor,
      accentColor: org.accentColor,
      features: org.features,
      settings: org.settings,
    });
  }
}
```

- [ ] **Step 4: Create the routes file**

```typescript
// apps/backend/app/modules/orgs/routes.ts
import router from "@adonisjs/core/services/router";

const GetOrgController = () => import("./get-org/controller.ts");

router
  .group(() => {
    router.get(":slug", [GetOrgController]).openapi({
      summary: "Get organization",
      description: "Public org metadata + branding for the login page",
    });
  })
  .prefix("orgs")
  .openapi({ tags: ["Organizations"] });
```

- [ ] **Step 5: Register the routes module**

```typescript
// apps/backend/start/routes.ts (add in alphabetical position)
import "#modules/orgs/routes";
```

- [ ] **Step 6: Run tests**

Run: `node ace test --files "app/modules/orgs/get-org/service.test.ts"`
Expected: all three cases PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/backend/app/modules/orgs apps/backend/start/routes.ts
git commit -m "feat(orgs): public GET /orgs/:slug endpoint"
```

---

## Task 3: `org` middleware — resolves org from URL param

**Files:**
- Create: `apps/backend/app/middleware/routes/org.ts`
- Test: `apps/backend/app/middleware/routes/org.test.ts`
- Modify: `apps/backend/start/kernel.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/middleware/routes/org.test.ts
import { test } from "@japa/runner";
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";

// Register a throwaway route guarded by middleware.org()
router
  .get("/orgs/:slug/_test_org_middleware", ({ response, request }) => {
    return response.ok({ org: (request as any).org?.slug ?? null });
  })
  .use(middleware.org());

test.group("org middleware", () => {
  test("attaches ctx.org for valid slug", async ({ client, assert }) => {
    const res = await client.get("/orgs/summit/_test_org_middleware");
    res.assertStatus(200);
    assert.equal(res.body().org, "summit");
  });
  test("404 for unknown slug", async ({ client }) => {
    const res = await client.get("/orgs/nope/_test_org_middleware");
    res.assertStatus(404);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/middleware/routes/org.test.ts"`
Expected: fails — middleware does not exist.

- [ ] **Step 3: Implement middleware**

```typescript
// apps/backend/app/middleware/routes/org.ts
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { eq } from "drizzle-orm";

declare module "@adonisjs/core/http" {
  interface HttpContext {
    org?: typeof organizations.$inferSelect;
  }
}

export default class OrgMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const slug = ctx.params.slug;
    if (!slug) {
      return ctx.response.notFound({ message: "Organization not specified." });
    }
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (!org) {
      return ctx.response.notFound({ message: "Organization not found." });
    }
    ctx.org = org;
    return next();
  }
}
```

- [ ] **Step 4: Register in kernel**

```typescript
// apps/backend/start/kernel.ts (add inside router.named({...}))
org: () => import("#middleware/routes/org"),
```

- [ ] **Step 5: Run tests**

Run: `node ace test --files "app/middleware/routes/org.test.ts"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/middleware/routes/org.ts apps/backend/start/kernel.ts apps/backend/app/middleware/routes/org.test.ts
git commit -m "feat(orgs): org middleware resolves ctx.org from :slug"
```

---

## Task 4: `orgMember`, `orgAdmin`, `orgCoach`, `orgDancer` middlewares

**Files:**
- Create: the four files under `app/middleware/routes/`
- Test: `apps/backend/app/middleware/routes/org_roles.test.ts`
- Modify: `apps/backend/start/kernel.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/middleware/routes/org_roles.test.ts
import { test } from "@japa/runner";
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships } from "#database/schema/organizations";
import { eq } from "drizzle-orm";

router
  .get("/orgs/:slug/_test_member", ({ response }) => response.ok({ ok: true }))
  .use([middleware.auth(), middleware.org(), middleware.orgMember()]);

router
  .get("/orgs/:slug/_test_admin", ({ response }) => response.ok({ ok: true }))
  .use([middleware.auth(), middleware.org(), middleware.orgAdmin()]);

test.group("org role middlewares", (group) => {
  group.each.setup(async () => {
    await db.delete(orgMemberships).execute();
  });

  test("orgMember allows members, rejects non-members", async ({ client }) => {
    const [member] = await db.insert(users).values({
      username: "m1", email: "m1@x.co", role: "user", type: "dancer",
      displayEmail: "m1@x.co", firstName: "M", lastName: "One", password: "x",
    }).returning();
    const [outsider] = await db.insert(users).values({
      username: "o1", email: "o1@x.co", role: "user", type: "dancer",
      displayEmail: "o1@x.co", firstName: "O", lastName: "One", password: "x",
    }).returning();
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    await db.insert(orgMemberships).values({
      userId: member.id, orgId: summit.id, type: "dancer", role: "member",
    });

    const ok = await client.get("/orgs/summit/_test_member").loginAs(member);
    ok.assertStatus(200);
    const no = await client.get("/orgs/summit/_test_member").loginAs(outsider);
    no.assertStatus(403);
  });

  test("orgAdmin requires role=admin", async ({ client }) => {
    const [u] = await db.insert(users).values({
      username: "a1", email: "a1@x.co", role: "user", type: "dancer",
      displayEmail: "a1@x.co", firstName: "A", lastName: "One", password: "x",
    }).returning();
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    await db.insert(orgMemberships).values({
      userId: u.id, orgId: summit.id, type: "dancer", role: "member",
    });
    const no = await client.get("/orgs/summit/_test_admin").loginAs(u);
    no.assertStatus(403);

    await db.update(orgMemberships).set({ role: "admin" }).where(eq(orgMemberships.userId, u.id));
    const ok = await client.get("/orgs/summit/_test_admin").loginAs(u);
    ok.assertStatus(200);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/middleware/routes/org_roles.test.ts"`
Expected: fails — middlewares not registered.

- [ ] **Step 3: Implement `orgMember`**

```typescript
// apps/backend/app/middleware/routes/org_member.ts
import { db } from "#database/connection";
import { orgMemberships } from "#database/schema/organizations";
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import { and, eq } from "drizzle-orm";

declare module "@adonisjs/core/http" {
  interface HttpContext {
    orgMembership?: typeof orgMemberships.$inferSelect;
  }
}

export default class OrgMemberMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail();
    if (!ctx.org) return ctx.response.notFound({ message: "Org not resolved." });
    const [m] = await db
      .select()
      .from(orgMemberships)
      .where(
        and(eq(orgMemberships.userId, user.id), eq(orgMemberships.orgId, ctx.org.id))
      )
      .limit(1);
    if (!m) {
      return ctx.response.forbidden({ message: "You are not a member of this organization." });
    }
    ctx.orgMembership = m;
    return next();
  }
}
```

- [ ] **Step 4: Implement `orgAdmin`**

```typescript
// apps/backend/app/middleware/routes/org_admin.ts
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";
import OrgMemberMiddleware from "./org_member.ts";

export default class OrgAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Rely on org_member having resolved membership; otherwise resolve it now.
    if (!ctx.orgMembership) {
      const inner = new OrgMemberMiddleware();
      let ok = false;
      await inner.handle(ctx, async () => {
        ok = true;
      });
      if (!ok) return;
    }
    if (ctx.orgMembership!.role !== "admin") {
      return ctx.response.forbidden({ message: "Admin access required." });
    }
    return next();
  }
}
```

- [ ] **Step 5: Implement `orgCoach` and `orgDancer`**

```typescript
// apps/backend/app/middleware/routes/org_coach.ts
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class OrgCoachMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const m = ctx.orgMembership;
    if (!m) return ctx.response.forbidden({ message: "Membership not resolved." });
    // Admin implies coach access for coach-scoped routes.
    if (m.type !== "coach" && m.role !== "admin") {
      return ctx.response.forbidden({ message: "Coach access required." });
    }
    return next();
  }
}
```

```typescript
// apps/backend/app/middleware/routes/org_dancer.ts
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class OrgDancerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const m = ctx.orgMembership;
    if (!m) return ctx.response.forbidden({ message: "Membership not resolved." });
    if (m.type !== "dancer") {
      return ctx.response.forbidden({ message: "Dancer access required." });
    }
    return next();
  }
}
```

- [ ] **Step 6: Register all four in kernel**

```typescript
// apps/backend/start/kernel.ts (add inside router.named({...}))
orgMember: () => import("#middleware/routes/org_member"),
orgAdmin: () => import("#middleware/routes/org_admin"),
orgCoach: () => import("#middleware/routes/org_coach"),
orgDancer: () => import("#middleware/routes/org_dancer"),
```

- [ ] **Step 7: Run tests**

Run: `node ace test --files "app/middleware/routes/org_roles.test.ts"`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/backend/app/middleware/routes/org_*.ts apps/backend/start/kernel.ts apps/backend/app/middleware/routes/org_roles.test.ts
git commit -m "feat(orgs): orgMember/Admin/Coach/Dancer middlewares"
```

---

## Task 5: `orgFeature(key)` middleware — 404 on disabled features

**Files:**
- Create: `apps/backend/app/middleware/routes/org_feature.ts`
- Test: `apps/backend/app/middleware/routes/org_feature.test.ts`
- Modify: `apps/backend/start/kernel.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/middleware/routes/org_feature.test.ts
import { test } from "@japa/runner";
import router from "@adonisjs/core/services/router";
import { middleware } from "#start/kernel";

router
  .get("/orgs/:slug/_test_feat_callbacks", ({ response }) => response.ok({ ok: true }))
  .use([middleware.org(), middleware.orgFeature("callbacks")]);

router
  .get("/orgs/:slug/_test_feat_missing", ({ response }) => response.ok({ ok: true }))
  .use([middleware.org(), middleware.orgFeature("nonexistent_feature")]);

test.group("orgFeature middleware", () => {
  test("allows when feature enabled", async ({ client }) => {
    const res = await client.get("/orgs/summit/_test_feat_callbacks");
    res.assertStatus(200); // Summit seeds callbacks=true
  });

  test("404s when feature missing or false", async ({ client }) => {
    const res = await client.get("/orgs/summit/_test_feat_missing");
    res.assertStatus(404);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/middleware/routes/org_feature.test.ts"`
Expected: fails.

- [ ] **Step 3: Implement**

```typescript
// apps/backend/app/middleware/routes/org_feature.ts
import type { HttpContext } from "@adonisjs/core/http";
import type { NextFn } from "@adonisjs/core/types/http";

export default class OrgFeatureMiddleware {
  async handle(ctx: HttpContext, next: NextFn, args: [string]) {
    const [key] = args;
    const features = (ctx.org?.features ?? {}) as Record<string, boolean>;
    if (!features[key]) {
      return ctx.response.notFound({ message: "Not found." });
    }
    return next();
  }
}
```

- [ ] **Step 4: Register**

```typescript
// apps/backend/start/kernel.ts
orgFeature: () => import("#middleware/routes/org_feature"),
```

- [ ] **Step 5: Run tests**

Run: `node ace test --files "app/middleware/routes/org_feature.test.ts"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/app/middleware/routes/org_feature.ts apps/backend/app/middleware/routes/org_feature.test.ts apps/backend/start/kernel.ts
git commit -m "feat(orgs): orgFeature middleware 404s disabled features"
```

---

## Task 6: `POST /orgs/:slug/register` — dancer self-registration via invite token

**Files:**
- Create: `apps/backend/app/modules/orgs/register-dancer/{validator,service,controller}.ts`
- Test: `apps/backend/app/modules/orgs/register-dancer/service.test.ts`
- Modify: `apps/backend/app/modules/orgs/routes.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/backend/app/modules/orgs/register-dancer/service.test.ts
import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  organizations,
  orgMemberships,
  dancerInvites,
  premiumGrants,
} from "#database/schema/organizations";
import { eq } from "drizzle-orm";

test.group("POST /orgs/:slug/register", (group) => {
  group.each.setup(async () => {
    await db.delete(dancerInvites).execute();
  });

  test("consumes invite, creates user, membership, premium grant", async ({ client, assert }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit.id,
      email: "newdancer@x.co",
      token: "tok_abc",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const res = await client.post("/orgs/summit/register").json({
      token: "tok_abc",
      firstName: "New",
      lastName: "Dancer",
      password: "CorrectHorse1!",
    });
    res.assertStatus(201);

    const [user] = await db.select().from(users).where(eq(users.email, "newdancer@x.co"));
    assert.exists(user);
    const [m] = await db.select().from(orgMemberships).where(eq(orgMemberships.userId, user.id));
    assert.equal(m.type, "dancer");
    assert.equal(m.role, "member");
    const [grant] = await db.select().from(premiumGrants).where(eq(premiumGrants.userId, user.id));
    assert.exists(grant);
    const [inv] = await db.select().from(dancerInvites).where(eq(dancerInvites.token, "tok_abc"));
    assert.exists(inv.consumedAt);
  });

  test("rejects expired token", async ({ client }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit.id, email: "old@x.co", token: "tok_exp",
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await client.post("/orgs/summit/register").json({
      token: "tok_exp", firstName: "X", lastName: "Y", password: "CorrectHorse1!",
    });
    res.assertStatus(400);
  });

  test("rejects token from a different org", async ({ client }) => {
    const [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    await db.insert(dancerInvites).values({
      orgId: summit.id, email: "x@x.co", token: "tok_wrongorg",
      expiresAt: new Date(Date.now() + 86400000),
    });
    const res = await client.post("/orgs/prodigy/register").json({
      token: "tok_wrongorg", firstName: "X", lastName: "Y", password: "CorrectHorse1!",
    });
    res.assertStatus(400);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `node ace test --files "app/modules/orgs/register-dancer/service.test.ts"`
Expected: 404 — route not wired.

- [ ] **Step 3: Implement validator**

```typescript
// apps/backend/app/modules/orgs/register-dancer/validator.ts
import vine from "@vinejs/vine";
import { type Infer } from "@vinejs/vine/types";

export const schema = vine.compile(
  vine.object({
    token: vine.string().trim().minLength(8).maxLength(64),
    firstName: vine.string().trim().minLength(1),
    lastName: vine.string().trim().minLength(1),
    password: vine.string().minLength(8),
  })
);
export type Validator = Infer<typeof schema>;
```

- [ ] **Step 4: Implement service**

```typescript
// apps/backend/app/modules/orgs/register-dancer/service.ts
import { DatabaseService } from "#database/service";
import { inject } from "@adonisjs/core";
import { users } from "#database/schema/users";
import {
  dancerInvites,
  orgMemberships,
  organizations,
  premiumGrants,
} from "#database/schema/organizations";
import { and, eq, gt, isNull } from "drizzle-orm";
import hash from "@adonisjs/core/services/hash";
import type { Validator } from "./validator.ts";

@inject()
export class RegisterDancerService {
  constructor(private db: DatabaseService) {}

  async execute(orgSlug: string, input: Validator) {
    return this.db.tx(async (tx) => {
      const [org] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.slug, orgSlug))
        .limit(1);
      if (!org) throw new Error("Org not found");

      const [invite] = await tx
        .select()
        .from(dancerInvites)
        .where(
          and(
            eq(dancerInvites.token, input.token),
            eq(dancerInvites.orgId, org.id),
            gt(dancerInvites.expiresAt, new Date()),
            isNull(dancerInvites.consumedAt)
          )
        )
        .limit(1);
      if (!invite) throw new Error("Invalid or expired invite");

      const [user] = await tx
        .insert(users)
        .values({
          username: `d_${invite.email.split("@")[0]}_${Date.now().toString(36)}`,
          email: invite.email,
          displayEmail: invite.email,
          firstName: input.firstName,
          lastName: input.lastName,
          password: await hash.make(input.password),
          role: "user",
          type: "dancer",
          verified: true,
        })
        .returning();

      await tx.insert(orgMemberships).values({
        userId: user.id, orgId: org.id, type: "dancer", role: "member",
      });

      const settings = org.settings as { premium_period_days?: number };
      const days = settings.premium_period_days ?? 90;
      await tx.insert(premiumGrants).values({
        userId: user.id,
        sourceType: "org_event",
        sourceId: null, // Plan 3 wires this to the active event
        expiresAt: new Date(Date.now() + days * 86400000),
      });

      await tx
        .update(dancerInvites)
        .set({ consumedAt: new Date() })
        .where(eq(dancerInvites.id, invite.id));

      return { userId: user.id };
    });
  }
}
```

- [ ] **Step 5: Implement controller**

```typescript
// apps/backend/app/modules/orgs/register-dancer/controller.ts
import { inject } from "@adonisjs/core";
import type { HttpContext } from "@adonisjs/core/http";
import { RegisterDancerService } from "./service.ts";
import { schema } from "./validator.ts";

export default class RegisterDancerController {
  @inject()
  async handle({ request, params, response }: HttpContext, service: RegisterDancerService) {
    const payload = await request.validateUsing(schema);
    try {
      const result = await service.execute(params.slug, payload);
      return response.created(result);
    } catch (err) {
      return response.badRequest({ message: (err as Error).message });
    }
  }
}
```

- [ ] **Step 6: Wire the route**

```typescript
// apps/backend/app/modules/orgs/routes.ts — add inside the group
const RegisterDancerController = () => import("./register-dancer/controller.ts");
// ...
router.post(":slug/register", [RegisterDancerController]).openapi({
  summary: "Dancer self-register via invite token",
  description: "Consumes a one-time invite token and creates a dancer account",
});
```

- [ ] **Step 7: Run tests**

Run: `node ace test --files "app/modules/orgs/register-dancer/service.test.ts"`
Expected: all three cases PASS.

- [ ] **Step 8: Regenerate OpenAPI**

Run: `pnpm --filter backend make:docs`

- [ ] **Step 9: Commit**

```bash
git add apps/backend/app/modules/orgs/register-dancer apps/backend/app/modules/orgs/routes.ts apps/backend/openapi.json
git commit -m "feat(orgs): dancer self-registration via invite token"
```

---

## Task 7: Frontend — `OrgProvider`, `useOrg`, and queries

**Files:**
- Create: `apps/frontend/src/features/org/api/queries.ts`
- Create: `apps/frontend/src/features/org/context/org-provider.tsx`
- Create: `apps/frontend/src/features/org/context/use-org.ts`
- Create: `apps/frontend/src/features/org/components/themed-pending.tsx`

- [ ] **Step 1: First regen frontend types so `$api` knows about `/orgs/:slug`**

Run (with backend running): `pnpm --filter frontend types`
Expected: `src/lib/api/types.d.ts` now includes the new endpoints.

- [ ] **Step 2: Write the query layer**

```typescript
// apps/frontend/src/features/org/api/queries.ts
import { $api } from "@/lib/api/client";

export const orgQueries = {
  org: (slug: string) =>
    $api.queryOptions("get", "/orgs/{slug}", { params: { path: { slug } } }),
};
```

- [ ] **Step 3: Write the context + hook**

```tsx
// apps/frontend/src/features/org/context/org-provider.tsx
import { createContext, useEffect, useMemo, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { orgQueries } from "@/features/org/api/queries";

export interface OrgContextValue {
  org: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
  };
  features: Record<string, boolean>;
  settings: Record<string, unknown>;
  hasFeature: (key: string) => boolean;
}

export const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const { data } = useSuspenseQuery(orgQueries.org(slug));

  const value = useMemo<OrgContextValue>(() => ({
    org: {
      id: data.id, slug: data.slug, name: data.name,
      logoUrl: data.logoUrl, primaryColor: data.primaryColor, accentColor: data.accentColor,
    },
    features: (data.features ?? {}) as Record<string, boolean>,
    settings: (data.settings ?? {}) as Record<string, unknown>,
    hasFeature: (key) => Boolean(((data.features ?? {}) as Record<string, boolean>)[key]),
  }), [data]);

  useEffect(() => {
    const root = document.documentElement;
    if (data.primaryColor) root.style.setProperty("--org-primary", data.primaryColor);
    if (data.accentColor) root.style.setProperty("--org-accent", data.accentColor);
    return () => {
      root.style.removeProperty("--org-primary");
      root.style.removeProperty("--org-accent");
    };
  }, [data.primaryColor, data.accentColor]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}
```

```typescript
// apps/frontend/src/features/org/context/use-org.ts
import { useContext } from "react";
import { OrgContext } from "./org-provider";

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside <OrgProvider>");
  return ctx;
}
```

- [ ] **Step 4: Themed pending fallback**

```tsx
// apps/frontend/src/features/org/components/themed-pending.tsx
export function ThemedPending() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "var(--org-primary, #0f172a)" }}
    >
      <div className="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter frontend build`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/features/org apps/frontend/src/lib/api/types.d.ts
git commit -m "feat(frontend): OrgProvider + useOrg hook with CSS var theming"
```

---

## Task 8: Frontend — `_org/route.tsx` layout

**Files:**
- Create: `apps/frontend/src/routes/_org/route.tsx`

- [ ] **Step 1: Implement the layout route**

```tsx
// apps/frontend/src/routes/_org/route.tsx
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { OrgProvider } from "@/features/org/context/org-provider";
import { ThemedPending } from "@/features/org/components/themed-pending";
import { orgQueries } from "@/features/org/api/queries";

export const Route = createFileRoute("/_org")({
  loader: async ({ context, params }) => {
    const slug = (params as { orgSlug?: string }).orgSlug;
    if (!slug) return;
    await context.queryClient.ensureQueryData(orgQueries.org(slug));
  },
  pendingComponent: ThemedPending,
  component: OrgLayout,
});

function OrgLayout() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  return (
    <OrgProvider slug={orgSlug}>
      <Outlet />
    </OrgProvider>
  );
}
```

- [ ] **Step 2: Build**

Run: `pnpm --filter frontend build`
Expected: clean; TanStack Router regenerates `routeTree.gen.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/_org apps/frontend/src/routeTree.gen.ts
git commit -m "feat(frontend): _org layout route loads OrgProvider"
```

---

## Task 9: Frontend — branded login page

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/login.tsx`
- Create: `apps/frontend/src/features/org/components/org-login-form.tsx`

- [ ] **Step 1: Implement the login form component**

```tsx
// apps/frontend/src/features/org/components/org-login-form.tsx
import { useState } from "react";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { org } = useOrg();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const login = $api.useMutation("post", "/login"); // existing S2S login endpoint

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ body: { email, password } });
      onSuccess();
    } catch {
      setError("Incorrect email or password.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-6 p-6"
      style={{ color: "white" }}
    >
      {org.logoUrl && (
        <img src={org.logoUrl} alt={org.name} className="mx-auto h-16 w-auto" />
      )}
      <h1 className="text-center text-2xl font-semibold">Welcome to {org.name}</h1>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email" type="email" autoFocus autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required
          className="h-12 text-base"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Password</Label>
        <Input
          id="password" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} required
          className="h-12 text-base"
        />
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button
        type="submit" disabled={login.isPending}
        className="h-12 w-full text-base font-semibold"
        style={{ background: "var(--org-accent, #e94560)", color: "white" }}
      >
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Implement the route**

```tsx
// apps/frontend/src/routes/_org/$orgSlug/login.tsx
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { OrgLoginForm } from "@/features/org/components/org-login-form";

export const Route = createFileRoute("/_org/$orgSlug/login")({
  component: OrgLoginPage,
});

function OrgLoginPage() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/login" });
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--org-primary, #0f172a)" }}
    >
      <OrgLoginForm
        onSuccess={() => navigate({ to: "/$orgSlug/coach", params: { orgSlug } })}
      />
    </div>
  );
}
```

- [ ] **Step 3: Build + lint**

Run: `pnpm --filter frontend build && pnpm --filter frontend lint`
Expected: clean.

- [ ] **Step 4: Manual smoke**

Start dev server, navigate to `http://localhost:5173/summit/login`. Expected: dark background with `#1a1a2e`, Summit name visible, login form submits.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/login.tsx apps/frontend/src/features/org/components/org-login-form.tsx apps/frontend/src/routeTree.gen.ts
git commit -m "feat(frontend): branded org login page"
```

---

## Task 10: Frontend — dancer registration page

**Files:**
- Create: `apps/frontend/src/routes/_org/$orgSlug/register.tsx`
- Create: `apps/frontend/src/features/org/components/org-register-form.tsx`

- [ ] **Step 1: Implement the form**

```tsx
// apps/frontend/src/features/org/components/org-register-form.tsx
import { useState } from "react";
import { useOrg } from "@/features/org/context/use-org";
import { $api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrgRegisterForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const { org } = useOrg();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const register = $api.useMutation("post", "/orgs/{slug}/register");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({
        params: { path: { slug: org.slug } },
        body: { token, firstName, lastName, password },
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? "Your invite link is invalid or expired.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-5 p-6 text-white"
    >
      {org.logoUrl && <img src={org.logoUrl} alt={org.name} className="mx-auto h-16" />}
      <h1 className="text-center text-2xl font-semibold">
        You're in! Let's finish your {org.name} profile.
      </h1>
      <p className="text-center text-sm opacity-80">
        This link is just for you. Takes 30 seconds.
      </p>
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-white">First name</Label>
        <Input id="firstName" autoFocus required
          value={firstName} onChange={(e) => setFirstName(e.target.value)}
          className="h-12 text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="lastName" className="text-white">Last name</Label>
        <Input id="lastName" required
          value={lastName} onChange={(e) => setLastName(e.target.value)}
          className="h-12 text-base" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-white">Create a password</Label>
        <Input id="password" type="password" autoComplete="new-password" required minLength={8}
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="h-12 text-base" />
        <p className="text-xs opacity-70">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <Button
        type="submit" disabled={register.isPending}
        className="h-12 w-full text-base font-semibold"
        style={{ background: "var(--org-accent)", color: "white" }}
      >
        {register.isPending ? "Creating account..." : "Finish sign up"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Implement the route (reads token from `?t=` search param)**

```tsx
// apps/frontend/src/routes/_org/$orgSlug/register.tsx
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { z } from "zod";
import { OrgRegisterForm } from "@/features/org/components/org-register-form";

const searchSchema = z.object({ t: z.string().min(1) });

export const Route = createFileRoute("/_org/$orgSlug/register")({
  validateSearch: searchSchema,
  component: RegisterPage,
});

function RegisterPage() {
  const { orgSlug } = useParams({ from: "/_org/$orgSlug/register" });
  const { t } = Route.useSearch();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen" style={{ background: "var(--org-primary)" }}>
      <OrgRegisterForm
        token={t}
        onSuccess={() => navigate({ to: "/$orgSlug/login", params: { orgSlug } })}
      />
    </div>
  );
}
```

- [ ] **Step 3: Build + lint**

Run: `pnpm --filter frontend build && pnpm --filter frontend lint`

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/routes/_org/$orgSlug/register.tsx apps/frontend/src/features/org/components/org-register-form.tsx apps/frontend/src/routeTree.gen.ts
git commit -m "feat(frontend): dancer registration page with invite token"
```

---

## Task 11: Full-stack smoke test

- [ ] **Step 1: Run all backend tests**

Run: `pnpm --filter backend test`
Expected: green.

- [ ] **Step 2: Run frontend build + lint**

Run: `pnpm --filter frontend build && pnpm --filter frontend lint`

- [ ] **Step 3: Manual — hit `/summit/login`**

Start both apps. Navigate to `/summit/login`. Expected: background uses `#1a1a2e`, button uses `#e94560`, form works.

- [ ] **Step 4: Manual — hit `/nonexistent/login`**

Expected: TanStack error boundary with 404 from `GET /orgs/nonexistent`.

- [ ] **Step 5: Manual — hit `/summit/register?t=invalid`**

Expected: form renders, submit shows "invite link is invalid or expired."

---

## Definition of Done

- `GET /orgs/:slug` returns org metadata publicly.
- All seven org middlewares are named in kernel and tested.
- `POST /orgs/:slug/register` creates a user + membership + grant from a valid invite token.
- `/summit/login` and `/summit/register?t=...` render with Summit branding before authentication.
- `useOrg().hasFeature("x")` works in any `_org/*` route.
- Backend tests + frontend build clean.
