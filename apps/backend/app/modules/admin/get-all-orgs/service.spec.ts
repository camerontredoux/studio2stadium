import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations, orgMemberships } from "#database/schema/organizations";
import {
  csvUploads,
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { eventTierPurchases } from "#database/schema/event-tier-purchases";
import { DatabaseService } from "#database/service";
import { Service } from "./service.ts";

test.group("GetAllOrgs Event Tier (#112)", (group) => {
  group.each.setup(async () => {
    await db.delete(eventTierPurchases).execute();
    await db.delete(eventAuditLog).execute();
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(organizations).execute();
  });

  test("staff see each Org's active event with its Event Tier", async ({
    assert,
  }) => {
    const [org] = await db
      .insert(organizations)
      .values({ name: "Tiered", slug: `tiered-${Date.now()}` })
      .returning();
    await db.insert(orgEvents).values([
      {
        orgId: org!.id,
        name: "Past",
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        eventTier: "national",
      },
      {
        orgId: org!.id,
        name: "Live",
        startDate: "2026-09-01",
        endDate: "2026-09-02",
        eventTier: "core",
        isActive: true,
      },
    ]);
    const [idle] = await db
      .insert(organizations)
      .values({ name: "Idle", slug: `idle-${Date.now()}` })
      .returning();

    const rows = await new Service(new DatabaseService()).execute();
    const tiered = rows.find((r) => r.id === org!.id)!;
    assert.equal(tiered.activeEvent, "Live");
    assert.equal(tiered.activeEventTier, "core");
    assert.isNull(rows.find((r) => r.id === idle!.id)!.activeEventTier);
  });
});
