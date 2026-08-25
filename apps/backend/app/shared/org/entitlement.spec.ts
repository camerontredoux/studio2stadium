import { test } from "@japa/runner";
import {
  includesCapability,
  readCapabilityOverride,
  resolveCapabilities,
} from "./entitlement.ts";

test.group("capability overrides", () => {
  test("an absent flag is not an override — the Event Tier decides", async ({
    assert,
  }) => {
    assert.isUndefined(readCapabilityOverride({}, "callbacks"));
    assert.isTrue(
      includesCapability({
        features: {},
        eventTier: "regional",
        capability: "callbacks",
      })
    );
    assert.isFalse(
      includesCapability({
        features: {},
        eventTier: "core",
        capability: "callbacks",
      })
    );
  });

  test("an explicit flag wins over the Event Tier in both directions", async ({
    assert,
  }) => {
    // Turned on for an event that did not buy it — honouring a deal.
    assert.isTrue(
      includesCapability({
        features: { callbacks: true },
        eventTier: "core",
        capability: "callbacks",
      })
    );
    // Turned off for an event that did — a customer who does not use it.
    assert.isFalse(
      includesCapability({
        features: { check_in: false },
        eventTier: "enterprise",
        capability: "check_in",
      })
    );
  });

  test("a non-boolean value is not an override", async ({ assert }) => {
    // The JSONB is untyped, so anything can be in there.
    assert.isUndefined(
      readCapabilityOverride({ callbacks: "yes" }, "callbacks")
    );
    assert.isUndefined(readCapabilityOverride(null, "callbacks"));
    assert.isUndefined(readCapabilityOverride(undefined, "callbacks"));
  });

  test("an override applies even when no event was resolved", async ({
    assert,
  }) => {
    // Explicit is explicit; without one there is nothing to grant from.
    assert.isTrue(
      includesCapability({
        features: { callbacks: true },
        eventTier: undefined,
        capability: "callbacks",
      })
    );
    assert.isFalse(
      includesCapability({
        features: {},
        eventTier: undefined,
        capability: "callbacks",
      })
    );
  });

  test("resolving gives the Event Tier's capabilities with overrides applied", async ({
    assert,
  }) => {
    assert.sameMembers(resolveCapabilities({}, "regional"), [
      "callbacks",
      "check_in",
      "school_selections",
    ]);
    assert.sameMembers(
      resolveCapabilities({ check_in: false, video_library: true }, "regional"),
      ["callbacks", "school_selections", "video_library"]
    );
    assert.deepEqual(resolveCapabilities({}, undefined), []);
  });

  test("an org configured before Event Tiers existed keeps exactly what it had", async ({
    assert,
  }) => {
    // Every Org in production has all four keys set explicitly, and every Org
    // Event is grandfathered at Enterprise. Nothing about their access changes.
    const prodigy = {
      check_in: false,
      callbacks: true,
      freeTierUsers: true,
      video_library: true,
      school_selections: true,
    };
    assert.sameMembers(resolveCapabilities(prodigy, "enterprise"), [
      "callbacks",
      "school_selections",
      "video_library",
    ]);
    assert.isFalse(
      includesCapability({
        features: prodigy,
        eventTier: "enterprise",
        capability: "check_in",
      })
    );
  });
});
