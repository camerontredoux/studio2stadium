import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["events"],
  filters: () => $api.queryOptions("get", "/schools/filters"),
  events: () => $api.queryOptions("get", "/events"),
  globalEvents: () => $api.queryOptions("get", "/events/global"),
  event: (id: string) =>
    $api.queryOptions("get", "/events/{id}", {
      params: { path: { id } },
    }),
};
