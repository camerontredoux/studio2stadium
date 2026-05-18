import { OrgList } from "@/components/shared/org-list";
import { $api, type ApiSchemas } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

type MyOrg = ApiSchemas["UsersMeOrgsResponse"][number];

function dashboardLink(org: MyOrg) {
  if (org.role === "admin") {
    return { to: "/o/$orgSlug/admin" as const, label: "Admin" };
  }
  if (org.type === "coach") {
    return { to: "/o/$orgSlug/coach" as const, label: "Coach" };
  }
  return { to: "/o/$orgSlug/dancer" as const, label: "Dancer" };
}

export function ProfileOrganizations() {
  const { data, isError } = useQuery({
    ...$api.queryOptions("get", "/users/me/orgs"),
    retry: false,
    throwOnError: false,
  });

  if (isError || !data || data.length === 0) return null;

  return (
    <OrgList
      orgs={data}
      getLink={(org) => {
        const target = dashboardLink(org as MyOrg);
        return { to: target.to, subtitle: target.label };
      }}
    />
  );
}
