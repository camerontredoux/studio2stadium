import { test } from "@japa/runner";

const validPayload = (userId: string) => ({
  userId,
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
      ...validPayload("8f14e45f-ceea-4c9e-b0f5-8a3f3a1e2a2b"),
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

  test("404s when the userId has no matching account", async ({ client }) => {
    const res = await client
      .post("/event-tiers/checkout")
      .json(validPayload("8f14e45f-ceea-4c9e-b0f5-8a3f3a1e2a2b"));
    res.assertStatus(404);
  });
});
