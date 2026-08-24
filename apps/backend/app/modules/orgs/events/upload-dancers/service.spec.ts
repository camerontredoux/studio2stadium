import { test } from "@japa/runner";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import { dancerProfiles } from "#database/schema/dancers";
import {
  organizations,
  orgMemberships,
  premiumGrants,
  dancerInvites,
} from "#database/schema/organizations";
import {
  orgEvents,
  eventRosters,
  csvUploads,
  csvUploadRows,
} from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import { UploadDancersService } from "./service.ts";

async function createUser(attrs: { username: string; email: string }) {
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
    await db.delete(dancerProfiles).execute();
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

  test("matched dancer gets org membership and no premium grant", async ({
    assert,
  }) => {
    const dancer = await createUser({
      username: "dancer1",
      email: "dancer1@x.co",
    });

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

    // Roster row has userId set, and a matched dancer gets the tier window
    // dated from the event end (2026-06-14) plus the default 3 months.
    const [roster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.email, "dancer1@x.co"));
    assert.equal(roster!.userId, dancer.id);
    assert.isNotNull(roster!.userId);
    assert.equal(roster!.expirationDate, "2026-09-14");

    // No premium grant created
    const grants = await db
      .select()
      .from(premiumGrants)
      .where(eq(premiumGrants.userId, dancer.id));
    assert.lengthOf(grants, 0);

    // org_membership type=dancer created
    const [mem] = await db
      .select()
      .from(orgMemberships)
      .where(eq(orgMemberships.userId, dancer.id));
    assert.equal(mem!.type, "dancer");
  });

  test("matched dancer with a pre-existing account gets an org tier", async ({
    assert,
  }) => {
    // Regression: a dancer who already had an S2S account never goes through
    // the invite flow that assigns a tier, so she used to be left on NULL —
    // the plain free tier, which cannot add any video at all, not even YouTube.
    const dancer = await createUser({
      username: "preexisting",
      email: "preexisting@x.co",
    });

    const svc = new UploadDancersService();
    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers.csv",
      csv: `email,firstName,lastName,bibNumber
preexisting@x.co,Pre,Existing,201`,
    });

    const [u] = await db
      .select({
        tier: users.orgAccountTier,
        expiresAt: users.orgAccountTierExpiresAt,
      })
      .from(users)
      .where(eq(users.id, dancer.id));
    assert.equal(u!.tier, "standard");
    assert.equal(u!.expiresAt!.toISOString().split("T")[0], "2026-09-14");
  });

  test("free-tier org grants a tier to paid dancers only", async ({
    assert,
  }) => {
    const [freeOrg] = await db
      .insert(organizations)
      .values({
        slug: "freetier",
        name: "Free Tier Org",
        features: { freeTierUsers: true },
        settings: {},
      })
      .returning();
    const [freeEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: freeOrg!.id,
        name: "Free Tier Event",
        startDate: "2026-08-22",
        endDate: "2026-08-23",
        isActive: true,
      })
      .returning();

    const paid = await createUser({ username: "paid", email: "paid@x.co" });
    const unpaid = await createUser({
      username: "unpaid",
      email: "unpaid@x.co",
    });

    const svc = new UploadDancersService();
    await svc.execute({
      orgId: freeOrg!.id,
      eventId: freeEvent!.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers.csv",
      csv: `email,firstName,lastName,bibNumber,paid
paid@x.co,Paid,Dancer,301,yes
unpaid@x.co,Unpaid,Dancer,302,no`,
    });

    const [paidUser] = await db
      .select({
        tier: users.orgAccountTier,
        expiresAt: users.orgAccountTierExpiresAt,
      })
      .from(users)
      .where(eq(users.id, paid.id));
    assert.equal(paidUser!.tier, "standard");
    assert.equal(
      paidUser!.expiresAt!.toISOString().split("T")[0],
      "2026-11-23"
    );

    // Unpaid stays null rather than being pushed down to 'limited', which
    // would revoke the photo upload a plain free account already has.
    const [unpaidUser] = await db
      .select({ tier: users.orgAccountTier })
      .from(users)
      .where(eq(users.id, unpaid.id));
    assert.isNull(unpaidUser!.tier);
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
    const [invite] = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.email, "newghost@x.co"));
    assert.isNotNull(invite);
    assert.isNotNull(invite!.token);
    assert.isAbove(invite!.token.length, 10);
    assert.isAbove(invite!.expiresAt.getTime(), Date.now());
  });

  test("re-upload keeps the same dancer_invite token and does not reset consumedAt", async ({
    assert,
  }) => {
    const csv1 = `email,firstName,lastName,bibNumber
reupload@x.co,Re,Upload,501`;
    const csv2 = `email,firstName,lastName,bibNumber
reupload@x.co,Re,Upload,502`;

    const svc = new UploadDancersService();
    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://reupload1.csv",
      csv: csv1,
    });

    const [afterFirst] = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.email, "reupload@x.co"));
    const firstToken = afterFirst!.token;
    assert.isNotNull(firstToken);

    // Simulate registration: mark consumed and push expiry beyond the 30-day
    // upload window.
    const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90);
    const consumedAt = new Date();
    await db
      .update(dancerInvites)
      .set({ consumedAt, expiresAt: farFuture })
      .where(eq(dancerInvites.id, afterFirst!.id));

    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://reupload2.csv",
      csv: csv2,
    });

    const invites = await db
      .select()
      .from(dancerInvites)
      .where(eq(dancerInvites.email, "reupload@x.co"));
    assert.lengthOf(invites, 1);
    // Same token — a previously emailed link keeps working.
    assert.equal(invites[0]!.token, firstToken);
    // consumedAt untouched — an already-registered invite stays consumed.
    assert.isNotNull(invites[0]!.consumedAt);
    // Expiry not shortened below the far-future value.
    assert.equal(invites[0]!.expiresAt.getTime(), farFuture.getTime());
  });

  test("re-upload preserves an existing account link for a registered dancer with no profile row", async ({
    assert,
  }) => {
    // A registered dancer whose account has NO dancerProfiles row yet, so the
    // upload's dancerProfiles join won't match — the post-register / pre-profile
    // window. Re-upload must not clobber the existing roster link back to null.
    const [dancer] = await db
      .insert(users)
      .values({
        username: "linked1",
        email: "linked@x.co",
        displayEmail: "linked@x.co",
        firstName: "Linked",
        lastName: "Dancer",
        password: "x",
        role: "user",
        type: "dancer",
        verified: true,
      })
      .returning();
    await db.insert(eventRosters).values({
      eventId: event.id,
      type: "dancer",
      email: "linked@x.co",
      firstName: "Linked",
      lastName: "Dancer",
      bibNumber: 601,
      userId: dancer!.id,
    });
    await db.insert(dancerInvites).values({
      orgId: summit.id,
      email: "linked@x.co",
      token: "linked_consumed_token",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      consumedAt: new Date(),
    });

    const csv = `email,firstName,lastName,bibNumber
linked@x.co,Linked,Dancer,601`;
    await new UploadDancersService().execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://linked.csv",
      csv,
    });

    const [roster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.email, "linked@x.co"));
    // The existing account link must survive the re-upload (not reset to null).
    assert.equal(roster!.userId, dancer!.id);
  });

  test("re-upload updates bib number on existing roster row", async ({
    assert,
  }) => {
    await createUser({ username: "dancer3", email: "dancer3@x.co" });

    const csv1 = `email,firstName,lastName,bibNumber
dancer3@x.co,Dancer,Three,301`;
    const csv2 = `email,firstName,lastName,bibNumber
dancer3@x.co,Dancer,Three,399`;

    const svc = new UploadDancersService();
    const r1 = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://d3a.csv",
      csv: csv1,
    });
    const r2 = await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://d3b.csv",
      csv: csv2,
    });

    assert.equal(r1.rowsAdded, 1);
    assert.equal(r2.rowsUpdated, 1);
    assert.equal(r2.rowsAdded, 0);

    const [roster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.email, "dancer3@x.co"));
    assert.equal(roster!.bibNumber, 399);
  });

  test("CSV with parse errors returns preconditionFailed — no partial commit", async ({
    assert,
  }) => {
    const csv = `email,firstName,lastName,bibNumber
,Missing,Email,101
good@x.co,Good,Dancer,102`;

    const svc = new UploadDancersService();
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

  test("first upload to a brand-new event succeeds with no FK errors", async ({
    assert,
  }) => {
    // Fresh event — no prior uploads, no roster rows, tests the audit parentId ordering fix
    const [freshEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Brand New Event",
        startDate: "2026-08-01",
        endDate: "2026-08-02",
        isActive: false,
      })
      .returning();

    const csv = `email,firstName,lastName,bibNumber
fresh1@x.co,Fresh,One,1
fresh2@x.co,Fresh,Two,2`;

    const svc = new UploadDancersService();
    const result = await svc.execute({
      orgId: summit.id,
      eventId: freshEvent!.id,
      uploaderId: uploader.id,
      fileUrl: "test://fresh.csv",
      csv,
    });

    assert.equal(result.rowsAdded, 2);
    assert.equal(result.rowsUpdated, 0);
    assert.equal(result.rowsErrored, 0);

    const rosters = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.eventId, freshEvent!.id));
    assert.lengthOf(rosters, 2);
  });

  test("keeps a snapshot of every uploaded row", async ({ assert }) => {
    const dancer = await createUser({
      username: "snapshot1",
      email: "snapshot1@x.co",
    });

    const csv = `email,firstName,lastName,bibNumber
snapshot1@x.co,Snap,One,201
nobody@x.co,No,Body,202`;

    const svc = new UploadDancersService();
    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers.csv",
      csv,
    });

    const snapshots = await db.select().from(csvUploadRows);
    assert.lengthOf(snapshots, 2);

    const matched = snapshots.find((r) => r.email === "snapshot1@x.co")!;
    assert.equal(matched.outcome, "added");
    assert.equal(matched.matchedUserId, dancer.id);
    assert.equal(matched.bibNumber, 201);
    assert.isNotNull(matched.rosterId);

    // A row that matched no account produced an invite, not a link.
    const pending = snapshots.find((r) => r.email === "nobody@x.co")!;
    assert.equal(pending.outcome, "added");
    assert.isNull(pending.matchedUserId);
  });

  test("snapshot survives the roster entry being rewritten", async ({
    assert,
  }) => {
    const csv = `email,firstName,lastName,bibNumber
original@x.co,Original,Name,301`;

    const svc = new UploadDancersService();
    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers.csv",
      csv,
    });

    // Stand in for an account attach, which rewrites the entry's identity.
    await db
      .update(eventRosters)
      .set({ email: "rewritten@x.co", firstName: "Rewritten" })
      .where(eq(eventRosters.email, "original@x.co"));

    // The address the dancer was uploaded under is still discoverable, which
    // is the whole point of keeping the snapshot.
    const [snapshot] = await db
      .select()
      .from(csvUploadRows)
      .where(eq(csvUploadRows.email, "original@x.co"));
    assert.exists(snapshot);
    assert.equal(snapshot!.firstName, "Original");
  });

  test("records an updated row as updated on re-upload", async ({ assert }) => {
    const csv = `email,firstName,lastName,bibNumber
repeat@x.co,Repeat,Row,401`;

    const svc = new UploadDancersService();
    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers.csv",
      csv,
    });
    await svc.execute({
      orgId: summit.id,
      eventId: event.id,
      uploaderId: uploader.id,
      fileUrl: "test://dancers-2.csv",
      csv,
    });

    const snapshots = await db
      .select()
      .from(csvUploadRows)
      .where(eq(csvUploadRows.email, "repeat@x.co"));

    assert.lengthOf(snapshots, 2);
    assert.sameMembers(
      snapshots.map((r) => r.outcome),
      ["added", "updated"]
    );
  });
});
