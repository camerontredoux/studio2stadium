import { $api } from "@/lib/api/client";

export const queries = {
  all: () => ["dancer"],
  details: (username: string) => [...queries.all(), username],
  detail: (username: string) =>
    $api.queryOptions("get", "/dancers/{username}", {
      params: { path: { username } },
    }),
};
