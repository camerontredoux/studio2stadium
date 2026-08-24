import { test } from "@japa/runner";
import { db } from "#database/connection";
import {
  eventRosters,
  orgEvents,
  rosterClaimRequests,
} from "#database/schema/org-events";
import { organizations } from "#database/schema/organizations";
import { users } from "#database/schema/users";
import { eq, inArray } from "drizzle-orm";
import {
  AlreadyOnRosterError,
  CreateRosterClaimService,
} from "./create/service.ts";
import { ListRosterClaimsService } from "./list/service.ts";
import {
  ClaimRosterMismatchError,
  ResolveRosterClaimService,
} from "./resolve/service.ts";

const PARENT_EMAIL = "parent-account@test.com";
const DANCER_EMAIL = "dancer-own@test.com";

test.group("Roster claim requests", (group) => {
  let orgId: string;
  let eventId: string;
  let rosterId: string;
  let adminId: string;
  let parentId: string;
  let dancerId: string;

  group.each.setup(async () => {
    await db.delete(rosterClaimRequests).execute();
    await db.delete(eventRosters).execute();
    await db.delete(orgEvents).execute();
    await db
      .delete(users)
      .where(inArray(users.email, [PARENT_EMAIL, DANCER_EMAIL]))
      .execute();

    const [org] = await db.select().from(organizations).limit(1);
    orgId = org.id;
    const [admin] = await db.select().from(users).limit(1);
    adminId = admin.id;

    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId,
        name: "Test Event",
        startDate: "2020-01-01",
        endDate: "2020-01-03",
        isActive: true,
      })
      .returning();
    eventId = ev.id;

    const inserted = await db
      .insert(users)
      .values([
        {
          username: "claim_parent",
          email: PARENT_EMAIL,
          displayEmail: PARENT_EMAIL,
          firstName: "Parent",
          lastName: "Account",
          password: "x",
          role: "user" as const,
          type: "dancer" as const,
          verified: true,
        },
        {
          username: "claim_dancer",
          email: DANCER_EMAIL,
          displayEmail: DANCER_EMAIL,
          firstName: "Real",
          lastName: "Dancer",
          password: "x",
          role: "user" as const,
          type: "dancer" as const,
          verified: true,
        },
      ])
      .returning();
    parentId = inserted.find((u) => u.email === PARENT_EMAIL)!.id;
    dancerId = inserted.find((u) => u.email === DANCER_EMAIL)!.id;

    // The entry as the org uploaded it: registered under the parent's address
    // and already claimed by the parent's account.
    const [roster] = await db
      .insert(eventRosters)
      .values({
        eventId,
        type: "dancer",
        email: PARENT_EMAIL,
        firstName: "Real",
        lastName: "Dancer",
        userId: parentId,
      })
      .returning();
    rosterId = roster.id;
  });

  test("a dancer can file a claim", async ({ assert }) => {
    const svc = new CreateRosterClaimService();
    const claim = await svc.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
      claimedEmail: PARENT_EMAIL,
    });

    assert.equal(claim!.status, "pending");
    assert.equal(claim!.requesterId, dancerId);
  });

  test("filing a claim links nothing on its own", async ({ assert }) => {
    const svc = new CreateRosterClaimService();
    await svc.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
    });

    // The parent still holds the entry. A request is not an action.
    const [roster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, rosterId));
    assert.equal(roster.userId, parentId);
  });

  test("re-submitting updates the open request instead of adding one", async ({
    assert,
  }) => {
    const svc = new CreateRosterClaimService();
    await svc.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
    });
    await svc.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
      note: "second try",
    });

    const rows = await db
      .select()
      .from(rosterClaimRequests)
      .where(eq(rosterClaimRequests.requesterId, dancerId));
    assert.lengthOf(rows, 1);
    assert.equal(rows[0]!.note, "second try");
  });

  test("refuses a claim from someone already on the roster", async ({
    assert,
  }) => {
    const svc = new CreateRosterClaimService();
    await assert.rejects(
      () =>
        svc.execute(orgId, parentId, {
          claimedFirstName: "Real",
          claimedLastName: "Dancer",
        }),
      AlreadyOnRosterError.prototype.message
    );
  });

  test("approving reassigns the entry to the requester", async ({ assert }) => {
    const create = new CreateRosterClaimService();
    const claim = await create.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
    });

    const resolve = new ResolveRosterClaimService();
    await resolve.approve(orgId, claim!.id, rosterId, adminId);

    const [roster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, rosterId));
    assert.equal(roster.userId, dancerId);
    assert.equal(roster.email, DANCER_EMAIL);

    const [updated] = await db
      .select()
      .from(rosterClaimRequests)
      .where(eq(rosterClaimRequests.id, claim!.id));
    assert.equal(updated.status, "approved");
    assert.equal(updated.resolvedRosterId, rosterId);
    assert.equal(updated.resolvedBy, adminId);
  });

  test("rejecting leaves the roster untouched", async ({ assert }) => {
    const create = new CreateRosterClaimService();
    const claim = await create.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
    });

    const resolve = new ResolveRosterClaimService();
    await resolve.reject(orgId, claim!.id, adminId);

    const [roster] = await db
      .select()
      .from(eventRosters)
      .where(eq(eventRosters.id, rosterId));
    assert.equal(roster.userId, parentId);

    const [updated] = await db
      .select()
      .from(rosterClaimRequests)
      .where(eq(rosterClaimRequests.id, claim!.id));
    assert.equal(updated.status, "rejected");
  });

  test("refuses to approve against another org's roster entry", async ({
    assert,
  }) => {
    const [otherOrg] = await db
      .insert(organizations)
      .values({ name: "Other Org", slug: "other-org-claims" })
      .returning();
    const [otherEvent] = await db
      .insert(orgEvents)
      .values({
        orgId: otherOrg!.id,
        name: "Other Event",
        startDate: "2020-01-01",
        endDate: "2020-01-03",
      })
      .returning();
    const [otherRoster] = await db
      .insert(eventRosters)
      .values({
        eventId: otherEvent!.id,
        type: "dancer",
        email: "elsewhere@test.com",
        firstName: "Else",
        lastName: "Where",
      })
      .returning();

    const create = new CreateRosterClaimService();
    const claim = await create.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
    });

    const resolve = new ResolveRosterClaimService();
    await assert.rejects(
      () => resolve.approve(orgId, claim!.id, otherRoster!.id, adminId),
      ClaimRosterMismatchError.prototype.message
    );

    await db.delete(organizations).where(eq(organizations.id, otherOrg!.id));
  });

  test("lists pending claims for admins", async ({ assert }) => {
    const create = new CreateRosterClaimService();
    await create.execute(orgId, dancerId, {
      claimedFirstName: "Real",
      claimedLastName: "Dancer",
      claimedEmail: PARENT_EMAIL,
    });

    const list = new ListRosterClaimsService();
    const res = await list.execute(orgId, "pending");

    assert.lengthOf(res.data, 1);
    assert.equal(res.data[0]!.requester.email, DANCER_EMAIL);
    assert.equal(res.data[0]!.claimed.email, PARENT_EMAIL);
  });
});
