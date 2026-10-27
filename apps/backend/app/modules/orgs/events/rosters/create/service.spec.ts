import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolInvites, schoolProfiles } from "#database/schema/schools";
import {
  dancerInvites,
  organizations,
  orgMemberships,
  premiumGrants,
} from "#database/schema/organizations";
import {
  eventAuditLog,
  eventRosters,
  orgEvents,
} from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { and, eq } from "drizzle-orm";
import {
  AccountNotFoundError,
  CreateRosterService,
  EventNotFoundError,
  RosterAccountTakenError,
  RosterBibConflictError,
  RosterEmailConflictError,
  RosterFieldRequiredError,
  RosterRoleConflictError,
} from "./service.ts";

async function createUser(attrs: {
  username: string;
  email: string;
  type: "dancer" | "school";
}) {
  const [u] = await db
    .insert(users)
    .values({
      username: attrs.username,
      email: attrs.email,
      displayEmail: attrs.email,
      firstName: "Account",
      lastName: "Holder",
      password: "x",
      role: "user",
      type: attrs.type,
      verified: true,
    })
    .returning();
  if (attrs.type === "dancer") {
    await db.insert(dancerProfiles).values({
      userId: u!.id,
      birthday: "2000-01-01",
      location: "Anywhere",
    });
  } else {
    await db.insert(schoolProfiles).values({
      userId: u!.id,
      name: `School-${attrs.username}`,
      location: "Anywhere",
    });
  }
  return u!;
}

