import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import {
  organizations,
  orgMemberships,
  premiumGrants,
  dancerInvites,
} from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
} from "#database/schema/org-events";
import { eq } from "drizzle-orm";
import { grantOrgAccountTier } from "./grant-account-tier.ts";

async function createDancer(email: string) {
  const [u] = await db
    .insert(users)
    .values({
      username: email.split("@")[0]!,
      email,
      displayEmail: email,
      firstName: "Test",
      lastName: "Dancer",
      password: "x",
      role: "user",
      type: "dancer",
      verified: true,
    })
    .returning();
  await db.insert(dancerProfiles).values({
    userId: u!.id,
    birthday: "2000-01-01",
    location: "Anywhere",
  });
  return u!;
}

async function createOrg(slug: string, freeTier: boolean, months?: number) {
  const [org] = await db
    .insert(organizations)
    .values({
      slug,
      name: slug,
      features: freeTier ? { freeTierUsers: true } : {},
      settings: months ? { tierExpiryMonths: months } : {},
    })
    .returning();
  return org!;
}

// Only one event per org may be active at a time, so callers creating a second
// event mark the earlier one inactive — which is the real shape anyway: a past
// competition is closed by the time the next one opens.
async function createEvent(orgId: string, endDate: string, isActive = true) {
  const [ev] = await db
    .insert(orgEvents)
    .values({
      orgId,
      name: "Event",
      startDate: endDate,
      endDate,
      isActive,
    })
    .returning();
  return ev!;
}

async function addRoster(
  eventId: string,
  userId: string | null,
  email: string,
  paid: boolean | null
) {
  await db.insert(eventRosters).values({
    eventId,
    userId,
    type: "dancer",
    email,
    firstName: "Test",
    lastName: "Dancer",
    paid,
  });
}

function grant(userId: string, orgId: string) {
  return db.transaction((tx) => grantOrgAccountTier(tx, { userId, orgId }));
}

