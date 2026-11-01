import { describe, expect, it } from "vitest";

import { dashboardLink, type MyOrg } from "./org-dashboard-link";

const org = (
  role: MyOrg["role"],
  type: MyOrg["type"],
): MyOrg => ({ role, type }) as MyOrg;

describe("dashboardLink", () => {
  it("sends an organizer to the admin dashboard, whatever their role", () => {
    expect(dashboardLink(org("member", "organizer"))).toEqual({
      to: "/o/$orgSlug/admin",
      label: "Admin",
    });
    expect(dashboardLink(org("admin", "organizer")).label).toBe("Admin");
  });

  it("keeps admins, coaches and dancers where they were", () => {
    expect(dashboardLink(org("admin", "coach")).label).toBe("Admin");
    expect(dashboardLink(org("member", "coach"))).toEqual({
      to: "/o/$orgSlug/coach",
      label: "Coach",
    });
    expect(dashboardLink(org("member", "dancer"))).toEqual({
      to: "/o/$orgSlug/dancer",
      label: "Dancer",
    });
  });
});
