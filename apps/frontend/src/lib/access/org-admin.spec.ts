import { describe, expect, it } from "vitest";

import { grantsOrgAdmin } from "./org-admin";

describe("grantsOrgAdmin", () => {
  it("treats an organizer as an org admin whatever their role", () => {
    expect(grantsOrgAdmin({ role: "member", type: "organizer" })).toBe(true);
    expect(grantsOrgAdmin({ role: "admin", type: "organizer" })).toBe(true);
  });

  it("keeps role=admin working for coaches and dancers", () => {
    expect(grantsOrgAdmin({ role: "admin", type: "coach" })).toBe(true);
    expect(grantsOrgAdmin({ role: "admin", type: "dancer" })).toBe(true);
  });

  it("does not promote plain coach or dancer members", () => {
    expect(grantsOrgAdmin({ role: "member", type: "coach" })).toBe(false);
    expect(grantsOrgAdmin({ role: "member", type: "dancer" })).toBe(false);
    expect(grantsOrgAdmin(null)).toBe(false);
    expect(grantsOrgAdmin(undefined)).toBe(false);
  });
});
