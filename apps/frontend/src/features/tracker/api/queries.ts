import { $api } from "@/lib/api/client";

export const trackerQueries = {
  tracker: () => $api.queryOptions("get", "/tracker"),
  // Same request as the Explore school list, so the two share a cache entry.
  schools: () =>
    $api.queryOptions(
      "get",
      "/schools",
      { params: { query: {} } },
      { staleTime: Infinity, gcTime: Infinity },
    ),
};
