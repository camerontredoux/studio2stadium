import type { ApiSchemas } from "@/lib/api/client";
import { grantsOrgAdmin } from "@/lib/access";

export type MyOrg = ApiSchemas["UsersMeOrgsResponse"][number];

/**
 * Where this org's tile links to, and what it calls the person. An Organizer
 * administers the org whatever their `role` says (ADR 0003), so they get the
 * admin dashboard rather than falling through to the dancer default — and are
 * never labelled Coach or Dancer, terms that mean something specific here.
 */
export function dashboardLink(org: MyOrg) {
  if (grantsOrgAdmin({ role: org.role ?? "member", type: org.type })) {
    return { to: "/o/$orgSlug/admin" as const, label: "Admin" };
  }
  if (org.type === "coach") {
    return { to: "/o/$orgSlug/coach" as const, label: "Coach" };
  }
  return { to: "/o/$orgSlug/dancer" as const, label: "Dancer" };
}
