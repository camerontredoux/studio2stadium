import { $api } from "@/lib/api/client";

export const adminQueries = {
  applications: () => $api.queryOptions("get", "/admin/applications"),
  schools: () => $api.queryOptions("get", "/admin/schools"),
  schoolEvents: (username: string) =>
    $api.queryOptions("get", "/schools/{username}", {
      params: { path: { username } },
    }),
};
