import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { test } from "@japa/runner";
import { eq } from "drizzle-orm";

const validPayload = () => ({
  name: "Ada Organizer",
  email: "checkout_route_buyer@example.com",
  eventTier: "regional",
  orgName: "The Summit",
  eventName: "Summit 2026",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
});

test.group("POST /event-tiers/checkout", () => {
  test("422s when the Event Tier is Enterprise (self-serve excludes it)", async ({
    client,
  }) => {
    const res = await client.post("/event-tiers/checkout").json({
      ...validPayload(),
      eventTier: "enterprise",
    });
    res.assertStatus(422);
  });

  test("422s when required fields are missing", async ({ client }) => {
    const res = await client.post("/event-tiers/checkout").json({
      eventTier: "regional",
    });
    res.assertStatus(422);
  });

  test("422s without the buyer's email, and creates no account", async ({
    client,
    assert,
  }) => {
    const { email, ...withoutEmail } = validPayload();

    const res = await client.post("/event-tiers/checkout").json(withoutEmail);

    res.assertStatus(422);
    assert.lengthOf(
      await db.select().from(users).where(eq(users.email, email)),
      0
    );
  });

  test("400s on an end date before the start date, and creates no account", async ({
    client,
    assert,
  }) => {
    const res = await client.post("/event-tiers/checkout").json({
      ...validPayload(),
      startDate: "2026-06-14",
      endDate: "2026-06-13",
    });

    res.assertStatus(400);
    assert.lengthOf(
      await db
        .select()
        .from(users)
        .where(eq(users.email, validPayload().email)),
      0
    );
  });
});
