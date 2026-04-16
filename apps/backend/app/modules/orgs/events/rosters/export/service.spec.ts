import { test } from "@japa/runner";
import { db } from "#database/connection";
import {
  eventDancerProfiles,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { ExportRosterService } from "./service.ts";

async function makeOrgAndEvent() {
  const [org] = await db
    .insert(organizations)
    .values({ name: "T", slug: `t-${Date.now()}-${Math.random()}` })
    .returning();
  const [event] = await db
    .insert(orgEvents)
    .values({
      orgId: org!.id,
      name: "E",
      startDate: "2026-06-01",
      endDate: "2026-06-02",
    })
    .returning();
  return { org: org!, event: event! };
}

test.group("ExportRosterService", (group) => {
  group.each.setup(async () => {
    await db.delete(eventDancerProfiles).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(organizations).execute();
  });

  test("produces a CSV with header and data rows", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "alice@example.com",
        firstName: "Alice",
        lastName: "Anderson",
        bibNumber: 1,
        organization: "Elite",
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "bob@example.com",
        firstName: "Bob",
        lastName: "Brown",
        bibNumber: 2,
        organization: null,
      },
    ]);

    const service = new ExportRosterService();
    const csv = await service.execute(event.id, { type: "dancer" });

    const lines = csv.trim().split("\r\n");
    assert.equal(
      lines[0],
      "First Name,Last Name,Email,Bib #,Organization,Status"
    );
    assert.equal(lines.length, 3);
    assert.include(lines[1]!, "Alice");
    assert.include(lines[1]!, "Elite");
    assert.include(lines[1]!, "Pending");
  });

  test("escapes fields containing commas, quotes, and newlines", async ({
    assert,
  }) => {
    const { event } = await makeOrgAndEvent();
    await db.insert(eventRosters).values({
      eventId: event.id,
      type: "dancer",
      email: "weird@example.com",
      firstName: 'Mary "The" Ann',
      lastName: "Smith, Jr.",
      organization: "Line1\nLine2",
    });

    const service = new ExportRosterService();
    const csv = await service.execute(event.id, { type: "dancer" });

    const dataLine = csv.trim().split("\r\n")[1]!;
    assert.include(dataLine, '"Mary ""The"" Ann"');
    assert.include(dataLine, '"Smith, Jr."');
    assert.include(dataLine, '"Line1\nLine2"');
  });

  test("applies status filter", async ({ assert }) => {
    const { event } = await makeOrgAndEvent();
    await db.insert(eventRosters).values([
      {
        eventId: event.id,
        type: "dancer",
        email: "a@example.com",
        firstName: "A",
        lastName: "A",
      },
      {
        eventId: event.id,
        type: "dancer",
        email: "b@example.com",
        firstName: "B",
        lastName: "B",
      },
    ]);

    const service = new ExportRosterService();
    const csv = await service.execute(event.id, {
      type: "dancer",
      status: "pending",
    });
    const lines = csv.trim().split("\r\n");
    assert.equal(lines.length, 3); // header + 2 rows
  });
});
