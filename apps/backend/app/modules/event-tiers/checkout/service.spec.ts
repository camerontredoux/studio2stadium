import { test } from "@japa/runner";
import { like } from "drizzle-orm";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { DatabaseService } from "#database/service";
import { E_BAD_REQUEST } from "#exceptions/bad-request";
import { E_NOT_FOUND } from "#exceptions/not-found";
import { Service } from "./service.ts";

async function makeUser(suffix: string) {
  const [u] = await db
    .insert(users)
    .values({
      username: `buyer-${suffix}`,
      email: `buyer-${suffix}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `buyer-${suffix}@example.com`,
      firstName: "Buyer",
      lastName: "User",
      password: "x",
    })
    .returning();
  return u!;
}

const validPayload = (userId: string) => ({
  userId,
  eventTier: "regional" as const,
  orgName: "The Summit",
  eventName: "Summit 2026",
  startDate: "2026-06-13",
  endDate: "2026-06-14",
});

test.group("Service (create-checkout)", (group) => {
  group.each.setup(async () => {
    // Scoped to this file's own rows: a blanket `delete(users)` can hit
    // FK-restricted rows (csv_uploads, event_audit_log) left by unrelated
    // suites sharing this database, failing the setup hook itself.
    await db.delete(users).where(like(users.username, "buyer-%")).execute();
  });

  test("rejects a userId with no matching account before touching Stripe", async ({
    assert,
  }) => {
    const svc = new Service(new DatabaseService());
    const payload = validPayload("8f14e45f-ceea-4c9e-b0f5-8a3f3a1e2a2b");

    let caught: unknown;
    try {
      await svc.execute(payload);
    } catch (err) {
      caught = err;
    }

    assert.instanceOf(caught, E_NOT_FOUND);
  });

  test("rejects an end date before the start date before touching Stripe", async ({
    assert,
  }) => {
    const buyer = await makeUser("bad-dates");
    const svc = new Service(new DatabaseService());
    const payload = {
      ...validPayload(buyer.id),
      startDate: "2026-06-14",
      endDate: "2026-06-13",
    };

    let caught: unknown;
    try {
      await svc.execute(payload);
    } catch (err) {
      caught = err;
    }

    assert.instanceOf(caught, E_BAD_REQUEST);
  });
});
