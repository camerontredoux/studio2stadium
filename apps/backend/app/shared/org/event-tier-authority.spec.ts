import { test } from "@japa/runner";
import {
  assertEventTierWrite,
  EventTierForbiddenError,
  EventTierPurchaseRequiredError,
  EventTierRequiredError,
  isEventTierStaff,
  assertMayCreateOrgEvent,
} from "./event-tier-authority.ts";

test.group("Event Tier authority", () => {
  test("only a site admin counts as S2S staff", ({ assert }) => {
    assert.isTrue(isEventTierStaff({ role: "admin" }));
    assert.isFalse(isEventTierStaff({ role: "user" }));
    assert.isFalse(isEventTierStaff({ role: "prodigy_admin" }));
  });

  test("staff may set an Event Tier on create and update", ({ assert }) => {
    assert.doesNotThrow(() =>
      assertEventTierWrite({ isStaff: true, eventTier: "core", mode: "create" })
    );
    assert.doesNotThrow(() =>
      assertEventTierWrite({ isStaff: true, eventTier: "core", mode: "update" })
    );
  });

  test("staff must choose one on create but may leave it out on update", ({
    assert,
  }) => {
    assert.throws(
      () =>
        assertEventTierWrite({
          isStaff: true,
          eventTier: undefined,
          mode: "create",
        }),
      EventTierRequiredError
    );
    assert.doesNotThrow(() =>
      assertEventTierWrite({
        isStaff: true,
        eventTier: undefined,
        mode: "update",
      })
    );
  });

  test("anyone else may not send an Event Tier at all", ({ assert }) => {
    for (const mode of ["create", "update"] as const) {
      assert.throws(
        () => assertEventTierWrite({ isStaff: false, eventTier: "core", mode }),
        EventTierForbiddenError
      );
      assert.doesNotThrow(() =>
        assertEventTierWrite({ isStaff: false, eventTier: undefined, mode })
      );
    }
  });
});

test.group("Who may create an Org Event", () => {
  test("a self-serve Org's Organizers cannot create events", ({ assert }) => {
    assert.throws(
      () => assertMayCreateOrgEvent({ isStaff: false, orgIsSelfServe: true }),
      EventTierPurchaseRequiredError
    );
  });

  test("a grandfathered Org's Organizers can, and staff can anywhere", ({
    assert,
  }) => {
    assert.doesNotThrow(() =>
      assertMayCreateOrgEvent({ isStaff: false, orgIsSelfServe: false })
    );
    assert.doesNotThrow(() =>
      assertMayCreateOrgEvent({ isStaff: true, orgIsSelfServe: true })
    );
  });
});
