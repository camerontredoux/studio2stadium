import { test } from "@japa/runner";
import { db } from "#database/connection";
import { organizations } from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";
import OrgMiddleware from "./org.ts";

type CtxState = {
  org: unknown;
  notFoundBody: { message: string } | null;
};

function mockCtx(slug: string | undefined): { ctx: any; state: CtxState } {
  const state: CtxState = { org: undefined, notFoundBody: null };
  const ctx = {
    params: { slug },
    response: {
      notFound: (body: { message: string }) => {
        state.notFoundBody = body;
      },
    },
    get org() {
      return state.org;
    },
    set org(value) {
      state.org = value;
    },
  };
  return { ctx, state };
}

test.group("OrgMiddleware", (group) => {
  group.each.setup(async () => {
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  test("attaches ctx.org for a valid slug and calls next", async ({ assert }) => {
    const { ctx, state } = mockCtx("summit");
    let nextCalled = false;
    await new OrgMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });
    assert.isTrue(nextCalled);
    assert.isNull(state.notFoundBody);
    const org = state.org as { slug: string } | undefined;
    assert.equal(org?.slug, "summit");
  });

  test("404s when slug is unknown", async ({ assert }) => {
    const { ctx, state } = mockCtx("does-not-exist");
    let nextCalled = false;
    await new OrgMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.isNotNull(state.notFoundBody);
    assert.match(state.notFoundBody!.message, /not found/i);
  });

  test("404s when slug is missing from params", async ({ assert }) => {
    const { ctx, state } = mockCtx(undefined);
    let nextCalled = false;
    await new OrgMiddleware().handle(ctx, async () => {
      nextCalled = true;
    });
    assert.isFalse(nextCalled);
    assert.isNotNull(state.notFoundBody);
  });
});
