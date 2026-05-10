import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import { schoolProfiles } from "#database/schema/schools";
import { organizations, orgMemberships } from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
} from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { enforceEmailRole } from "./role-guard.ts";
import { UploadDancersService } from "#modules/orgs/events/upload-dancers/service";
import { UploadCoachesService } from "#modules/orgs/events/upload-coaches/service";

async function createDancer(attrs: { username: string; email: string }) {
  const [u] = await db
    .insert(users)
    .values({
      username: attrs.username,
      email: attrs.email,
      displayEmail: attrs.email,
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

async function createSchool(attrs: { username: string; email: string }) {
  const [u] = await db
    .insert(users)
    .values({
      username: attrs.username,
      email: attrs.email,
      displayEmail: attrs.email,
      firstName: "Test",
      lastName: "School",
      password: "x",
      role: "user",
      type: "school",
      verified: true,
    })
    .returning();
  await db.insert(schoolProfiles).values({
    userId: u!.id,
    name: `School-${attrs.username}`,
    location: "Anywhere",
  });
  return u!;
}

test.group("enforceEmailRole", (group) => {
  group.each.setup(async () => {
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(dancerProfiles).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
  });

  test("dancer CSV with school email returns cross-role conflict", async ({
    assert,
  }) => {
    await createSchool({ username: "school1", email: "school1@usc.edu" });
    const conflicts = await enforceEmailRole(
      db,
      ["school1@usc.edu", "brandnew@x.co"],
      "dancer"
    );
    assert.lengthOf(conflicts, 1);
    assert.equal(conflicts[0]!.email, "school1@usc.edu");
    assert.equal(conflicts[0]!.conflictingType, "school");
  });

  test("coach CSV with dancer email returns cross-role conflict", async ({
    assert,
  }) => {
    await createDancer({ username: "dancer1", email: "dancer1@x.co" });
    const conflicts = await enforceEmailRole(
      db,
      ["dancer1@x.co", "brandnew@x.co"],
      "coach"
    );
    assert.lengthOf(conflicts, 1);
    assert.equal(conflicts[0]!.email, "dancer1@x.co");
    assert.equal(conflicts[0]!.conflictingType, "dancer");
  });

  test("brand-new email passes with no conflicts for either role", async ({
    assert,
  }) => {
    const dancerConflicts = await enforceEmailRole(
      db,
      ["new1@x.co", "new2@x.co"],
      "dancer"
    );
    const coachConflicts = await enforceEmailRole(
      db,
      ["new1@x.co", "new2@x.co"],
      "coach"
    );
    assert.lengthOf(dancerConflicts, 0);
    assert.lengthOf(coachConflicts, 0);
  });
});

test.group("UploadDancersService — role guard", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;
  let uploader: typeof users.$inferSelect;

  group.each.setup(async () => {
    await db.delete(csvUploads).execute();
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
    uploader = await createDancer({
      username: "uploader",
      email: "uploader@x.co",
    });
    await db.insert(orgMemberships).values({
      userId: uploader.id,
      orgId: summit.id,
      type: "coach",
      role: "admin",
    });
    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Test Event",
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        isActive: false,
      })
      .returning();
    event = ev!;
  });

  test("dancer CSV rejects known school email — preconditionFailed, no partial commit", async ({
    assert,
  }) => {
    await createSchool({ username: "schoolcoach", email: "coach@usc.edu" });

    const csv = `email,firstName,lastName,bibNumber
coach@usc.edu,Coach,Person,101
legit@x.co,Legit,Dancer,102`;

    const svc = new UploadDancersService();
    const result = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers.csv",
      csv,
    });

    assert.isTrue("preconditionFailed" in result && result.preconditionFailed);
    assert.isTrue(
      "errors" in result &&
        (result.errors as Array<{ reason: string }>).some((e) =>
          e.reason.includes("school account")
        )
    );

    const rosters = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, event.id));
    assert.lengthOf(rosters, 0);
  });
});

test.group("UploadCoachesService — role guard", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;
  let uploader: typeof users.$inferSelect;

  group.each.setup(async () => {
    await db.delete(csvUploads).execute();
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
    uploader = await createSchool({
      username: "uploader",
      email: "uploader@usc.edu",
    });
    await db.insert(orgMemberships).values({
      userId: uploader.id,
      orgId: summit.id,
      type: "coach",
      role: "admin",
    });
    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Test Event",
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        isActive: false,
      })
      .returning();
    event = ev!;
  });

  test("coach CSV rejects known dancer email — preconditionFailed, no partial commit", async ({
    assert,
  }) => {
    await createDancer({ username: "adancer", email: "dancer@x.co" });

    const csv = `email,firstName,lastName,organization
dancer@x.co,Some,Dancer,StudioX
legit@usc.edu,Legit,Coach,USC`;

    const svc = new UploadCoachesService();
    const result = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://coaches.csv",
      csv,
    });

    assert.isTrue("preconditionFailed" in result && result.preconditionFailed);
    assert.isTrue(
      "errors" in result &&
        (result.errors as Array<{ reason: string }>).some((e) =>
          e.reason.includes("dancer account")
        )
    );

    const rosters = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, event.id));
    assert.lengthOf(rosters, 0);
  });

  test("coach CSV with all-dancer emails returns preconditionFailed", async ({
    assert,
  }) => {
    await createDancer({ username: "dancer2", email: "dancer2@x.co" });

    const csv = `email,firstName,lastName,organization
dancer2@x.co,Another,Dancer,StudioY`;

    const svc = new UploadCoachesService();
    const result = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://coaches2.csv",
      csv,
    });

    assert.isTrue("preconditionFailed" in result && result.preconditionFailed);
  });
});
