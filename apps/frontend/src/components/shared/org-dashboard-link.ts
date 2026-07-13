import type { ApiSchemas } from "@/lib/api/client";

export type MyOrg = ApiSchemas["UsersMeOrgsResponse"][number];

export function dashboardLink(org: MyOrg) {
  if (org.role === "admin") {
    return { to: "/o/$orgSlug/admin" as const, label: "Admin" };
  }
  if (org.type === "coach") {
    return { to: "/o/$orgSlug/coach" as const, label: "Coach" };
  }
  return { to: "/o/$orgSlug/dancer" as const, label: "Dancer" };
}
