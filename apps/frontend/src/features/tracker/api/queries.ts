import { $api } from "@/lib/api/client";

export const trackerQueries = {
  tracker: () => $api.queryOptions("get", "/tracker"),
  // Upcoming events a clinic item can link, only `schoolId`'s when given.
  events: (schoolId: string | null) =>
    $api.queryOptions("get", "/tracker/events", {
      params: { query: schoolId ? { schoolId } : {} },
    }),
  // Same request as the Explore school list, so the two share a cache entry.
  schools: () =>
    $api.queryOptions(
      "get",
      "/schools",
      { params: { query: {} } },
      { staleTime: Infinity, gcTime: Infinity },
    ),
};
