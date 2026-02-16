import { $api } from "@/lib/api/client";

export const eventQueries = {
  filters: () => $api.queryOptions("get", "/schools/filters"),
  events: () => $api.queryOptions("get", "/events"),
  upcoming: () => $api.queryOptions("get", "/events/upcoming"),
  globalEvents: () => $api.queryOptions("get", "/events/global"),
  event: (id: string) =>
    $api.queryOptions("get", "/events/{id}", {
      params: { path: { id } },
    }),
};