async function tierOf(userId: string) {
  const [u] = await db
    .select({
      tier: users.orgAccountTier,
      expiresAt: users.orgAccountTierExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  return u!;
}

test.group("grantOrgAccountTier", (group) => {
  group.each.setup(async () => {
    await db.delete(premiumGrants).execute();
    await db.delete(dancerInvites).execute();
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
  });

  test("grants standard to a paid dancer in a free-tier org", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const event = await createEvent(org.id, "2026-08-23");
    const dancer = await createDancer("paid@x.co");
    await addRoster(event.id, dancer.id, "paid@x.co", true);

    const result = await grant(dancer.id, org.id);

    assert.equal(result?.tier, "standard");
    const { tier, expiresAt } = await tierOf(dancer.id);
    assert.equal(tier, "standard");
    // Event end + the default 3 month window.
    assert.equal(expiresAt!.toISOString().split("T")[0], "2026-11-23");
  });

  test("leaves an unpaid dancer in a free-tier org on null", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const event = await createEvent(org.id, "2026-08-23");
    const dancer = await createDancer("unpaid@x.co");
    await addRoster(event.id, dancer.id, "unpaid@x.co", false);

    const result = await grant(dancer.id, org.id);

    assert.isNull(result);
    // Not downgraded to 'limited': that would revoke the photo upload a plain
    // free account already has.
    const after = await tierOf(dancer.id);
    assert.isNull(after.tier);
  });

  test("grants standard in a non-free-tier org regardless of paid", async ({
    assert,
  }) => {
    const org = await createOrg("paidorg", false);
    const event = await createEvent(org.id, "2026-06-14");
    const dancer = await createDancer("any@x.co");
    await addRoster(event.id, dancer.id, "any@x.co", false);

    const granted = await grant(dancer.id, org.id);
    assert.equal(granted?.tier, "standard");
    const after = await tierOf(dancer.id);
    assert.equal(after.tier, "standard");
  });

  test("upgrades a limited account once a paid roster row appears", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const event = await createEvent(org.id, "2026-08-23");
    const dancer = await createDancer("limited@x.co");
    await addRoster(event.id, dancer.id, "limited@x.co", true);
    await db
      .update(users)
      .set({ orgAccountTier: "limited" })
      .where(eq(users.id, dancer.id));

    const granted = await grant(dancer.id, org.id);
    assert.equal(granted?.tier, "standard");
    const after = await tierOf(dancer.id);
    assert.equal(after.tier, "standard");
  });

  test("does not upgrade a limited account while nothing is paid", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const event = await createEvent(org.id, "2026-08-23");
    const dancer = await createDancer("stilllimited@x.co");
    await addRoster(event.id, dancer.id, "stilllimited@x.co", false);
    await db
      .update(users)
      .set({ orgAccountTier: "limited" })
      .where(eq(users.id, dancer.id));

    // Still not upgraded — the paid flag governs the level — though the window
    // itself does move, which "extends a limited account" covers below.
    const granted = await grant(dancer.id, org.id);
    assert.equal(granted?.tier, "limited");
    const after = await tierOf(dancer.id);
    assert.equal(after.tier, "limited");
  });

  test("dates the tier from the latest event the dancer is rostered on", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const early = await createEvent(org.id, "2026-05-10", false);
    const late = await createEvent(org.id, "2026-08-23");
    const dancer = await createDancer("multi@x.co");
    await addRoster(early.id, dancer.id, "multi@x.co", false);
    await addRoster(late.id, dancer.id, "multi@x.co", true);

    const granted = await grant(dancer.id, org.id);
    assert.equal(granted?.tier, "standard");
    const { expiresAt } = await tierOf(dancer.id);
    assert.equal(expiresAt!.toISOString().split("T")[0], "2026-11-23");
  });

  test("honours a custom tierExpiryMonths setting", async ({ assert }) => {
    const org = await createOrg("freeorg", true, 6);
    const event = await createEvent(org.id, "2026-08-23");
    const dancer = await createDancer("custom@x.co");
    await addRoster(event.id, dancer.id, "custom@x.co", true);

    await grant(dancer.id, org.id);
    const { expiresAt } = await tierOf(dancer.id);
    assert.equal(expiresAt!.toISOString().split("T")[0], "2027-02-23");
  });

  test("does nothing when the user holds no roster row in the org", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    await createEvent(org.id, "2026-08-23");
    const dancer = await createDancer("stranger@x.co");

    assert.isNull(await grant(dancer.id, org.id));
    const after = await tierOf(dancer.id);
    assert.isNull(after.tier);
  });
  test("extends the window when the dancer returns for a later event", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const first = await createEvent(org.id, "2026-05-10", false);
    const dancer = await createDancer("returning@x.co");
    await addRoster(first.id, dancer.id, "returning@x.co", true);

    await grant(dancer.id, org.id);
    const initial = await tierOf(dancer.id);
    assert.equal(initial.expiresAt!.toISOString().split("T")[0], "2026-08-10");

    // Same dancer, next stop on the tour.
    const second = await createEvent(org.id, "2026-08-23");
    await addRoster(second.id, dancer.id, "returning@x.co", true);

    const result = await grant(dancer.id, org.id);
    assert.isTrue(result?.extended);
    const after = await tierOf(dancer.id);
    assert.equal(after.expiresAt!.toISOString().split("T")[0], "2026-11-23");
  });

  test("never shortens a window that already reaches further", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const event = await createEvent(org.id, "2026-05-10");
    const dancer = await createDancer("longwindow@x.co");
    await addRoster(event.id, dancer.id, "longwindow@x.co", true);

    // Granted under a more generous setting, or by another org's event.
    const generous = new Date("2027-01-01T00:00:00.000Z");
    await db
      .update(users)
      .set({ orgAccountTier: "standard", orgAccountTierExpiresAt: generous })
      .where(eq(users.id, dancer.id));

    assert.isNull(await grant(dancer.id, org.id));
    const after = await tierOf(dancer.id);
    assert.equal(after.expiresAt!.toISOString().split("T")[0], "2027-01-01");
  });

  test("a later event extends the window even when that row is unpaid", async ({
    assert,
  }) => {
    const org = await createOrg("freeorg", true);
    const paidEvent = await createEvent(org.id, "2026-05-10", false);
    const dancer = await createDancer("paidthenfree@x.co");
    await addRoster(paidEvent.id, dancer.id, "paidthenfree@x.co", true);
    await grant(dancer.id, org.id);

    // Shows up again without buying the upgrade. Being rostered is what keeps
    // the window alive; the paid flag only governs the level.
    const freeEvent = await createEvent(org.id, "2026-08-23");
    await addRoster(freeEvent.id, dancer.id, "paidthenfree@x.co", false);

    const granted = await grant(dancer.id, org.id);
    assert.equal(granted?.tier, "standard");
    const after = await tierOf(dancer.id);
    assert.equal(after.expiresAt!.toISOString().split("T")[0], "2026-11-23");
  });

  test("extends a limited account without upgrading it", async ({ assert }) => {
    // The org that uses the paid flag is the only place 'limited' exists. An
    // unpaid dancer still attends events, so her window still tracks them.
    const org = await createOrg("freeorg", true);
    const first = await createEvent(org.id, "2026-05-10", false);
    const dancer = await createDancer("limitedreturn@x.co");
    await addRoster(first.id, dancer.id, "limitedreturn@x.co", false);
    await db
      .update(users)
      .set({
        orgAccountTier: "limited",
        orgAccountTierExpiresAt: new Date("2026-08-10T00:00:00.000Z"),
      })
      .where(eq(users.id, dancer.id));

    const second = await createEvent(org.id, "2026-08-23");
    await addRoster(second.id, dancer.id, "limitedreturn@x.co", false);

    const granted = await grant(dancer.id, org.id);
    assert.equal(granted?.tier, "limited");
    const after = await tierOf(dancer.id);
    assert.equal(after.tier, "limited");
    assert.equal(after.expiresAt!.toISOString().split("T")[0], "2026-11-23");
  });

  test("extends on a new roster in an org with no paid flag at all", async ({
    assert,
  }) => {
    // Most orgs never set `paid`; every roster row there earns the full window.
    const org = await createOrg("noflags", false);
    const first = await createEvent(org.id, "2026-05-10", false);
    const dancer = await createDancer("noflag@x.co");
    await addRoster(first.id, dancer.id, "noflag@x.co", null);
    await grant(dancer.id, org.id);
    const initial = await tierOf(dancer.id);
    assert.equal(initial.expiresAt!.toISOString().split("T")[0], "2026-08-10");

    const second = await createEvent(org.id, "2026-08-23");
    await addRoster(second.id, dancer.id, "noflag@x.co", null);

    await grant(dancer.id, org.id);
    const after = await tierOf(dancer.id);
    assert.equal(after.expiresAt!.toISOString().split("T")[0], "2026-11-23");
  });
});
