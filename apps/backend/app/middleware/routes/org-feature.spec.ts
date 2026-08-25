import { test } from "@japa/runner";
import OrgFeatureMiddleware from "./org-feature.ts";
import type { EventTier } from "#shared/org/event-tiers";

type State = {
  nextCalled: boolean;
  notFoundBody: { message: string } | null;
};

function mockCtx(options: {
  features?: Record<string, boolean> | null;
  eventTier?: EventTier;
}) {
  const state: State = { nextCalled: false, notFoundBody: null };
  const ctx: any = {
    org:
      options.features === null || options.features === undefined
        ? undefined
        : { features: options.features },
    orgEvent: options.eventTier ? { eventTier: options.eventTier } : undefined,
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

test.group("OrgFeatureMiddleware — Event Tier capabilities", () => {
  test("allows when the active event's Event Tier includes the capability", async ({
    assert,
  }) => {
    const { ctx, state, next } = mockCtx({ eventTier: "regional" });
    await new OrgFeatureMiddleware().handle(ctx, next, "callbacks");
    assert.isTrue(state.nextCalled);
    assert.isNull(state.notFoundBody);
  });

  test("404s when the active event's Event Tier excludes the capability", async ({
    assert,
  }) => {
    const { ctx, state, next } = mockCtx({ eventTier: "core" });
    await new OrgFeatureMiddleware().handle(ctx, next, "callbacks");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });

  test("a grandfathered Enterprise event keeps every capability", async ({
    assert,
  }) => {
    for (const capability of [
      "callbacks",
      "check_in",
      "school_selections",
      "video_library",
    ] as const) {
      const { ctx, state, next } = mockCtx({ eventTier: "enterprise" });
      await new OrgFeatureMiddleware().handle(ctx, next, capability);
      assert.isTrue(state.nextCalled, capability);
    }
  });

  test("an explicit org flag overrides the Event Tier in both directions", async ({
    assert,
  }) => {
    // Staff configure events by hand; buying a bundle is not a reason to lose
    // the ability to turn one thing on or off.
    const on = mockCtx({ features: { callbacks: true }, eventTier: "core" });
    await new OrgFeatureMiddleware().handle(on.ctx, on.next, "callbacks");
    assert.isTrue(on.state.nextCalled);

    const off = mockCtx({
      features: { check_in: false },
      eventTier: "enterprise",
    });
    await new OrgFeatureMiddleware().handle(off.ctx, off.next, "check_in");
    assert.isFalse(off.state.nextCalled);
    assert.isNotNull(off.state.notFoundBody);
  });

  test("404s when no event was resolved and nothing was overridden", async ({
    assert,
  }) => {
    const { ctx, state, next } = mockCtx({ features: {} });
    await new OrgFeatureMiddleware().handle(ctx, next, "callbacks");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });
});

test.group("OrgFeatureMiddleware — org-wide configuration", () => {
  test("allows when the org's flag is true", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({ features: { freeTierUsers: true } });
    await new OrgFeatureMiddleware().handle(ctx, next, "freeTierUsers");
    assert.isTrue(state.nextCalled);
    assert.isNull(state.notFoundBody);
  });

  test("404s when the org's flag is false", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      features: { freeTierUsers: false },
    });
    await new OrgFeatureMiddleware().handle(ctx, next, "freeTierUsers");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });

  test("404s when the flag is missing from features", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({
      features: { something_else: true },
    });
    await new OrgFeatureMiddleware().handle(ctx, next, "freeTierUsers");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });

  test("404s when ctx.org is missing entirely", async ({ assert }) => {
    const { ctx, state, next } = mockCtx({ features: null });
    await new OrgFeatureMiddleware().handle(ctx, next, "freeTierUsers");
    assert.isFalse(state.nextCalled);
    assert.isNotNull(state.notFoundBody);
  });
});
