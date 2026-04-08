import { test } from "@japa/runner";
import { eq } from "drizzle-orm";
import { db } from "#database/connection";
import { users } from "#database/schema/users";
import {
  organizations,
  orgMemberships,
} from "#database/schema/organizations";
import { seedOrganizations } from "#commands/backfill-organizations";
import OrgMemberMiddleware from "./org_member.ts";
import OrgAdminMiddleware from "./org_admin.ts";
import OrgCoachMiddleware from "./org_coach.ts";
import OrgDancerMiddleware from "./org_dancer.ts";

type CtxState = {
  nextCalled: boolean;
  forbiddenBody: { message: string } | null;
  notFoundBody: { message: string } | null;
};

function mockCtx(opts: {
  user: { id: string } | null;
  org?: { id: string; slug: string } | null;
  membership?: { role: string; type: string } | null;
}) {
  const state: CtxState = {
    nextCalled: false,
    forbiddenBody: null,
    notFoundBody: null,
  };
  const ctx: any = {
    auth: {
      getUserOrFail: () => {
        if (!opts.user) throw new Error("not authed");
        return opts.user;
      },
    },
    params: { slug: opts.org?.slug ?? "unknown" },
    response: {
      forbidden: (body: { message: string }) => {
        state.forbiddenBody = body;
      },
      notFound: (body: { message: string }) => {
        state.notFoundBody = body;
      },
    },
    org: opts.org ?? undefined,
    orgMembership: opts.membership ?? undefined,
  };
  const next = async () => {
    state.nextCalled = true;
  };
  return { ctx, state, next };
}

async function createUser(suffix: string) {
  const [u] = await db
    .insert(users)
    .values({
      username: `role-${suffix}`,
      email: `role-${suffix}@example.com`,
      role: "user",
      type: "dancer",
      displayEmail: `role-${suffix}@example.com`,
      firstName: "Role",
      lastName: "Test",
      password: "x",
    })
    .returning();
  return u!;
}

test.group("org role middlewares", (group) => {
  group.each.setup(async () => {
    await db.delete(orgMemberships).execute();
    await db.delete(users).execute();
    await db.delete(organizations).execute();
    await seedOrganizations();
  });

  // ----- orgMember ------
  test("orgMember allows a user with a membership row", async ({ assert }) => {
    const user = await createUser("m1");
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    await db.insert(orgMemberships).values({
      userId: user.id,
      orgId: summit!.id,
      type: "dancer",
      role: "member",
    });

    const { ctx, state, next } = mockCtx({
      user: { id: user.id },
      org: summit as any,
    });
    await new OrgMemberMiddleware().handle(ctx, next);

    assert.isTrue(state.nextCalled);
    assert.isNull(state.forbiddenBody);
    assert.exists(ctx.orgMembership);
    assert.equal(ctx.orgMembership?.type, "dancer");
  });

  test("orgMember forbids a non-member", async ({ assert }) => {
    const user = await createUser("m2");
    const [summit] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, "summit"));
    const { ctx, state, next } = mockCtx({
      user: { id: user.id },
      org: summit as any,
    });
    await new OrgMemberMiddleware().handle(ctx, next);

    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.forbiddenBody);
  });

  test("orgMember 404s when ctx.org is missing", async ({ assert }) => {
    const user = await createUser("m3");
    const { ctx, state, next } = mockCtx({
      user: { id: user.id },
      org: null,
    });
    await new OrgMemberMiddleware().handle(ctx, next);
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });

  // ----- orgAdmin ------
  test("orgAdmin allows role=admin", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      user: { id: "u1" },
      membership: { role: "admin", type: "coach" },
    });
    await new OrgAdminMiddleware().handle(ctx, next);
    assert.isTrue(state.nextCalled);
  });

  test("orgAdmin forbids role=member", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      user: { id: "u2" },
      membership: { role: "member", type: "coach" },
    });
    await new OrgAdminMiddleware().handle(ctx, next);
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.forbiddenBody);
  });

  // ----- orgCoach ------
  test("orgCoach allows type=coach", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      user: { id: "u3" },
      membership: { role: "member", type: "coach" },
    });
    await new OrgCoachMiddleware().handle(ctx, next);
    assert.isTrue(state.nextCalled);
  });

  test("orgCoach allows admins even if type=dancer", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      user: { id: "u4" },
      membership: { role: "admin", type: "dancer" },
    });
    await new OrgCoachMiddleware().handle(ctx, next);
    assert.isTrue(state.nextCalled);
  });

  test("orgCoach forbids plain dancer members", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      user: { id: "u5" },
      membership: { role: "member", type: "dancer" },
    });
    await new OrgCoachMiddleware().handle(ctx, next);
    assert.isFalse(state.nextCalled);
  });

  // ----- orgDancer ------
  test("orgDancer allows type=dancer", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      user: { id: "u6" },
      membership: { role: "member", type: "dancer" },
    });
    await new OrgDancerMiddleware().handle(ctx, next);
    assert.isTrue(state.nextCalled);
  });

  test("orgDancer forbids type=coach even if role=admin", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      user: { id: "u7" },
      membership: { role: "admin", type: "coach" },
    });
    await new OrgDancerMiddleware().handle(ctx, next);
    assert.isFalse(state.nextCalled);
  });
});
