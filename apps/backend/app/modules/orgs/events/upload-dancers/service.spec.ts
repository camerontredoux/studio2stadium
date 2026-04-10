import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { organizations, orgMemberships, premiumGrants, dancerInvites } from "#database/schema/organizations";
import { orgEvents, eventRosters, csvUploads } from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { UploadDancersService } from "./service.ts";

async function createUser(attrs: { username: string; email: string }) {
  const [u] = await db.insert(users).values({
    username: attrs.username,
    email: attrs.email,
    displayEmail: attrs.email,
    firstName: "Test",
    lastName: "Dancer",
    password: "x",
    role: "user",
    type: "dancer",
    verified: true,
  }).returning();
  return u!;
}

test.group("UploadDancersService", (group) => {
  let summit: typeof organizations.$inferSelect;
  let event: typeof orgEvents.$inferSelect;
  let uploader: typeof users.$inferSelect;

  group.each.setup(async () => {
    await db.delete(premiumGrants).execute();
    await db.delete(dancerInvites).execute();
    await db.delete(csvUploads).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();

    [summit] = await db.select().from(organizations).where(eq(organizations.slug, "summit"));
    uploader = await createUser({ username: "uploader", email: "uploader@x.co" });
    await db.insert(orgMemberships).values({ userId: uploader.id, orgId: summit.id, type: "coach", role: "admin" });

    const [ev] = await db.insert(orgEvents).values({
      orgId: summit.id,
      name: "Summit 2026",
      startDate: "2026-06-13",
      endDate: "2026-06-14",
      isActive: true,
    }).returning();
    event = ev!;
  });

  test("matched dancer gets premium grant with sourceId=eventId", async ({ assert }) => {
    const dancer = await createUser({ username: "dancer1", email: "dancer1@x.co" });

    const csv = `email,firstName,lastName,bibNumber
dancer1@x.co,Dancer,One,101`;

    const svc = new UploadDancersService();
    const result = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers.csv",
      csv,
    });

    assert.equal(result.rowsAdded, 1);
    assert.equal(result.rowsErrored, 0);

    // Roster row has userId and expirationDate set
    const [roster] = await db.select().from(eventRosters).where(eq(eventRosters.email, "dancer1@x.co"));
    assert.equal(roster!.userId, dancer.id);
    assert.isNotNull(roster!.userId);
    assert.isNotNull(roster!.expirationDate);

    // premium_grant created with sourceId = eventId
    const [grant] = await db.select().from(premiumGrants).where(eq(premiumGrants.userId, dancer.id));
    assert.equal(grant!.sourceType, "org_event");
    assert.equal(grant!.sourceId, event.id);
    assert.isAbove(grant!.expiresAt.getTime(), Date.now());

    // org_membership type=dancer created
    const [mem] = await db.select().from(orgMemberships)
      .where(eq(orgMemberships.userId, dancer.id));
    assert.equal(mem!.type, "dancer");
  });

  test("unmatched dancer gets dancer_invite token", async ({ assert }) => {
    const csv = `email,firstName,lastName,bibNumber
newghost@x.co,Ghost,Dancer,202`;

    const svc = new UploadDancersService();
    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers2.csv",
      csv,
    });

    // Dancer invite created with a token
    const [invite] = await db.select().from(dancerInvites)
      .where(eq(dancerInvites.email, "newghost@x.co"));
    assert.isNotNull(invite);
    assert.isNotNull(invite!.token);
    assert.isAbove(invite!.token.length, 10);
    assert.isAbove(invite!.expiresAt.getTime(), Date.now());
  });

  test("re-upload updates bib number on existing roster row", async ({ assert }) => {
    await createUser({ username: "dancer3", email: "dancer3@x.co" });

    const csv1 = `email,firstName,lastName,bibNumber
dancer3@x.co,Dancer,Three,301`;
    const csv2 = `email,firstName,lastName,bibNumber
dancer3@x.co,Dancer,Three,399`;

    const svc = new UploadDancersService();
    const r1 = await svc.execute({ orgId: summit.id, eventId: event.id, uploaderId: uploader.id, fileUrl: "test://d3a.csv", csv: csv1 });
    const r2 = await svc.execute({ orgId: summit.id, eventId: event.id, uploaderId: uploader.id, fileUrl: "test://d3b.csv", csv: csv2 });

    assert.equal(r1.rowsAdded, 1);
    assert.equal(r2.rowsUpdated, 1);
    assert.equal(r2.rowsAdded, 0);

    const [roster] = await db.select().from(eventRosters).where(eq(eventRosters.email, "dancer3@x.co"));
    assert.equal(roster!.bibNumber, 399);
  });

  test("rows with missing bib are errored but valid rows are still inserted", async ({ assert }) => {
    const csv = `email,firstName,lastName,bibNumber
,Missing,Email,101
good@x.co,Good,Dancer,102`;

    const svc = new UploadDancersService();
    const result = await svc.execute({ orgId: summit.id, eventId: event.id, uploaderId: uploader.id, fileUrl: "test://err.csv", csv });
    assert.equal(result.rowsAdded, 1);
    assert.equal(result.rowsErrored, 1);
  });
});
