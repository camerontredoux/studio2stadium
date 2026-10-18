import { $api } from "@/lib/api/client";
import { keepPreviousData } from "@tanstack/react-query";

export const adminQueries = {
  // Refetch on tab focus so an admin who leaves the page open sees new
  // applications and signups without reloading.
  applications: () =>
    $api.queryOptions("get", "/admin/applications", undefined, {
      refetchOnWindowFocus: true,
    }),
  unsubmittedSchools: () =>
    $api.queryOptions("get", "/admin/unsubmitted-schools", undefined, {
      refetchOnWindowFocus: true,
    }),
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
            sortBy: search.sortBy,
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
