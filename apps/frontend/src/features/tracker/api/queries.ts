import { $api } from "@/lib/api/client";

export const trackerQueries = {
  tracker: () => $api.queryOptions("get", "/tracker"),
  // Upcoming events a clinic item can link, only `schoolId`'s when given.
  events: (schoolId: string | null) =>
    $api.queryOptions("get", "/tracker/events", {
      params: { query: schoolId ? { schoolId } : {} },
    }),
  // The dancer's own profile, for their grad year. Same request as the
  // profile page, so the two share a cache entry.
  dancer: (username: string) =>
    $api.queryOptions("get", "/dancers/{username}", {
      params: { path: { username } },
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
