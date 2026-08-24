import { test } from "@japa/runner";
import {
  grantsOrgAdmin,
  hasMemberType,
  resolveEffectiveMembership,
  type OrgMembershipLike,
} from "./membership.ts";

const m = (
  type: OrgMembershipLike["type"],
  role: OrgMembershipLike["role"] = "member"
): OrgMembershipLike => ({ role, type });

test.group("grantsOrgAdmin", () => {
  test("an organizer administers the org whatever its role column says", ({
    assert,
  }) => {
    assert.isTrue(grantsOrgAdmin(m("organizer")));
    assert.isTrue(grantsOrgAdmin(m("organizer", "admin")));
  });

  test("role=admin still grants admin for coaches and dancers", ({
    assert,
  }) => {
    assert.isTrue(grantsOrgAdmin(m("coach", "admin")));
    assert.isTrue(grantsOrgAdmin(m("dancer", "admin")));
  });

  test("a plain coach or dancer member is not an admin", ({ assert }) => {
    assert.isFalse(grantsOrgAdmin(m("coach")));
    assert.isFalse(grantsOrgAdmin(m("dancer")));
    assert.isFalse(grantsOrgAdmin(null));
  });
});

test.group("hasMemberType", () => {
  test("finds a type across every membership the user holds", ({ assert }) => {
    const rows = [m("organizer"), m("coach")];
    assert.isTrue(hasMemberType(rows, "coach"));
    assert.isTrue(hasMemberType(rows, "organizer"));
    assert.isFalse(hasMemberType(rows, "dancer"));
  });

  test("an organizer alone is not a coach", ({ assert }) => {
    assert.isFalse(hasMemberType([m("organizer")], "coach"));
  });
});

test.group("resolveEffectiveMembership", () => {
  test("returns null when the user holds no membership", ({ assert }) => {
    assert.isNull(resolveEffectiveMembership([]));
  });

  test("prefers the organizer membership over a coach one", ({ assert }) => {
    assert.equal(
      resolveEffectiveMembership([m("coach"), m("organizer")])?.type,
      "organizer"
    );
  });

  test("keeps the organizer when they also coach as an org admin", ({
    assert,
  }) => {
    const resolved = resolveEffectiveMembership([
      m("coach", "admin"),
      m("organizer"),
    ]);
    assert.equal(resolved?.type, "organizer");
  });

  test("prefers a role=admin coach over a plain dancer membership", ({
    assert,
  }) => {
    const resolved = resolveEffectiveMembership([
      m("dancer"),
      m("coach", "admin"),
    ]);
    assert.equal(resolved?.type, "coach");
    assert.equal(resolved?.role, "admin");
  });

  test("is unchanged for a user holding a single membership", ({ assert }) => {
    assert.deepEqual(resolveEffectiveMembership([m("dancer")]), m("dancer"));
  });
});
