import { $api } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

export const adminQueries = {
  applications: () => $api.queryOptions("get", "/admin/applications"),
  schools: () => $api.queryOptions("get", "/admin/schools"),
  schoolEvents: (username: string) =>
    $api.queryOptions("get", "/schools/{username}", {
      params: { path: { username } },
    }),
  dancers: (search: {
    page?: number;
    limit?: number;
    sortBy?:
      | "createdAt"
      | "location"
      | "gpa"
      | "gradYear"
      | "username"
      | "firstName"
      | "lastName"
      | "verified"
      | "email";
    sortDirection?: "asc" | "desc";
  }) =>
    $api.queryOptions(
      "get",
      "/admin/dancers",
      {
        params: {
          query: {
            page: search.page ?? 0,
            limit: search.limit ?? 10,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sortBy: search.sortBy as any,
            sortDirection: search.sortDirection,
          },
        },
      },
      {
        placeholderData: keepPreviousData,
      },
    ),
  dancerStats: () => $api.queryOptions("get", "/admin/dancers/stats"),
  orgs: () => $api.queryOptions("get", "/admin/orgs"),
  orgMembers: (orgId: string) =>
    $api.queryOptions("get", "/admin/orgs/{id}/members", {
      params: { path: { id: orgId } },
    }),
};
