import { test } from "@japa/runner";
import OrgFeatureMiddleware from "./org_feature.ts";

type State = {
  nextCalled: boolean;
  notFoundBody: { message: string } | null;
};

function mockCtx(features: Record<string, boolean> | null) {
  const state: State = { nextCalled: false, notFoundBody: null };
  const ctx: any = {
    org: features === null ? undefined : { features },
    response: {
      notFound: (body: { message: string }) => {
        state.notFoundBody = body;
      },
    },
  };
  const next = async () => {
    state.nextCalled = true;
  };
  return { ctx, state, next };
}

test.group("OrgFeatureMiddleware", () => {
  test("allows when the feature key is true", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({ callbacks: true });
    await new OrgFeatureMiddleware().handle(ctx, next, "callbacks");
    assert.isTrue(state.nextCalled);
    assert.isNull(state.notFoundBody);
  });

  test("404s when the feature key is false", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({ callbacks: false });
    await new OrgFeatureMiddleware().handle(ctx, next, "callbacks");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });

  test("404s when the feature key is missing from features", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({ something_else: true });
    await new OrgFeatureMiddleware().handle(ctx, next, "callbacks");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });

  test("404s when ctx.org is missing entirely", async ({ assert }) => {
    const { ctx, state, next } = mockCtx(null);
    await new OrgFeatureMiddleware().handle(ctx, next, "callbacks");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });
});
