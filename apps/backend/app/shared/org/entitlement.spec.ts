import { test } from "@japa/runner";
import {
  describeCapabilities,
  includesCapability,
  readCapabilityOverride,
  readCapabilityOverrides,
  resolveCapabilities,
} from "./entitlement.ts";
import {
  EVENT_TIER_CAPABILITIES,
  EVENT_TIERS,
  eventTierIncludes,
} from "./event-tiers.ts";

test.group("capability overrides", () => {
  test("an absent flag is not an override — the Event Tier decides", async ({
    assert,
  }) => {
    assert.isUndefined(readCapabilityOverride({}, "callbacks"));
    assert.isTrue(
      includesCapability(
        { eventTier: "regional", capabilityOverrides: {} },
        "callbacks"
      )
    );
    assert.isFalse(
      includesCapability(
        { eventTier: "core", capabilityOverrides: {} },
        "callbacks"
      )
    );
  });

  test("an event with no overrides includes exactly what its Event Tier does", async ({
    assert,
  }) => {
    for (const eventTier of EVENT_TIERS) {
      for (const capability of EVENT_TIER_CAPABILITIES) {
        assert.equal(
          includesCapability(
            { eventTier, capabilityOverrides: {} },
            capability
          ),
          eventTierIncludes(eventTier, capability),
          `${eventTier} ${capability}`
        );
      }
      assert.sameMembers(
        resolveCapabilities({ eventTier, capabilityOverrides: {} }),
        EVENT_TIER_CAPABILITIES.filter((c) => eventTierIncludes(eventTier, c)),
        eventTier
      );
    }
  });

  test("an explicit flag wins over the Event Tier in both directions", async ({
    assert,
  }) => {
    // Turned on for an event that did not buy it — honouring a deal.
    assert.isTrue(
      includesCapability(
        { eventTier: "core", capabilityOverrides: { callbacks: true } },
        "callbacks"
      )
    );
    // Turned off for an event that did — a customer who does not use it.
    assert.isFalse(
      includesCapability(
        { eventTier: "enterprise", capabilityOverrides: { check_in: false } },
        "check_in"
      )
    );
  });

  test("two events under one Org can carry different overrides", async ({
    assert,
  }) => {
    // Same Org, same Event Tier: the exceptions are per event (#109).
    const spring = {
      eventTier: "enterprise" as const,
      capabilityOverrides: { check_in: false },
    };
    const summer = {
      eventTier: "enterprise" as const,
      capabilityOverrides: {},
    };
    assert.isFalse(includesCapability(spring, "check_in"));
    assert.isTrue(includesCapability(summer, "check_in"));
  });

  test("a non-boolean value is not an override", async ({ assert }) => {
    // The JSONB is untyped, so anything can be in there.
    assert.isUndefined(
      readCapabilityOverride({ callbacks: "yes" }, "callbacks")
    );
    assert.isUndefined(readCapabilityOverride(null, "callbacks"));
    assert.isUndefined(readCapabilityOverride(undefined, "callbacks"));
    assert.deepEqual(
      readCapabilityOverrides({
        callbacks: "yes",
        check_in: false,
        freeTierUsers: true,
      }),
      { check_in: false }
    );
  });

  test("with no Org Event there is nothing to grant from", async ({
    assert,
  }) => {
    assert.isFalse(includesCapability(undefined, "callbacks"));
    assert.deepEqual(resolveCapabilities(undefined), []);
  });

  test("resolving gives the Event Tier's capabilities with overrides applied", async ({
    assert,
  }) => {
    assert.sameMembers(
      resolveCapabilities({
        eventTier: "regional",
        capabilityOverrides: { check_in: false, video_library: true },
      }),
      ["callbacks", "school_selections", "video_library"]
    );
  });

  test("an event migrated from an org configured before Event Tiers keeps exactly what it had", async ({
    assert,
  }) => {
    // Every Org in production had all four keys set explicitly, and every Org
    // Event is grandfathered at Enterprise. The migration copies those keys
    // onto each event, so nothing about their access changes.
    const prodigy = {
      eventTier: "enterprise" as const,
      capabilityOverrides: {
        check_in: false,
        callbacks: true,
        video_library: true,
        school_selections: true,
      },
    };
    assert.sameMembers(resolveCapabilities(prodigy), [
      "callbacks",
      "school_selections",
      "video_library",
    ]);
  });

  test("staff see which capabilities are Event Tier defaults and which are exceptions", async ({
    assert,
  }) => {
    const described = describeCapabilities({
      eventTier: "regional",
      capabilityOverrides: { check_in: false, video_library: true },
    });
    const byCapability = Object.fromEntries(
      described.map((row) => [row.capability, row])
    );

    assert.deepEqual(byCapability.callbacks, {
      capability: "callbacks",
      eventTierDefault: true,
      override: null,
      included: true,
    });
    assert.deepEqual(byCapability.check_in, {
      capability: "check_in",
      eventTierDefault: true,
      override: false,
      included: false,
    });
    assert.deepEqual(byCapability.video_library, {
      capability: "video_library",
      eventTierDefault: false,
      override: true,
      included: true,
    });
    assert.lengthOf(described, EVENT_TIER_CAPABILITIES.length);
  });
});
