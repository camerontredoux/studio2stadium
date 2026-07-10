import { OrgList } from "@/components/shared/org-list";
import {
  dashboardLink,
  type MyOrg,
} from "@/components/shared/org-dashboard-link";
import { $api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

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
