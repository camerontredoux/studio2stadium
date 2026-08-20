import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import {
  organizations,
  orgMemberships,
  dancerInvites,
  premiumGrants,
} from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
} from "#database/schema/org-events";
import { DatabaseService } from "#database/service";
import { GetMyOrgsService } from "./service.ts";

const PAST = new Date("2020-01-01T00:00:00.000Z");
const FUTURE = new Date("2099-01-01T00:00:00.000Z");

async function createUser(
  email: string,
  type: "dancer" | "school",
  tier: "standard" | "limited" | null,
  expiresAt: Date | null
) {
  const [u] = await db
    .insert(users)
    .values({
      username: email.split("@")[0]!,
      email,
      displayEmail: email,
      firstName: "Test",
      lastName: "User",
      password: "x",
      role: "user",
      type,
      verified: true,
      orgAccountTier: tier,
      orgAccountTierExpiresAt: expiresAt,
    })
    .returning();
  return u!;
}

function service() {
  return new GetMyOrgsService(new DatabaseService());
}

test.group("GetMyOrgsService", (group) => {
  let org: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;

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

    [org] = await db
      .insert(organizations)
      .values({ slug: "theorg", name: "The Org", features: {}, settings: {} })
      .returning();
    [event] = await db
      .insert(orgEvents)
      .values({
        orgId: org.id,
        name: "Event",
        startDate: "2026-08-22",
        endDate: "2026-08-23",
        isActive: true,
      })
      .returning();
  });

  async function roster(userId: string, type: "dancer" | "coach") {
    await db.insert(eventRosters).values({
      eventId: event.id,
      userId,
      type,
      email: `${userId}@x.co`,
      firstName: "Test",
      lastName: "User",
    });
  }

  test("lists the org for a dancer inside her window", async ({ assert }) => {
    const dancer = await createUser(
      "active@x.co",
      "dancer",
      "standard",
      FUTURE
    );
    await roster(dancer.id, "dancer");

    const result = await service().execute(dancer.id);
    assert.lengthOf(result, 1);
    assert.equal(result[0]!.slug, "theorg");
  });

  test("hides the org once the dancer's window has closed", async ({
    assert,
  }) => {
    const dancer = await createUser("lapsed@x.co", "dancer", "standard", PAST);
    await roster(dancer.id, "dancer");

    // She is a plain free user now, so the org she attended stops showing up
    // in the feed rail and the profile sidebar.
    assert.lengthOf(await service().execute(dancer.id), 0);
  });

  test("still lists the org for a dancer who never had a tier", async ({
    assert,
  }) => {
    // An unpaid free-tier attendee: no advisory window was ever granted, but she
    // is genuinely rostered and still needs the org.
    const dancer = await createUser("untiered@x.co", "dancer", null, null);
    await roster(dancer.id, "dancer");

    assert.lengthOf(await service().execute(dancer.id), 1);
  });

  test("never hides staff access behind a lapsed dancer window", async ({
    assert,
  }) => {
    const coach = await createUser("coach@x.co", "school", "standard", PAST);
    await db.insert(orgMemberships).values({
      userId: coach.id,
      orgId: org.id,
      type: "coach",
      role: "admin",
    });

    const result = await service().execute(coach.id);
    assert.lengthOf(result, 1);
    assert.equal(result[0]!.type, "coach");
  });

  test("hides an org reached only through membership when lapsed", async ({
    assert,
  }) => {
    const dancer = await createUser("member@x.co", "dancer", "limited", PAST);
    await db.insert(orgMemberships).values({
      userId: dancer.id,
      orgId: org.id,
      type: "dancer",
      role: "member",
    });

    assert.lengthOf(await service().execute(dancer.id), 0);
  });
});
