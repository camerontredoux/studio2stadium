import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["resources"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
  videos: () =>
    $api.queryOptions("get", "/library", {}, { staleTime: 86400000 }),
};
