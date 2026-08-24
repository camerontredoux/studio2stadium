import { test } from "@japa/runner";
import {
  EVENT_TIERS,
  EVENT_TIER_CAPABILITIES,
  EVENT_TIER_DEFINITIONS,
  DEFAULT_MAX_SCHOOL_SELECTIONS,
  eventTierIncludes,
  eventTierLimits,
} from "./event-tiers.ts";
import { DEFAULT_MAX_CALLBACKS_PER_COACH } from "./max-callbacks.ts";

test.group("Event Tiers", () => {
  test("the four sold names are the ones on the pricing page", async ({
    assert,
  }) => {
    assert.deepEqual(
      [...EVENT_TIERS],
      ["core", "regional", "national", "enterprise"]
    );
  });

  test("each Event Tier includes everything the one below it does", async ({
    assert,
  }) => {
    for (let i = 1; i < EVENT_TIERS.length; i++) {
      const lower = EVENT_TIERS[i - 1]!;
      const higher = EVENT_TIERS[i]!;
      for (const capability of EVENT_TIER_DEFINITIONS[lower].capabilities) {
        assert.isTrue(
          eventTierIncludes(higher, capability),
          `${higher} should include ${capability} because ${lower} does`
        );
      }
    }
  });

  test("Core includes none of the gated capabilities", async ({ assert }) => {
    for (const capability of EVENT_TIER_CAPABILITIES) {
      assert.isFalse(eventTierIncludes("core", capability));
    }
  });

  test("Regional includes the day-of tools but not the video library", async ({
    assert,
  }) => {
    assert.isTrue(eventTierIncludes("regional", "check_in"));
    assert.isTrue(eventTierIncludes("regional", "school_selections"));
    assert.isTrue(eventTierIncludes("regional", "callbacks"));
    assert.isFalse(eventTierIncludes("regional", "video_library"));
  });

  test("National adds the video library", async ({ assert }) => {
    assert.isTrue(eventTierIncludes("national", "video_library"));
  });

  test("Enterprise includes every gated capability", async ({ assert }) => {
    for (const capability of EVENT_TIER_CAPABILITIES) {
      assert.isTrue(eventTierIncludes("enterprise", capability));
    }
  });

  test("an included capability is bounded by the limit shipped today", async ({
    assert,
  }) => {
    for (const eventTier of EVENT_TIERS) {
      const limits = eventTierLimits(eventTier);
      if (eventTierIncludes(eventTier, "callbacks")) {
        assert.equal(
          limits.maxCallbacksPerCoach,
          DEFAULT_MAX_CALLBACKS_PER_COACH,
          eventTier
        );
      }
      if (eventTierIncludes(eventTier, "school_selections")) {
        assert.equal(
          limits.maxSchoolSelections,
          DEFAULT_MAX_SCHOOL_SELECTIONS,
          eventTier
        );
      }
    }
  });

  test("a capability the Event Tier lacks has no limit rather than zero", async ({
    assert,
  }) => {
    // Zero would read as *unlimited* to `resolveMaxCallbacks`, which treats
    // anything below 1 as uncapped.
    for (const eventTier of EVENT_TIERS) {
      const limits = eventTierLimits(eventTier);
      if (!eventTierIncludes(eventTier, "callbacks")) {
        assert.isNull(limits.maxCallbacksPerCoach, eventTier);
      }
      if (!eventTierIncludes(eventTier, "school_selections")) {
        assert.isNull(limits.maxSchoolSelections, eventTier);
      }
    }
  });
});
