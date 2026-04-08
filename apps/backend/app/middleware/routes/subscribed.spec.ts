import { test } from "@japa/runner";
import SubscribedMiddleware from "./subscribed.ts";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { subscriptions } from "#database/schema/subscriptions";
import { premiumGrants } from "#database/schema/organizations";

/**
 * Minimal HttpContext mock — the middleware only reads
 * ctx.auth.getUserOrFail() and calls ctx.response.forbidden().
 */
function mockCtx(user: { id: string; role: string }) {
  let forbiddenCalled = false;
  let forbiddenMessage: string | null = null;
  return {
    ctx: {
      auth: {
        getUserOrFail: () => user,
      },
      response: {
        forbidden: (body: { message: string }) => {
          forbiddenCalled = true;
          forbiddenMessage = body.message;
        },
      },
    } as any,
    get forbiddenCalled() {
      return forbiddenCalled;
    },
    get forbiddenMessage() {
      return forbiddenMessage;
    },
  };
}

async function createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const suffix = Math.random().toString(36).slice(2, 8);
  const [u] = await db
    .insert(users)
    .values({
      username: `sub-${suffix}`,
      email: `sub-${suffix}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `sub-${suffix}@example.com`,
      firstName: "Sub",
      lastName: "User",
      password: "x",
      ...overrides,
    })
    .returning();
  return u!;
}

test.group("SubscribedMiddleware", (group) => {
  group.each.setup(async () => {
    await db.delete(premiumGrants).execute();
    await db.delete(subscriptions).execute();
    await db.delete(users).execute();
  });

  test("rejects user with no subscription and no grant", async ({ assert }) => {
    const user = await createUser();
    const mock = mockCtx(user);
    let nextCalled = false;
    const mw = new SubscribedMiddleware();
    await mw.handle(mock.ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.isTrue(mock.forbiddenCalled);
    assert.match(mock.forbiddenMessage!, /premium/i);
  });

  test("allows admin users (superadmin bypass)", async ({ assert }) => {
    const user = await createUser({ role: "admin" });
    const mock = mockCtx(user);
    let nextCalled = false;
    const mw = new SubscribedMiddleware();
    await mw.handle(mock.ctx, async () => {
      nextCalled = true;
    });
    assert.isTrue(nextCalled);
    assert.isFalse(mock.forbiddenCalled);
  });

  test("allows user with an active Stripe subscription", async ({ assert }) => {
    const user = await createUser();
    await db.insert(subscriptions).values({
      userId: user.id,
      source: "stripe",
      status: "active",
      subscriptionId: `sub_${user.id.slice(0, 8)}`,
      customerId: `cus_${user.id.slice(0, 8)}`,
      currentPeriodEnd: new Date(Date.now() + 86400000),
    });

    const mock = mockCtx(user);
    let nextCalled = false;
    await new SubscribedMiddleware().handle(mock.ctx, async () => {
      nextCalled = true;
    });
    assert.isTrue(nextCalled);
    assert.isFalse(mock.forbiddenCalled);
  });

  test("allows user with an active premium grant", async ({ assert }) => {
    const user = await createUser();
    await db.insert(premiumGrants).values({
      userId: user.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() + 86400000),
    });

    const mock = mockCtx(user);
    let nextCalled = false;
    await new SubscribedMiddleware().handle(mock.ctx, async () => {
      nextCalled = true;
    });
    assert.isTrue(nextCalled);
    assert.isFalse(mock.forbiddenCalled);
  });

  test("rejects user with an expired premium grant", async ({ assert }) => {
    const user = await createUser();
    await db.insert(premiumGrants).values({
      userId: user.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() - 1000),
    });

    const mock = mockCtx(user);
    let nextCalled = false;
    await new SubscribedMiddleware().handle(mock.ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.isTrue(mock.forbiddenCalled);
  });

  test("rejects user with a revoked premium grant", async ({ assert }) => {
    const user = await createUser();
    await db.insert(premiumGrants).values({
      userId: user.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
    });

    const mock = mockCtx(user);
    let nextCalled = false;
    await new SubscribedMiddleware().handle(mock.ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.isTrue(mock.forbiddenCalled);
  });
});