test.group("CreateRosterService", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;
  let admin: typeof users.$inferSelect;
  const service = new CreateRosterService();
  const audit = () => ({ eventId: event.id, actorId: admin.id });

  group.each.setup(async () => {
    await db.delete(eventAuditLog).execute();
    await db.delete(premiumGrants).execute();
    await db.delete(dancerInvites).execute();
    await db.delete(schoolInvites).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();

    [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    admin = await createUser({
      username: "admin",
      email: "admin@x.co",
      type: "school",
    });
    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Summit 2026",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      })
      .returning();
    event = ev!;
  });

  test("a new dancer email gets a pending entry and a dancer invite", async ({
    assert,
  }) => {
    const result = await service.execute(
      summit.id,
      event.id,
      {
        type: "dancer",
        firstName: "Ada",
        lastName: "Lane",
        email: "Ada@Example.com",
        bibNumber: 12,
      },
      audit()
    );

    assert.isFalse(result.isRegistered);
    assert.equal(result.email, "ada@example.com");
    const [row] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, result.id));
    assert.equal(row!.type, "dancer");
    assert.equal(row!.bibNumber, 12);
    assert.isNull(row!.userId);
    assert.isNull(row!.expirationDate);

    const invites = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.orgId, summit.id));
    assert.lengthOf(invites, 1);
    assert.equal(invites[0]!.email, "ada@example.com");

    const [log] = await db
      .select()
      .from(eventAuditLog)
      .where(eq(eventAuditLog.resourceId, result.id));
    assert.equal(log!.action, "create");
    assert.equal(log!.resource, "roster");
  });

  test("a dancer email with an account links it like an upload does", async ({
    assert,
  }) => {
    const dancer = await createUser({
      username: "dancer1",
      email: "dancer1@x.co",
      type: "dancer",
    });

    const result = await service.execute(
      summit.id,
      event.id,
      {
        type: "dancer",
        firstName: "Dee",
        lastName: "One",
        email: "dancer1@x.co",
        bibNumber: 3,
      },
      audit()
    );

    assert.isTrue(result.isRegistered);
    const [row] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, result.id));
    assert.equal(row!.userId, dancer.id);
    assert.isNotNull(row!.expirationDate);

    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.userId, dancer.id),
          eq(orgMemberships.orgId, summit.id)
        )
      );
    assert.lengthOf(memberships, 1);
    assert.equal(memberships[0]!.type, "dancer");
    assert.lengthOf(await db.select().from(dancerInvites), 0);
  });

  test("a linked account replaces the email that was typed", async ({
    assert,
  }) => {
    const dancer = await createUser({
      username: "linked",
      email: "linked@x.co",
      type: "dancer",
    });

    const result = await service.execute(
      summit.id,
      event.id,
      {
        type: "dancer",
        firstName: "Lin",
        lastName: "Ked",
        email: "typed@x.co",
        bibNumber: 4,
        userId: dancer.id,
      },
      audit()
    );

    assert.equal(result.email, "linked@x.co");
    assert.isTrue(result.isRegistered);
  });

  test("a linked account of the wrong type is refused", async ({ assert }) => {
    const school = await createUser({
      username: "school1",
      email: "school1@x.co",
      type: "school",
    });

    await assert.rejects(
      () =>
        service.execute(
          summit.id,
          event.id,
          {
            type: "dancer",
            firstName: "No",
            lastName: "Pe",
            email: "school1@x.co",
            bibNumber: 5,
            userId: school.id,
          },
          audit()
        ),
      AccountNotFoundError
    );
  });

  test("a new coach email gets a pending entry and a school invite", async ({
    assert,
  }) => {
    const result = await service.execute(
      summit.id,
      event.id,
      {
        type: "coach",
        firstName: "Cal",
        lastName: "Coach",
        email: "cal@usc.edu",
        organization: "USC",
      },
      audit()
    );

    assert.isFalse(result.isRegistered);
    assert.equal(result.organization, "USC");
    assert.isNull(result.bibNumber);
    const invites = await db
      .select()
      .from(schoolInvites)
      .where(eq(schoolInvites.eventId, event.id));
    assert.lengthOf(invites, 1);
    assert.equal(invites[0]!.organization, "USC");
  });

  test("a linked school account becomes a coach member", async ({ assert }) => {
    const coach = await createUser({
      username: "coach1",
      email: "coach1@usc.edu",
      type: "school",
    });

    const result = await service.execute(
      summit.id,
      event.id,
      {
        type: "coach",
        firstName: "Co",
        lastName: "Ach",
        email: "coach1@usc.edu",
        organization: "USC",
        userId: coach.id,
      },
      audit()
    );

    assert.isTrue(result.isRegistered);
    const memberships = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, coach.id));
    assert.lengthOf(memberships, 1);
    assert.equal(memberships[0]!.type, "coach");
    assert.lengthOf(await db.select().from(schoolInvites), 0);
  });

  test("the upload's required columns are required here too", async ({
    assert,
  }) => {
    await assert.rejects(
      () =>
        service.execute(
          summit.id,
          event.id,
          { type: "dancer", firstName: "A", lastName: "B", email: "a@x.co" },
          audit()
        ),
      RosterFieldRequiredError
    );
    await assert.rejects(
      () =>
        service.execute(
          summit.id,
          event.id,
          { type: "coach", firstName: "A", lastName: "B", email: "a@x.co" },
          audit()
        ),
      RosterFieldRequiredError
    );
  });

  test("free-tier orgs need paid for a dancer and keep it", async ({
    assert,
  }) => {
    await db
      .update(organizations)
      .set({ features: { freeTierUsers: true } })
      .where(eq(organizations.id, summit.id));
    const dancer = {
      type: "dancer" as const,
      firstName: "Fr",
      lastName: "Ee",
      email: "free@x.co",
      bibNumber: 9,
    };

    await assert.rejects(
      () => service.execute(summit.id, event.id, dancer, audit()),
      RosterFieldRequiredError
    );

    const result = await service.execute(
      summit.id,
      event.id,
      { ...dancer, paid: false },
      audit()
    );
    const [row] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, result.id));
    assert.isFalse(row!.paid);
  });

  test("an email, account or bib already on the roster is refused", async ({
    assert,
  }) => {
    const dancer = await createUser({
      username: "dup",
      email: "dup@x.co",
      type: "dancer",
    });
    await service.execute(
      summit.id,
      event.id,
      {
        type: "dancer",
        firstName: "Du",
        lastName: "P",
        email: "dup@x.co",
        bibNumber: 1,
      },
      audit()
    );

    await assert.rejects(
      () =>
        service.execute(
          summit.id,
          event.id,
          {
            type: "dancer",
            firstName: "Du",
            lastName: "P",
            email: "dup@x.co",
            bibNumber: 2,
          },
          audit()
        ),
      RosterEmailConflictError
    );
    await assert.rejects(
      () =>
        service.execute(
          summit.id,
          event.id,
          {
            type: "dancer",
            firstName: "Ot",
            lastName: "Her",
            email: "other@x.co",
            bibNumber: 1,
          },
          audit()
        ),
      RosterBibConflictError
    );

    // The entry's email was edited after linking, so only the account matches.
    await db
      .update(eventRosters)
      .set({ email: "changed@x.co" })
      .where(eq(eventRosters.userId, dancer.id));
    await assert.rejects(
      () =>
        service.execute(
          summit.id,
          event.id,
          {
            type: "dancer",
            firstName: "Du",
            lastName: "P",
            email: "dup@x.co",
            bibNumber: 7,
            userId: dancer.id,
          },
          audit()
        ),
      RosterAccountTakenError
    );
  });

  test("a school account's email can't be added as a dancer", async ({
    assert,
  }) => {
    await createUser({
      username: "sch",
      email: "sch@x.co",
      type: "school",
    });

    await assert.rejects(
      () =>
        service.execute(
          summit.id,
          event.id,
          {
            type: "dancer",
            firstName: "S",
            lastName: "C",
            email: "sch@x.co",
            bibNumber: 8,
          },
          audit()
        ),
      RosterRoleConflictError
    );
  });

  test("an event from another org is refused", async ({ assert }) => {
    const [otherOrg] = await db
      .insert(organizations)
      .values({ slug: "other-org", name: "Other Org" })
      .returning();

    await assert.rejects(
      () =>
        service.execute(
          otherOrg!.id,
          event.id,
          {
            type: "dancer",
            firstName: "X",
            lastName: "Y",
            email: "x@x.co",
            bibNumber: 1,
          },
          audit()
        ),
      EventNotFoundError
    );
    assert.lengthOf(await db.select().from(eventRosters), 0);
  });
});
