import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { schoolProfiles } from "#database/schema/schools";
import { organizations, orgMemberships } from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
} from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { UploadCoachesService } from "./service.ts";

async function createUser(attrs: {
  username: string;
  email: string;
  withSchoolProfile?: boolean;
}) {
  const [u] = await db
    .insert(users)
    .values({
      username: attrs.username,
      email: attrs.email,
      displayEmail: attrs.email,
      firstName: "Test",
      lastName: "Coach",
      password: "x",
      role: "user",
      type: "school",
      verified: true,
    })
    .returning();
  if (attrs.withSchoolProfile && u) {
    await db.insert(schoolProfiles).values({
      userId: u.id,
      name: `School-${attrs.username}`,
      location: "Anywhere",
    });
  }
  return u!;
}

test.group("UploadCoachesService", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;
  let uploader: typeof users.$inferSelect;

  group.each.setup(async () => {
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(schoolProfiles).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();

    [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    uploader = await createUser({
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
        name: "Summit 2026",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      })
      .returning();
    event = ev!;
  });

  test("matched coach gets userId + org_membership created", async ({
    assert,
  }) => {
    const coach = await createUser({
      username: "coach1",
      email: "coach1@usc.edu",
      withSchoolProfile: true,
    });

    const csv = `email,firstName,lastName,organization
coach1@usc.edu,Coach,One,USC
ghost@ucla.edu,Ghost,Er,UCLA`;

    const svc = new UploadCoachesService();
    const result = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://coaches.csv",
      csv,
    });

    assert.equal(result.rowsAdded, 2);
    assert.equal(result.rowsUpdated, 0);
    assert.equal(result.rowsErrored, 0);

    // Matched coach has userId set
    const [matchedRoster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.email, "coach1@usc.edu"));
    assert.equal(matchedRoster!.userId, coach.id);
    assert.isNotNull(matchedRoster!.userId);

    // Unmatched coach has no userId
    const [unmatchedRoster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.email, "ghost@ucla.edu"));
    assert.isNull(unmatchedRoster!.userId);

    // org_membership created for matched coach
    const [membership] = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, coach.id));
    assert.equal(membership!.type, "coach");
    assert.equal(membership!.orgId, summit.id);
  });

  test("re-upload is idempotent: updates existing rows, no duplicates", async ({
    assert,
  }) => {
    await createUser({
      username: "coach2",
      email: "coach2@usc.edu",
      withSchoolProfile: true,
    });

    const csv = `email,firstName,lastName,organization
coach2@usc.edu,Coach,Two,USC`;

    const svc = new UploadCoachesService();
    const first = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://1.csv",
      csv,
    });
    const second = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://2.csv",
      csv,
    });

    assert.equal(first.rowsAdded, 1);
    assert.equal(second.rowsAdded, 0);
    assert.equal(second.rowsUpdated, 1);

    // No duplicate rows
    const rosters = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, event.id));
    assert.lengthOf(rosters, 1);
  });

  test("CSV with parse errors returns preconditionFailed — no partial commit", async ({
    assert,
  }) => {
    const csv = `email,firstName,lastName,organization
,Missing,Email,USC
good@x.co,Good,Row,UCLA`;

    const svc = new UploadCoachesService();
    const result = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://err.csv",
      csv,
    });

    assert.isTrue("preconditionFailed" in result && result.preconditionFailed);

    // No roster rows written
    const rosters = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, event.id));
    assert.lengthOf(rosters, 0);
  });
});
