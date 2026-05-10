import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { orgEvents } from "#database/schema/org-events";
import { seedOrganizations } from "#commands/backfill-organizations";
import { eq } from "drizzle-orm";
import OrgEventMiddleware from "./org-event.ts";

// Helper to mock a ctx that already has ctx.org set (org middleware already ran)
function mockCtxWithOrg(org: any) {
  const state: { orgEvent: any; orgRoster: any; notFoundBody: any } = {
    orgEvent: undefined,
    orgRoster: undefined,
    notFoundBody: null,
  };
  const ctx: any = {
    org,
    auth: {
      getUserOrFail: () => {
        throw new Error("not authed");
      },
    },
    response: {
      notFound: (body: any) => {
        state.notFoundBody = body;
      },
    },
    get orgEvent() {
      return state.orgEvent;
    },
    set orgEvent(v) {
      state.orgEvent = v;
    },
    get orgRoster() {
      return state.orgRoster;
    },
    set orgRoster(v) {
      state.orgRoster = v;
    },
  };
  return { ctx, state };
}

test.group("OrgEventMiddleware", (group) => {
  let summit: any;

  group.each.setup(async () => {
    await db.delete(orgEvents).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
    [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
  });

  test("404 when no active event exists", async ({ assert }) => {
    const { ctx, state } = mockCtxWithOrg(summit);
    let nextCalled = false;
    await new OrgEventMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.isNotNull(state.notFoundBody);
    assert.match(state.notFoundBody.message, /no active event/i);
  });

  test("attaches active event to ctx.orgEvent", async ({ assert }) => {
    const [ev] = await db
      .insert(orgEvents)
      .values({
        orgId: summit.id,
        name: "Test Event",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        isActive: true,
      })
      .returning();

    const { ctx, state } = mockCtxWithOrg(summit);
    let nextCalled = false;
    await new OrgEventMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });
    assert.isTrue(nextCalled);
    assert.isNull(state.notFoundBody);
    assert.equal(state.orgEvent?.id, ev.id);
  });

  test("404 when ctx.org is missing", async ({ assert }) => {
    const state: any = { orgEvent: undefined, notFoundBody: null };
    const ctx: any = {
      org: undefined,
      auth: {
        getUserOrFail: () => {
          throw new Error("not authed");
        },
      },
      response: {
        notFound: (body: any) => {
          state.notFoundBody = body;
        },
      },
      get orgEvent() {
        return state.orgEvent;
      },
      set orgEvent(v: any) {
        state.orgEvent = v;
      },
    };
    let nextCalled = false;
    await new OrgEventMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.isNotNull(state.notFoundBody);
  });
});
