import { test } from "@japa/runner";
import { DatabaseService } from "#database/service";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { subscriptions } from "#database/schema/subscriptions";
import { premiumGrants } from "#database/schema/organizations";
import { GetSubscriptionService } from "./service.ts";

async function createUser(suffix: string) {
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
    })
    .returning();
  return u!;
}

test.group("GetSubscriptionService", (group) => {
  group.each.setup(async () => {
    await db.delete(premiumGrants).execute();
    await db.delete(subscriptions).execute();
    await db.delete(users).execute();
  });

  test("returns source='none' for user with nothing", async ({ assert }) => {
    const user = await createUser("none");
    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(user.id);
    assert.isFalse(result.subscribed);
    assert.equal(result.source, "none");
    assert.isNull(result.currentPeriodEnd);
    assert.isFalse(result.cancelAtPeriodEnd);
    assert.isNull(result.grantedBy);
  });

  test("returns source='stripe' when only a Stripe subscription exists", async ({
    assert,
  }) => {
    const user = await createUser("stripe");
    const periodEnd = new Date(Date.now() + 7 * 86400000);
    await db.insert(subscriptions).values({
      userId: user.id,
      source: "stripe",
      status: "active",
      subscriptionId: `sub_stripe`,
      customerId: `cus_stripe`,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
    });

    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(user.id);
    assert.isTrue(result.subscribed);
    assert.equal(result.source, "stripe");
    assert.equal(result.currentPeriodEnd?.getTime(), periodEnd.getTime());
    assert.isNull(result.grantedBy);
  });

  test("returns source='org_event' when only a grant exists", async ({
    assert,
  }) => {
    const user = await createUser("grant");
    const expires = new Date(Date.now() + 30 * 86400000);
    await db.insert(premiumGrants).values({
      userId: user.id,
      sourceType: "org_event",
      expiresAt: expires,
    });

    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(user.id);
    assert.isTrue(result.subscribed);
    assert.equal(result.source, "org_event");
    assert.equal(result.currentPeriodEnd?.getTime(), expires.getTime());
    assert.isFalse(result.cancelAtPeriodEnd);
  });

  test("Stripe subscription takes precedence over grant", async ({
    assert,
  }) => {
    const user = await createUser("both");
    const subEnd = new Date(Date.now() + 10 * 86400000);
    const grantEnd = new Date(Date.now() + 90 * 86400000);
    await db.insert(subscriptions).values({
      userId: user.id,
      source: "stripe",
      status: "active",
      subscriptionId: `sub_both`,
      customerId: `cus_both`,
      currentPeriodEnd: subEnd,
    });
    await db.insert(premiumGrants).values({
      userId: user.id,
      sourceType: "org_event",
      expiresAt: grantEnd,
    });

    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(user.id);
    assert.equal(result.source, "stripe");
    assert.equal(result.currentPeriodEnd?.getTime(), subEnd.getTime());
  });

  test("expired grant is ignored", async ({ assert }) => {
    const user = await createUser("expired");
    await db.insert(premiumGrants).values({
      userId: user.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() - 1000),
    });
    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(user.id);
    assert.equal(result.source, "none");
    assert.isFalse(result.subscribed);
  });

  test("revoked grant is ignored", async ({ assert }) => {
    const user = await createUser("revoked");
    await db.insert(premiumGrants).values({
      userId: user.id,
      sourceType: "org_event",
      expiresAt: new Date(Date.now() + 86400000),
      revokedAt: new Date(),
    });
    const svc = new GetSubscriptionService(new DatabaseService());
    const result = await svc.execute(user.id);
    assert.equal(result.source, "none");
  });
});
