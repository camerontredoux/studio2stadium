import { test } from "@japa/runner";
import { db } from "#database/connection";
import { eventRosters } from "#database/schema/org-events";
import { users } from "#database/schema/users";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  selectionFixture,
  type SelectionFixture,
} from "../../selections/test-fixtures.ts";
import { ListSchoolsService } from "./service.ts";

const service = new ListSchoolsService();

async function coachRow(
  eventId: string,
  values: {
    organization: string;
    firstName: string;
    userId?: string;
    createdAt?: Date;
  }
) {
  const [row] = await db
    .insert(eventRosters)
    .values({
      eventId,
      type: "coach",
      email: `${randomUUID()}@test.co`,
      lastName: "Coach",
      ...values,
    })
    .returning();
  return row!;
}

test.group("ListSchoolsService", (group) => {
  let fx: SelectionFixture;
  group.each.setup(async () => {
    fx = await selectionFixture();
    return () => fx.cleanup();
  });

  test("keeps one row per school, preferring the active event's, then the newest", async ({
    assert,
  }) => {
    const suffix = randomUUID().slice(0, 8);
    const [user] = await db
      .insert(users)
      .values({
        username: `coach_${suffix}`,
        email: `coach-${suffix}@test.co`,
        displayEmail: `coach-${suffix}@test.co`,
        firstName: "Echo",
        lastName: "Coach",
        password: "hashed",
        role: "user",
        type: "school",
      })
      .returning();
    // A claimed coach on both events: the active event's row wins even though
    // the past event's is newer.
    const active = await coachRow(fx.event.id, {
      organization: "Echo University",
      firstName: "Echo",
      userId: user!.id,
      createdAt: new Date("2025-01-01"),
    });
    await coachRow(fx.otherEvent.id, {
      organization: "Echo University",
      firstName: "Echo",
      userId: user!.id,
      createdAt: new Date("2026-01-01"),
    });
    // An unclaimed school only on the past event, its name cased differently:
    // the newest row wins.
    await coachRow(fx.otherEvent.id, {
      organization: "Foxtrot College",
      firstName: "Old",
      createdAt: new Date("2024-01-01"),
    });
    const newest = await coachRow(fx.otherEvent.id, {
      organization: "FOXTROT college",
      firstName: "New",
      createdAt: new Date("2025-01-01"),
    });

    const schools = await service.execute(fx.org.id, fx.event.id, null);

    assert.deepEqual(
      schools.map((school) => school.organization),
      [
        "Alpha University",
        "Bravo University",
        "Charlie University",
        "Delta University",
        "Echo University",
        "FOXTROT college",
      ]
    );
    assert.equal(schools[4]!.rosterId, active.id);
    assert.equal(schools[4]!.username, `coach_${suffix}`);
    assert.equal(schools[5]!.rosterId, newest.id);

    const page = await service.page(fx.org.id, fx.event.id, null, {});
    assert.equal(page.total, 6);
    assert.deepEqual(page.data, schools);

    await db.delete(users).where(eq(users.id, user!.id));
  });

  test("pages through the schools by name without repeats", async ({
    assert,
  }) => {
    await coachRow(fx.otherEvent.id, {
      organization: "Alpha University",
      firstName: "Alpha",
    });

    const first = await service.page(fx.org.id, fx.event.id, null, {
      limit: 3,
    });
    const second = await service.page(fx.org.id, fx.event.id, null, {
      page: 1,
      limit: 3,
    });

    // Alpha's two roster rows count once.
    assert.equal(first.total, 4);
    assert.equal(second.total, 4);
    assert.deepEqual(
      [...first.data, ...second.data].map((school) => school.organization),
      [
        "Alpha University",
        "Bravo University",
        "Charlie University",
        "Delta University",
      ]
    );
    assert.equal(first.data[0]!.rosterId, fx.coaches[0]!.id);
  });

  test("searches every school by school or coach name", async ({ assert }) => {
    await coachRow(fx.otherEvent.id, {
      organization: "Zulu State",
      firstName: "Charlene",
    });

    const byCoach = await service.page(fx.org.id, fx.event.id, null, {
      search: "char",
      limit: 1,
    });
    assert.equal(byCoach.total, 2);
    assert.deepEqual(
      byCoach.data.map((school) => school.organization),
      ["Charlie University"]
    );

    const bySchool = await service.page(fx.org.id, fx.event.id, null, {
      search: "zulu",
    });
    assert.deepEqual(
      bySchool.data.map((school) => school.firstName),
      ["Charlene"]
    );

    const fullName = await service.page(fx.org.id, fx.event.id, null, {
      search: "bravo coach",
    });
    assert.equal(fullName.total, 1);
  });

  test("marks the schools the dancer picked on the active event", async ({
    assert,
  }) => {
    const dancer = await fx.roster(fx.event.id, "dancer", "Dana");
    await fx.select(fx.event.id, dancer.id, [fx.coaches[1]!.id]);

    const { data } = await service.page(fx.org.id, fx.event.id, dancer.id, {});

    assert.deepEqual(
      data.filter((school) => school.isTopSchool).map((s) => s.rosterId),
      [fx.coaches[1]!.id]
    );
  });
});
